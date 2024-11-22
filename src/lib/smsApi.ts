interface SMSResponse {
  responsecode: number
  responsedescription: string
  responsemessage: string
  sms: {
    messageid: string
    smsclientid: string
    mobileno: string
    status: string
    errorcode: string
    errordescription: string
  }[]
}

interface StatusResponse {
  dlrlist: {
    reponsecode: number
    reponsedescription: string
    mobileno: string
    messageid: string
    status: string
  }[]
}

export async function sendSMS(phone: string, message: string): Promise<SMSResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SMS_API_URL}/sendsms`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: process.env.NEXT_PUBLIC_SMS_USER,
        password: process.env.NEXT_PUBLIC_SMS_PASSWORD,
        senderid: process.env.NEXT_PUBLIC_SMS_SENDER_ID,
        sms: message,
        mobiles: `237${phone}`,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid Username or Password")
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    console.log('API Response:', JSON.stringify(data, null, 2))

    if (data.responsecode === 0 && data.responsedescription === "error") {
      if (data.responsemessage === "Invalid Username or Password") {
        throw new Error("Invalid Username or Password")
      }
      throw new Error(data.responsemessage || "Error sending SMS")
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Response is not an object')
    }

    if (!Array.isArray(data.sms)) {
      throw new Error('Invalid response format: sms property is not an array')
    }

    return data as SMSResponse
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw error
  }
}

export async function filterDLR(startDate: string, endDate: string): Promise<StatusResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SMS_API_URL}/filterDLR`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: process.env.NEXT_PUBLIC_SMS_USER,
        password: process.env.NEXT_PUBLIC_SMS_PASSWORD,
        startdate: startDate,
        enddate: endDate,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid Username or Password")
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('DLR Response:', JSON.stringify(data, null, 2))

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Response is not an object')
    }

    if (!Array.isArray(data.dlrlist)) {
      throw new Error('Invalid response format: dlrlist property is not an array')
    }

    return data as StatusResponse
  } catch (error) {
    console.error('Error filtering DLR:', error)
    throw error
  }
}

