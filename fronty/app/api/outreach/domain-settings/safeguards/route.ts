import { NextRequest, NextResponse } from 'next/server'
import { getDeliverabilityThresholds, updateDeliverabilityThresholds, createDeliverabilityThresholds } from '@/lib/supabase/queries/outreach'

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

    const thresholds = await getDeliverabilityThresholds(domain)

    return NextResponse.json({
      success: true,
      thresholds: thresholds || null,
    })
  } catch (error: any) {
    console.error('Error fetching deliverability safeguards:', error)
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
      bounce_rate_warning,
      bounce_rate_critical,
      spam_complaint_warning,
      spam_complaint_critical,
      min_reputation_score,
      auto_pause_enabled,
      alert_emails,
      alert_in_app,
    } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      )
    }

    // Check if thresholds exist
    const existing = await getDeliverabilityThresholds(domain)

    let thresholds
    if (existing) {
      thresholds = await updateDeliverabilityThresholds(domain, {
        bounce_rate_warning: bounce_rate_warning !== undefined ? bounce_rate_warning : existing.bounce_rate_warning,
        bounce_rate_critical: bounce_rate_critical !== undefined ? bounce_rate_critical : existing.bounce_rate_critical,
        spam_complaint_warning: spam_complaint_warning !== undefined ? spam_complaint_warning : existing.spam_complaint_warning,
        spam_complaint_critical: spam_complaint_critical !== undefined ? spam_complaint_critical : existing.spam_complaint_critical,
        min_reputation_score: min_reputation_score !== undefined ? min_reputation_score : existing.min_reputation_score,
        auto_pause_enabled: auto_pause_enabled !== undefined ? auto_pause_enabled : existing.auto_pause_enabled,
        alert_emails: alert_emails !== undefined ? alert_emails : existing.alert_emails,
        alert_in_app: alert_in_app !== undefined ? alert_in_app : existing.alert_in_app,
      })
    } else {
      thresholds = await createDeliverabilityThresholds({
        domain,
        bounce_rate_warning: bounce_rate_warning || 2.0,
        bounce_rate_critical: bounce_rate_critical || 5.0,
        spam_complaint_warning: spam_complaint_warning || 0.1,
        spam_complaint_critical: spam_complaint_critical || 0.5,
        min_reputation_score: min_reputation_score || 60,
        auto_pause_enabled: auto_pause_enabled !== undefined ? auto_pause_enabled : true,
        alert_emails: alert_emails || [],
        alert_in_app: alert_in_app !== undefined ? alert_in_app : true,
      })
    }

    return NextResponse.json({
      success: true,
      thresholds,
      message: 'Deliverability safeguards updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating deliverability safeguards:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

