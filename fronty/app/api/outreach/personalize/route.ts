import { NextRequest, NextResponse } from 'next/server'

// n8n webhook URL - following existing pattern (hardcoded)
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PERSONALIZE || 'https://auto.lincolnwaste.co/webhook/[id]'

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, template_id, strategy = 'moderate', variant, sequence_id, step_index } = body

    if (!lead_id || !template_id) {
      return NextResponse.json(
        { error: 'lead_id and template_id are required' },
        { status: 400 }
      )
    }

    // Generate cache key
    const cacheKey = `${lead_id}_${template_id}_${strategy}_${variant || 'default'}_${sequence_id || ''}_${step_index || ''}`
    
    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        ...cached.data,
        cached: true,
        message: 'Email personalized successfully (cached)',
      })
    }

    // Call n8n webhook to personalize email
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_id,
        template_id,
        strategy,
        variant,
        sequence_id,
        step_index,
      }),
    })

    const n8nData = await n8nResponse.json()

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: n8nData?.error || n8nData?.message || 'Failed to personalize email' },
        { status: n8nResponse.status }
      )
    }

    const responseData = {
      personalized_content: n8nData?.personalized_content || n8nData?.content,
      subject: n8nData?.subject,
      confidence_score: n8nData?.confidence_score || null,
      variables_used: n8nData?.variables_used || [],
      variant: n8nData?.variant || variant || 'default',
    }

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      ...responseData,
      message: 'Email personalized successfully',
    })
  } catch (error: any) {
    console.error('Error personalizing email:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

