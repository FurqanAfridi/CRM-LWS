import { NextRequest, NextResponse } from 'next/server'
import { getAllCalendarIntegrations } from '@/lib/supabase/queries/outreach'

export async function GET(request: NextRequest) {
  try {
    const integrations = await getAllCalendarIntegrations()

    const status = {
      calendly: integrations.find(i => i.provider === 'calendly') || null,
      google: integrations.find(i => i.provider === 'google') || null,
      outlook: integrations.find(i => i.provider === 'outlook') || null,
    }

    return NextResponse.json({
      success: true,
      status,
      connected_count: integrations.filter(i => i.is_active).length,
    })
  } catch (error: any) {
    console.error('Error fetching calendar status:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

