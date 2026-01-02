import { NextRequest, NextResponse } from 'next/server'
import { getEmailSequenceById } from '@/lib/supabase/queries/outreach'
import { getLeadById } from '@/lib/supabase/queries/leads'

// n8n webhook URL for personalization
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PERSONALIZE || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { lead_id, step_index } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Get sequence
    const sequence = await getEmailSequenceById(params.id)
    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      )
    }

    // Get lead
    const lead = await getLeadById(lead_id)
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get step to test
    const steps = sequence.steps as any[]
    const stepIndex = step_index !== undefined ? step_index : 0
    const step = steps[stepIndex]

    if (!step) {
      return NextResponse.json(
        { error: `Step ${stepIndex} not found in sequence` },
        { status: 400 }
      )
    }

    // Call personalization webhook
    const personalizeResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id,
        template_id: step.template_id || step.id,
        strategy: step.personalization_strategy || 'moderate',
        sequence_id: params.id,
        step_index: stepIndex,
      }),
    })

    if (!personalizeResponse.ok) {
      const errorData = await personalizeResponse.json()
      return NextResponse.json(
        { error: errorData?.error || 'Failed to personalize email' },
        { status: personalizeResponse.status }
      )
    }

    const personalizedData = await personalizeResponse.json()

    return NextResponse.json({
      success: true,
      step_index: stepIndex,
      original_step: step,
      personalized: {
        subject: personalizedData?.subject,
        content: personalizedData?.personalized_content || personalizedData?.content,
        confidence_score: personalizedData?.confidence_score,
        variables_used: personalizedData?.variables_used || [],
      },
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company_name: lead.company_name,
      },
    })
  } catch (error: any) {
    console.error('Error testing sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

