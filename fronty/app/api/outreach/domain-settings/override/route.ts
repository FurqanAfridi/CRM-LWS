import { NextRequest, NextResponse } from 'next/server'
import { updateDomainWarmupConfig, getDomainWarmupConfig } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for warmup override
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_WARMUP_OVERRIDE || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, action, reason } = body

    if (!domain || !action) {
      return NextResponse.json(
        { error: 'domain and action (pause/resume) are required' },
        { status: 400 }
      )
    }

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "pause" or "resume"' },
        { status: 400 }
      )
    }

    const existing = await getDomainWarmupConfig(domain)
    if (!existing) {
      return NextResponse.json(
        { error: 'Domain configuration not found' },
        { status: 404 }
      )
    }

    // Update override status
    const config = await updateDomainWarmupConfig(domain, {
      manual_override: action === 'pause' ? 'paused' : 'active',
      override_reason: reason || null,
      override_at: new Date().toISOString(),
    })

    // Notify n8n
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          action,
          reason,
        }),
      })
    } catch (webhookError) {
      console.warn('Failed to notify n8n of warmup override:', webhookError)
    }

    return NextResponse.json({
      success: true,
      config,
      message: `Warmup ${action}d successfully`,
    })
  } catch (error: any) {
    console.error('Error overriding warmup:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

