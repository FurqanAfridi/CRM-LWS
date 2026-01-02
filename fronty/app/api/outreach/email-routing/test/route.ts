import { NextRequest, NextResponse } from 'next/server'
import { getEmailRoutingRuleById } from '@/lib/supabase/queries/outreach'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rule_id, test_event } = body

    if (!rule_id || !test_event) {
      return NextResponse.json(
        { error: 'rule_id and test_event are required' },
        { status: 400 }
      )
    }

    const rule = await getEmailRoutingRuleById(rule_id)
    if (!rule) {
      return NextResponse.json(
        { error: 'Routing rule not found' },
        { status: 404 }
      )
    }

    // Evaluate rule conditions
    const conditions = rule.conditions as any
    let matches = true

    if (conditions) {
      // Simple condition matching (can be enhanced)
      for (const [key, value] of Object.entries(conditions)) {
        if (test_event[key] !== value) {
          matches = false
          break
        }
      }
    }

    return NextResponse.json({
      success: true,
      rule_id,
      matches,
      would_trigger: matches && rule.is_active && rule.trigger_event === test_event.type,
      action: matches ? {
        type: rule.action_type,
        recipient: rule.recipient_email,
        template_id: rule.template_id,
      } : null,
    })
  } catch (error: any) {
    console.error('Error testing email routing rule:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

