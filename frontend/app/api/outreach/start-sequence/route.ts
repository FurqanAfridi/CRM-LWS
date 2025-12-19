import { NextRequest, NextResponse } from 'next/server'
import { createEmailCampaign } from '@/lib/supabase/queries/outreach'

// n8n webhook URL - following existing pattern (hardcoded)
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_START_SEQUENCE || 'http://auto.lincolnwaste.co/webhook/startsequence'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, sequence_id, sequence_template_id } = body

    if (!lead_id || !sequence_id) {
      return NextResponse.json(
        { error: 'lead_id and sequence_id are required' },
        { status: 400 }
      )
    }

    // Call n8n webhook to start sequence
    let n8nData
    try {
      // Build URL with query parameters for GET request
      const url = new URL(N8N_WEBHOOK_URL)
      url.searchParams.append('lead_id', lead_id)
      url.searchParams.append('sequence_id', sequence_id)
      
      console.log('Calling n8n webhook (GET):', url.toString())
      console.log('Webhook payload (query params):', { lead_id, sequence_id })
      
      const n8nResponse = await fetch(url.toString(), {
        method: 'GET',
      })
      
      console.log('Webhook response status:', n8nResponse.status)

      n8nData = await n8nResponse.json().catch(() => ({}))

      if (!n8nResponse.ok) {
        return NextResponse.json(
          { error: n8nData?.error || n8nData?.message || 'Failed to start sequence' },
          { status: n8nResponse.status }
        )
      }
    } catch (webhookError: any) {
      console.error('Error calling n8n webhook:', webhookError)
      // Continue to create campaign even if webhook fails (webhook is async trigger)
      // The webhook will process the sequence, but we still create the campaign record
    }

    // Create campaign record in database
    const campaign = await createEmailCampaign({
      lead_id,
      sequence_id,
      status: 'active',
      current_step: 0,
      started_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      message: 'Sequence started successfully',
    })
  } catch (error: any) {
    console.error('Error starting sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

