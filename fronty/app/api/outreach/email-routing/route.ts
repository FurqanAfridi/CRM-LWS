import { NextRequest, NextResponse } from 'next/server'
import { getEmailRoutingRules, createEmailRoutingRule, updateEmailRoutingRule, deleteEmailRoutingRule } from '@/lib/supabase/queries/outreach'

export async function GET(request: NextRequest) {
  try {
    const rules = await getEmailRoutingRules()

    return NextResponse.json({
      success: true,
      rules,
    })
  } catch (error: any) {
    console.error('Error fetching email routing rules:', error)
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
      trigger_event,
      conditions,
      action_type,
      recipient_email,
      template_id,
      priority,
      is_active = true,
    } = body

    if (!trigger_event || !action_type || !recipient_email) {
      return NextResponse.json(
        { error: 'trigger_event, action_type, and recipient_email are required' },
        { status: 400 }
      )
    }

    const rule = await createEmailRoutingRule({
      trigger_event,
      conditions: conditions || {},
      action_type,
      recipient_email,
      template_id,
      priority: priority || 0,
      is_active,
    })

    return NextResponse.json({
      success: true,
      rule,
      message: 'Email routing rule created successfully',
    })
  } catch (error: any) {
    console.error('Error creating email routing rule:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      trigger_event,
      conditions,
      action_type,
      recipient_email,
      template_id,
      priority,
      is_active,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (trigger_event !== undefined) updates.trigger_event = trigger_event
    if (conditions !== undefined) updates.conditions = conditions
    if (action_type !== undefined) updates.action_type = action_type
    if (recipient_email !== undefined) updates.recipient_email = recipient_email
    if (template_id !== undefined) updates.template_id = template_id
    if (priority !== undefined) updates.priority = priority
    if (is_active !== undefined) updates.is_active = is_active

    const rule = await updateEmailRoutingRule(id, updates)

    return NextResponse.json({
      success: true,
      rule,
      message: 'Email routing rule updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating email routing rule:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    await deleteEmailRoutingRule(id)

    return NextResponse.json({
      success: true,
      message: 'Email routing rule deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting email routing rule:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

