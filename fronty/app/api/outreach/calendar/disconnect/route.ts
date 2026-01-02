import { NextRequest, NextResponse } from 'next/server'
import { getCalendarIntegration, updateCalendarIntegration } from '@/lib/supabase/queries/outreach'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json(
        { error: 'provider query parameter is required' },
        { status: 400 }
      )
    }

    const integration = await getCalendarIntegration(provider)
    if (!integration) {
      return NextResponse.json(
        { error: 'Calendar integration not found' },
        { status: 404 }
      )
    }

    // Deactivate integration
    await updateCalendarIntegration(integration.id, {
      is_active: false,
      access_token: null,
      refresh_token: null,
    })

    return NextResponse.json({
      success: true,
      provider,
      message: 'Calendar disconnected successfully',
    })
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

