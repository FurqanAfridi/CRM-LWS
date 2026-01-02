import { NextRequest, NextResponse } from 'next/server'
import { updateEmailCampaign } from '@/lib/supabase/queries/outreach'

// n8n webhook URL - following existing pattern (hardcoded)
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PAUSE_SEQUENCE || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id } = body

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      )
    }

    // Call n8n webhook to pause sequence
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id,
      }),
    })

    const n8nData = await n8nResponse.json()

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || 'Failed to pause sequence' },
        { status: n8nResponse.status }
      )
    }

    // Update campaign status in database
    await updateEmailCampaign(campaign_id, {
      status: 'paused',
    })

    return NextResponse.json({
      success: true,
      message: 'Sequence paused successfully',
    })
  } catch (error: any) {
    console.error('Error pausing sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

