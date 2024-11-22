import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface Contact {
  [key: string]: string
  phone: string
  formattedPhone: string
  status: string
  operator: string
  messageId?: string
}

interface DataPreviewProps {
  data: Contact[]
  fileName: string | null
}

export default function DataPreview({ data, fileName }: DataPreviewProps) {
  if (!data || data.length === 0) return null

  // Filter out internal fields and ensure unique columns
  const headers = Array.from(new Set(
    Object.keys(data[0]).filter(key => 
      !['phone', 'formattedPhone', 'messageId'].includes(key)
    )
  ))

  // Ensure Phone is at the beginning and status and operator are at the end
  const reorderedHeaders = [
    'Phone',
    ...headers.filter(h => !['status', 'operator', 'Phone'].includes(h)),
    'operator',
    'status'
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVRD':
        return 'bg-green-500'
      case 'UNDELIV':
        return 'bg-red-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'FAILED':
        return 'bg-red-700'
      default:
        return 'bg-gray-500'
    }
  }

  const getOperatorColor = (operator: string) => {
    switch (operator) {
      case 'Orange':
        return 'bg-orange-500'
      case 'MTN':
        return 'bg-yellow-500'
      case 'Nexttel':
        return 'bg-blue-500'
      case 'Camtel':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Preview: {fileName}</h2>
      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {reorderedHeaders.map((header) => (
                <TableHead key={header} className="capitalize">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((contact, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {reorderedHeaders.map((header) => (
                  <TableCell key={header}>
                    {header === 'operator' ? (
                      <Badge className={getOperatorColor(contact[header])}>
                        {contact[header]}
                      </Badge>
                    ) : header === 'status' ? (
                      <Badge className={getStatusColor(contact[header])}>
                        {contact[header]}
                      </Badge>
                    ) : header === 'Phone' ? (
                      <>
                        {contact.phone}
                        {contact.formattedPhone !== contact.phone && (
                          <span className="block text-xs text-muted-foreground">
                            ({contact.formattedPhone})
                          </span>
                        )}
                      </>
                    ) : (
                      contact[header]
                    )}
                  </TableCell>
                ))}
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <p className="mt-2 text-sm text-muted-foreground">
        Showing {data.length} contacts
      </p>
    </div>
  )
}

