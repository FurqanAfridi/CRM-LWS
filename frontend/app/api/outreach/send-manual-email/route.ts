import { NextRequest, NextResponse } from 'next/server'
import { createEmailMessage } from '@/lib/supabase/queries/outreach'

// n8n webhook URL - following existing pattern (hardcoded)
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_SEND_MANUAL || 'http://auto.lincolnwaste.co/webhook/sendmails'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, subject, content } = body

    if (!lead_id || !subject || !content) {
      return NextResponse.json(
        { error: 'lead_id, subject, and content are required' },
        { status: 400 }
      )
    }

    // Call n8n webhook to send manual email
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_id,
        subject,
        content,
      }),
    })

    const n8nData = await n8nResponse.json()

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || 'Failed to send email' },
        { status: n8nResponse.status }
      )
    }

    // Create email message record in database
    const message = await createEmailMessage({
      lead_id,
      campaign_id: null,
      sequence_step: 0,
      subject,
      content,
      status: 'queued',
    })

    return NextResponse.json({
      success: true,
      message_id: message.id,
      message: 'Email queued successfully',
    })
  } catch (error: any) {
    console.error('Error sending manual email:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

