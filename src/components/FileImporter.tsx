'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, XCircle, Send, RefreshCw, X, Upload } from 'lucide-react'
import DataPreview from './DataPreview'
import { sendSMS, filterDLR } from '@/lib/smsApi'
import { appConfig } from '@/config/appConfig'
import { validatePhoneNumber } from '@/lib/utils'

interface Contact {
  [key: string]: string
  phone: string
  formattedPhone: string
  status: string
  operator: string
  messageId?: string
}

interface AppState {
  data: Contact[] | null
  fileName: string | null
  lastUpdateTime: string | null
  customTemplate: string
  availableParams: string[]
}

export default function FileImporter() {
  const [data, setData] = useState<Contact[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [successfulSends, setSuccessfulSends] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [customTemplate, setCustomTemplate] = useState<string>(appConfig.smsTemplate)
  const [availableParams, setAvailableParams] = useState<string[]>([])
  const [templateErrors, setTemplateErrors] = useState<string[]>([])
  const [fileErrors, setFileErrors] = useState<string[]>([])

  useEffect(() => {
    const savedState = localStorage.getItem('bulkSMSAppState')
    if (savedState) {
      try {
        const parsedState: AppState = JSON.parse(savedState)
        setData(parsedState.data)
        setFileName(parsedState.fileName)
        setLastUpdateTime(parsedState.lastUpdateTime ? new Date(parsedState.lastUpdateTime) : null)
        setCustomTemplate(parsedState.customTemplate || appConfig.smsTemplate)
        setAvailableParams(parsedState.availableParams || [])
      } catch (error) {
        console.error('Error parsing saved state:', error)
        setApiError('Error loading saved state. Please try importing your file again.')
      }
    }
  }, [])

  useEffect(() => {
    try {
      const stateToSave: AppState = {
        data,
        fileName,
        lastUpdateTime: lastUpdateTime ? lastUpdateTime.toISOString() : null,
        customTemplate,
        availableParams
      }
      localStorage.setItem('bulkSMSAppState', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Error saving state:', error)
      setApiError('Error saving application state. Your progress may not be saved.')
    }
  }, [data, fileName, lastUpdateTime, customTemplate, availableParams])

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result
          if (typeof content === 'string') {
            if (file.name.endsWith('.csv')) {
              const { contacts, headers, errors } = parseCSV(content)
              if (errors.length > 0) {
                setFileErrors(errors)
              } else {
                setData(contacts)
                setAvailableParams(headers)
                setFileErrors([])
              }
            } else if (file.name.endsWith('.xlsx')) {
              const { contacts, headers, errors } = parseXLSX(content)
              if (errors.length > 0) {
                setFileErrors(errors)
              } else {
                setData(contacts)
                setAvailableParams(headers)
                setFileErrors([])
              }
            } else {
              throw new Error('Unsupported file type. Please use CSV or XLSX files.')
            }
          } else {
            throw new Error('Invalid file content')
          }
        } catch (error) {
          console.error('Error importing file:', error)
          setApiError(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        setApiError('Error reading file. Please try again.')
      }
      reader.readAsBinaryString(file)
    }
  }

  const parseCSV = (content: string): { contacts: Contact[], headers: string[], errors: string[] } => {
    const lines = content.split('\n').filter(line => line.trim() !== '')
    if (lines.length < 2) {
      return { contacts: [], headers: [], errors: ['The CSV file is empty or contains no valid data'] }
    }

    const headers = lines[0].split(',').map(header => header.trim())
    const phoneIndex = headers.findIndex(header => header.toLowerCase() === 'phone')
    if (phoneIndex === -1) {
      return { contacts: [], headers: [], errors: ["The 'Phone' column is required."] }
    }

    const dataRows = lines.slice(1)
    const contacts: Contact[] = []
    const errors: string[] = []

    dataRows.forEach((line, index) => {
      const values = line.split(',')
      if (values.length !== headers.length) {
        errors.push(`Row ${index + 2} has an incorrect number of columns.`)
        return
      }

      const contact: Contact = { phone: values[phoneIndex].trim(), formattedPhone: '', status: 'Not sent', operator: '' }
      headers.forEach((header, i) => {
        if (i !== phoneIndex) {
          contact[header] = (values[i] || '').trim()
        }
      })
      contacts.push(validateAndFormatContact(contact))
    })

    return { contacts, headers, errors }
  }

  const parseXLSX = (content: string): { contacts: Contact[], headers: string[], errors: string[] } => {
    const workbook = XLSX.read(content, { type: 'binary' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    if (range.e.r < 1) {
      return { contacts: [], headers: [], errors: ['No data rows found in the file'] }
    }

    const xlsxData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
      header: 1,
      blankrows: false
    }) as string[][]

    const headers = xlsxData[0]
    const phoneIndex = headers.findIndex(header => header.toLowerCase() === 'phone')
    if (phoneIndex === -1) {
      return { contacts: [], headers: [], errors: ["The 'Phone' column is required."] }
    }

    const rows = xlsxData.slice(1).filter(row => row.some(cell => cell !== ''))
    const contacts: Contact[] = []
    const errors: string[] = []

    rows.forEach((row, index) => {
      if (row.length !== headers.length) {
        errors.push(`Row ${index + 2} has an incorrect number of columns.`)
        return
      }

      const contact: Contact = { phone: row[phoneIndex].trim(), formattedPhone: '', status: 'Not sent', operator: '' }
      headers.forEach((header, i) => {
        if (i !== phoneIndex) {
          contact[header] = (row[i] || '').toString().trim()
        }
      })
      contacts.push(validateAndFormatContact(contact))
    })

    return { contacts, headers, errors }
  }

  const validateAndFormatContact = (contact: Contact): Contact => {
    const { isValid, operator, formattedPhone } = validatePhoneNumber(contact.phone)

    return {
      ...contact,
      formattedPhone: isValid ? formattedPhone : `Invalid: ${contact.phone}`,
      operator: operator
    }
  }

  const validateTemplate = (template: string) => {
    const paramRegex = /\[+([^\]]+)\]+/g;
    const params = template.match(paramRegex);
    const errors: string[] = [];

    if (params) {
      params.forEach(param => {
        const cleanParam = param.replace(/\[+(.+?)\]+/, '$1');
        if (!availableParams.includes(cleanParam)) {
          errors.push(`Invalid parameter in template: ${param}`);
        }
        if (param.startsWith('[[') || param.endsWith(']]')) {
          errors.push(`Incorrect parameter syntax: ${param}. Use single square brackets, e.g., [${cleanParam}]`);
        }
      });
    }

    setTemplateErrors(errors);
  }

  const handleSend = async () => {
    if (!data || !selectedOperator || templateErrors.length > 0) return

    setIsSending(true)
    setSendProgress(0)
    setSuccessfulSends(0)
    setApiError(null)

    const validContacts = data.filter(contact => 
      (selectedOperator === 'All' || contact.operator === selectedOperator) && 
      !contact.formattedPhone.startsWith('Invalid')
    )

    try {
      const totalContacts = validContacts.length
      let sentCount = 0

      const updatedData = await Promise.all(validContacts.map(async (contact) => {
        const message = customTemplate.replace(/\[+([^\]]+)\]+/g, (match, param) => {
          const cleanParam = param.replace(/\[+(.+?)\]+/, '$1');
          return contact[cleanParam] || match;
        });
        try {
          const response = await sendSMS(contact.formattedPhone, message)
          sentCount++
          setSuccessfulSends(prev => prev + 1)
          setSendProgress(Math.round((sentCount / totalContacts) * 100))
          
          if (response && response.sms && response.sms[0] && response.sms[0].messageid) {
            return {
              ...contact,
              status: 'PENDING',
              messageId: response.sms[0].messageid,
            }
          } else {
            console.error(`Invalid response format for ${contact.formattedPhone}:`, response)
            throw new Error(`Invalid response format for ${contact.formattedPhone}`)
          }
        } catch (error) {
          console.error(`Failed to send SMS to ${contact.formattedPhone}:`, error)
          if (error instanceof Error && error.message === "Invalid Username or Password") {
            throw error; // Re-throw authentication errors to be caught in the outer try-catch
          }
          return {
            ...contact,
            status: 'FAILED',
          }
        }
      }))

      setData(prevData => prevData ? prevData.map(contact => {
        const updatedContact = updatedData.find(c => c.phone === contact.phone)
        return updatedContact || contact
      }) : null)
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('Error sending SMS:', error)
      if (error instanceof Error && error.message === "Invalid Username or Password") {
        setApiError("Authentication failed. Please check your SMS API credentials in the .env.local file.")
      } else {
        setApiError(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsSending(false)
      setSendProgress(100)
    }
  }

  const checkStatus = async () => {
    try {
      if (data) {
        const now = new Date()
        const startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
        const response = await filterDLR(
          startDate.toISOString().split('T')[0] + ' 00:00:00',
          now.toISOString().split('T')[0] + ' 23:59:59'
        )

        const updatedData = data.map(contact => {
          const dlrResult = response.dlrlist.find(dlr => dlr.messageid === contact.messageId)
          if (dlrResult) {
            return {
              ...contact,
              status: dlrResult.status,
            }
          }
          return contact
        })

        setData(updatedData)
        setLastUpdateTime(new Date())
      }
    } catch (error) {
      console.error('Error during status check:', error)
      setApiError(`Failed to check message statuses: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    const statusCheck = async () => {
      try {
        await checkStatus()
      } catch (error) {
        console.error('Error in status check interval:', error)
        setApiError(`Error checking message statuses: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (data && data.some(contact => contact.status === 'PENDING')) {
      interval = setInterval(statusCheck, 10000) // Check every 10 seconds
    }

    return () => clearInterval(interval)
  }, [data])

  const handleCancel = () => {
    setData(null)
    setFileName(null)
    setLastUpdateTime(null)
    setSendProgress(0)
    setSuccessfulSends(0)
    setApiError(null)
    setSelectedOperator(null)
    setCustomTemplate(appConfig.smsTemplate)
    setAvailableParams([])
    setTemplateErrors([])
    setFileErrors([])
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      {(apiError || fileErrors.length > 0) && (
        <Alert variant="destructive" className="mb-4 sticky top-0 z-50 border border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-start justify-between">
            <span>
              {apiError}
              {fileErrors.map((error, index) => (
                <p key={index} className="mt-2">{error}</p>
              ))}
              {apiError && apiError.includes("Authentication failed") && (
                <p className="mt-2">
                  Please check your SMS API credentials in the .env.local file and ensure they are correct.
                </p>
              )}
            </span>
            <Button
              variant="ghost"
              className="p-0 h-auto hover:bg-transparent"
              onClick={() => {
                setApiError(null)
                setFileErrors([])
              }}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/2">
          <AnimatePresence mode="wait">
            {!data ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Label htmlFor="file-upload" className="block text-lg mb-2">
                  Choose a file to import (CSV or XLSX)
                </Label>
                <div className="relative">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose a file
                  </Label>
                  <span className="ml-3">{fileName || 'No file chosen'}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.5 }}
              >
                <DataPreview data={data} fileName={fileName} />
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1">
                      <Select onValueChange={(value) => setSelectedOperator(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Operators</SelectItem>
                          <SelectItem value="Orange">Orange</SelectItem>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="Nexttel">Nexttel</SelectItem>
                          <SelectItem value="Camtel">Camtel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={isSending || !selectedOperator || templateErrors.length > 0}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send SMS
                    </Button>
                    <Button
                      onClick={checkStatus}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
                {isSending && (
                  <div className="mt-4">
                    <Progress value={sendProgress} className="w-full" />
                    <p className="text-sm text-center mt-2">{sendProgress}% Complete</p>
                  </div>
                )}
                {!isSending && sendProgress > 0 && (
                  <div className="mt-4">
                    <Progress value={100} className="w-full" />
                    <p className="text-sm text-center mt-2">
                      Sending complete: {successfulSends} out of {data.length} messages sent successfully
                    </p>
                  </div>
                )}
                {lastUpdateTime && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last updated: {lastUpdateTime.toLocaleString()}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full lg:w-1/2">
          <div className="sticky top-4">
            <Label htmlFor="sms-template" className="text-lg font-semibold mb-2 block">SMS Template</Label>
            <Textarea
              id="sms-template"
              placeholder="Enter your custom SMS template here. Use [ColumnName] as placeholders for values from your imported data."
              value={customTemplate}
              onChange={(e) => {
                setCustomTemplate(e.target.value)
                validateTemplate(e.target.value)
              }}
              rows={6}
              className={`mb-4 ${templateErrors.length > 0 ? 'border-red-500' : ''}`}
            />
            {templateErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Error</AlertTitle>
                <AlertDescription>
                  {templateErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            <div className="text-sm">
              <p className="font-semibold mb-2">Available parameters:</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{availableParams.join(', ')}</p>
              </div>
            </div>
            <div className="text-sm mt-4">
              <p className="font-semibold mb-2">How to use parameters:</p>
              <ul className="list-disc list-inside bg-muted p-4 rounded-md">
                <li>Use single square brackets: [ParameterName]</li>
                <li>Parameters are case-sensitive</li>
                <li>Available parameters are listed above</li>
              </ul>
            </div>
            <div className="text-sm mt-4">
              <p className="font-semibold mb-2">Default template:</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{appConfig.smsTemplate}</p>
              </div>
            </div>
            {customTemplate !== appConfig.smsTemplate && (
              <p className="text-sm text-muted-foreground mt-2">
                You are using a custom template.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

