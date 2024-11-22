import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();

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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responsecode === 0 && data.responsedescription === "error") {
      throw new Error(data.responsemessage || "Error sending SMS");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}

