# Bulk SMS Sender

A sleek and efficient application for sending SMS messages in bulk, built with Next.js and Tailwind CSS.

## Features

- Import contacts from CSV or XLSX files
- Preview and manage imported contacts
- Send personalized SMS messages to all contacts
- Real-time status updates for sent messages
- Responsive design with dark mode support

## Getting Started

### Prerequisites

- Node.js 15.x or later
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/AnonX9/bulk_sms_sender.git
   cd bulk_sms_sender
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   # or
   yarn install
   \`\`\`

3. Set up environment variables:
   Create a \`.env.local\` file in the root directory and add your SMS API credentials:
   \`\`\`
   NEXT_PUBLIC_SMS_USER=your_sms_user
   NEXT_PUBLIC_SMS_PASSWORD=your_sms_password
   NEXT_PUBLIC_SMS_SENDER_ID=your_sender_id
   NEXT_PUBLIC_SMS_API_URL=https://smsvas.com/bulk/public/index.php/api/v1
   \`\`\`

4. Run the development server:
   \`\`\`
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Click on "Choose a file" to import your contacts (CSV or XLSX format).
2. Review the imported contacts in the preview table.
3. Click "Send SMS to All" to start the bulk sending process.
4. Monitor the progress and status of sent messages.
5. Use the "Refresh Status" button to update the delivery status of sent messages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## Author

AnonX9 - [GitHub Profile](https://github.com/AnonX9/)

