import { NextRequest, NextResponse } from 'next/server'
import { getDomainWarmupConfig, updateDomainWarmupConfig, createDomainWarmupConfig } from '@/lib/supabase/queries/outreach'
import { N8N_WEBHOOK_UPDATE_WARMUP } from '@/lib/supabase/env'

// n8n webhook URL for warmup schedule updates
const N8N_WEBHOOK_URL = N8N_WEBHOOK_UPDATE_WARMUP || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    const config = await getDomainWarmupConfig(domain)

    return NextResponse.json({
      success: true,
      config: config || null,
    })
  } catch (error: any) {
    console.error('Error fetching domain settings:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      domain,
      warmup_schedule,
      reputation_target,
      daily_volume_limits,
    } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      )
    }

    // Check if config exists
    const existing = await getDomainWarmupConfig(domain)

    let config
    if (existing) {
      config = await updateDomainWarmupConfig(domain, {
        warmup_schedule: warmup_schedule || existing.warmup_schedule,
        reputation_target: reputation_target !== undefined ? reputation_target : existing.reputation_target,
        daily_volume_limits: daily_volume_limits || existing.daily_volume_limits,
      })
    } else {
      config = await createDomainWarmupConfig({
        domain,
        warmup_schedule: warmup_schedule || {},
        reputation_target: reputation_target || 80,
        daily_volume_limits: daily_volume_limits || {},
      })
    }

    // Notify n8n of schedule changes
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          warmup_schedule: config.warmup_schedule,
          daily_volume_limits: config.daily_volume_limits,
        }),
      })
    } catch (webhookError) {
      console.warn('Failed to notify n8n of warmup schedule changes:', webhookError)
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Domain settings updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating domain settings:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

