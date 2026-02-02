import { NextRequest, NextResponse } from 'next/server'
import { getLeadById } from '@/lib/supabase/queries/leads'
import { getEmailSequenceById } from '@/lib/supabase/queries/outreach'
import { getPersonalizationConfig } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for generate preview
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_PREVIEW || 'https://auto.lincolnwaste.co/webhook/emailpreview'


export async function POST(request: NextRequest) {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') console.log('N8N_WEBHOOK_URL', N8N_WEBHOOK_URL)
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

    // Prepare request payload
    const requestPayload = {
      lead_data: leadData,
      template_data: templateData,
      personalization_config: config,
      sequence_data: {
        sequence_id: sequence.id,
        sequence_name: sequence.name,
        step_index: step_index,
        step_data: step,
      },
    }

    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.log('Calling n8n webhook:', {
      url: N8N_WEBHOOK_URL,
      method: 'POST',
      payloadSize: JSON.stringify(requestPayload).length,
    })

    // Call n8n webhook with all data
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.log('n8n response status:', n8nResponse.status, n8nResponse.statusText)

    // Get response as text first to handle different content types
    const responseText = await n8nResponse.text()
    let n8nData: any = {}

    // Check for n8n webhook method errors
    if (responseText.includes('not registered for GET requests') || 
        responseText.includes('Did you mean to make a POST request')) {
      console.error('n8n webhook method error:', {
        url: N8N_WEBHOOK_URL,
        response: responseText,
        status: n8nResponse.status,
      })
      return NextResponse.json(
        { 
          error: 'n8n webhook configuration error: The webhook at this URL is not configured to accept POST requests. Please check your n8n workflow webhook settings and ensure it is set to accept POST method.',
          webhook_url: N8N_WEBHOOK_URL,
          details: process.env.NODE_ENV === 'development' ? responseText : undefined
        },
        { status: 400 }
      )
    }

    // Check if response contains the specific n8n error message
    if (responseText.includes('Cannot coerce the result to a single JSON object')) {
      console.error('n8n coercion error detected. Response:', responseText.substring(0, 500))
      return NextResponse.json(
        { 
          error: 'n8n workflow configuration error: The webhook response node must be configured to return a single JSON object. Please check your n8n workflow settings.',
          details: process.env.NODE_ENV === 'development' ? responseText : undefined
        },
        { status: 500 }
      )
    }

    // Try to parse as JSON
    try {
      n8nData = JSON.parse(responseText)
    } catch (parseError) {
      // If not JSON, check if it's an error message
      if (!n8nResponse.ok) {
        return NextResponse.json(
          { error: responseText || 'Failed to generate preview' },
          { status: n8nResponse.status }
        )
      }
      // If successful but not JSON, treat as plain text content
      n8nData = { content: responseText, personalized_content: responseText }
    }

    // n8n sometimes returns an array instead of a single object
    // If it's an array, take the first element
    if (Array.isArray(n8nData)) {
      if (n8nData.length === 0) {
        return NextResponse.json(
          { error: 'n8n returned an empty array' },
          { status: 500 }
        )
      }
      // If array has multiple items, try to find the one with our expected fields
      const itemWithContent = n8nData.find((item: any) => 
        item.personalized_content || item.content || item.response
      )
      n8nData = itemWithContent || n8nData[0]
    }

    // Check if n8n returned an error in the response
    // Handle the specific "Cannot coerce" error from n8n
    const errorMessage = n8nData?.error || n8nData?.message || ''
    if (errorMessage && (
      errorMessage.toLowerCase().includes('error') ||
      errorMessage.toLowerCase().includes('cannot coerce') ||
      errorMessage.toLowerCase().includes('coerce')
    )) {
      // Log the full response for debugging
      console.error('n8n error response:', {
        status: n8nResponse.status,
        ok: n8nResponse.ok,
        data: n8nData,
        text: responseText.substring(0, 500), // First 500 chars
      })
      
      return NextResponse.json(
        { 
          error: errorMessage || 'n8n workflow error: Cannot process response. Please check n8n workflow configuration.',
          details: process.env.NODE_ENV === 'development' ? responseText.substring(0, 200) : undefined
        },
        { status: n8nResponse.ok ? 500 : n8nResponse.status }
      )
    }

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || responseText || 'Failed to generate preview' },
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

