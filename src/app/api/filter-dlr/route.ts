import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { startDate, endDate } = await req.json();

  try {
    const response = await fetch(`${process.env.SMS_API_URL}/filterDLR`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: process.env.SMS_USER,
        password: process.env.SMS_PASSWORD,
        startdate: startDate,
        enddate: endDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object' || !Array.isArray(data.dlrlist)) {
      throw new Error('Invalid response format');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error filtering DLR:', error);
    return NextResponse.json({ error: 'Failed to filter DLR' }, { status: 500 });
  }
}

