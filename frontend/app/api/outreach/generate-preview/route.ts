import { NextRequest, NextResponse } from 'next/server'
import { getLeadById } from '@/lib/supabase/queries/leads'
import { getEmailSequenceById } from '@/lib/supabase/queries/outreach'
import { getPersonalizationConfig } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for generate preview
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_PREVIEW || 'http://auto.lincolnwaste.co/webhook/emailpreview'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, sequence_id, step_index } = body

    if (!lead_id || !sequence_id || step_index === undefined) {
      return NextResponse.json(
        { error: 'lead_id, sequence_id, and step_index are required' },
        { status: 400 }
      )
    }

    // Fetch all necessary data
    const [lead, sequence, personalizationConfig] = await Promise.all([
      getLeadById(lead_id),
      getEmailSequenceById(sequence_id),
      getPersonalizationConfig(sequence_id, step_index),
    ])

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      )
    }

    // Get step data
    const steps = (sequence.steps as any[]) || []
    const step = steps[step_index] || {}

    // Prepare lead data for personalization
    const leadData = {
      lead_id: lead.id,
      lead_name: lead.name || lead.email || '',
      lead_email: lead.email || '',
      company_name: lead.company_name || '',
      company_id: lead.company_id || null,
      industry: (lead as any).industry || '',
      pain_points: Array.isArray(lead.pain_points) 
        ? lead.pain_points 
        : (lead.pain_points ? JSON.parse(String(lead.pain_points)) : []),
      title: (lead as any).title || '',
      icp_score: lead.icp_score || 0,
    }

    // Prepare template data
    const templateData = {
      template_id: step.template_id || step.id || `sequence-${sequence_id}-step-${step_index}`,
      subject: step.subject || '',
      content: step.content || step.template || '',
      step_name: step.name || `Step ${step_index + 1}`,
    }

    // Prepare personalization config
    const config = {
      enabled: personalizationConfig?.enabled ?? true,
      strategy: personalizationConfig?.strategy || 'moderate',
      prompt_template: personalizationConfig?.prompt_template || '',
      variables: personalizationConfig?.variables || {},
    }

    // Call n8n webhook with all data
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_data: leadData,
        template_data: templateData,
        personalization_config: config,
        sequence_data: {
          sequence_id: sequence.id,
          sequence_name: sequence.name,
          step_index: step_index,
          step_data: step,
        },
      }),
    })

    const n8nData = await n8nResponse.json().catch(() => ({}))

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || 'Failed to generate preview' },
        { status: n8nResponse.status }
      )
    }

    // Parse response from n8n (could be JSON string or object)
    let personalizedContent = n8nData?.personalized_content || n8nData?.content || ''
    let subject = n8nData?.subject || templateData.subject

    // If response contains JSON string, parse it
    if (typeof personalizedContent === 'string' && personalizedContent.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(personalizedContent)
        personalizedContent = parsed.content || personalizedContent
        subject = parsed.subject || subject
      } catch {
        // Not JSON, use as is
      }
    }

    return NextResponse.json({
      success: true,
      personalized_content: personalizedContent,
      subject: subject,
      confidence_score: n8nData?.confidence_score || null,
      variables_used: n8nData?.variables_used || Object.keys(config.variables).filter((k) => config.variables[k]),
      strategy: config.strategy,
      message: 'Preview generated successfully',
    })
  } catch (error: any) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

