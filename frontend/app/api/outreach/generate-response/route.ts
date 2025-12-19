import { NextRequest, NextResponse } from 'next/server'
import { getLeadById } from '@/lib/supabase/queries/leads'
import { getLeadConversation } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for generate response
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_RESPONSE || 'http://auto.lincolnwaste.co/webhook/generate-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, conversation_history, user_changes } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Fetch lead data
    const lead = await getLeadById(lead_id)

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get conversation history if not provided
    let conversation = conversation_history
    if (!conversation) {
      const conversationData = await getLeadConversation(lead_id)
      conversation = conversationData?.messages || []
    }

    // Prepare lead data for response generation
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

    // Call n8n webhook to generate response
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_data: leadData,
        conversation_history: conversation,
        user_changes: user_changes || null,
      }),
    })

    const n8nData = await n8nResponse.json().catch(() => ({}))

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || 'Failed to generate response' },
        { status: n8nResponse.status }
      )
    }

    // Parse response from n8n (could be JSON string or object)
    let responseContent = n8nData?.response_content || n8nData?.content || ''
    let subject = n8nData?.subject || 'Re: Your inquiry'

    // If response contains JSON string, parse it
    if (typeof responseContent === 'string' && responseContent.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(responseContent)
        responseContent = parsed.content || responseContent
        subject = parsed.subject || subject
      } catch {
        // Not JSON, use as is
      }
    }

    return NextResponse.json({
      success: true,
      subject: subject,
      content: responseContent,
      message: 'Response generated successfully',
    })
  } catch (error: any) {
    console.error('Error generating response:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

