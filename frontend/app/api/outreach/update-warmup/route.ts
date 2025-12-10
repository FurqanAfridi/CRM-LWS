import { NextRequest, NextResponse } from 'next/server'
import { updateDomainWarmup } from '@/lib/supabase/queries/outreach'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      domain,
      day_number,
      daily_volume_sent,
      daily_volume_limit,
      reputation_score,
      spf_status,
      dkim_status,
      dmarc_status,
      bounce_rate,
      spam_complaint_rate,
      blacklist_status,
    } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      )
    }

    // Update domain warm-up in database
    const warmup = await updateDomainWarmup(domain, {
      day_number,
      daily_volume_sent,
      daily_volume_limit,
      reputation_score,
      spf_status,
      dkim_status,
      dmarc_status,
      bounce_rate,
      spam_complaint_rate,
      blacklist_status,
      last_updated: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      warmup,
      message: 'Domain warm-up updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating domain warm-up:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

