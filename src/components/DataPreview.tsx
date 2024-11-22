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
  email: string
  name: string
  phone: string
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

  const headers = ['Email', 'Name', 'Phone', 'Operator', 'Status']

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
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
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
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <Badge className={getOperatorColor(contact.operator)}>
                    {contact.operator}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                </TableCell>
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

