import { NextRequest, NextResponse } from 'next/server'
import { createEmailSequence } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for sequence validation
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_VALIDATE_SEQUENCE || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, steps, is_active = true } = body

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'name and steps (array) are required' },
        { status: 400 }
      )
    }

    // Validate sequence configuration
    if (steps.length === 0) {
      return NextResponse.json(
        { error: 'Sequence must have at least one step' },
        { status: 400 }
      )
    }

    // Optional: Call n8n webhook for validation (only if webhook URL is configured and not a placeholder)
    const isWebhookConfigured = N8N_WEBHOOK_URL && 
                                 !N8N_WEBHOOK_URL.includes('[id]') && 
                                 N8N_WEBHOOK_URL !== 'https://auto.lincolnwaste.co/webhook/[id]'
    
    if (isWebhookConfigured) {
      try {
        const validateResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, steps }),
        })

        if (!validateResponse.ok) {
          const errorData = await validateResponse.json().catch(() => ({ error: 'Sequence validation failed' }))
          return NextResponse.json(
            { error: errorData?.error || 'Sequence validation failed' },
            { status: 400 }
          )
        }
      } catch (validationError) {
        // Continue if validation webhook fails (optional validation)
        console.warn('Sequence validation webhook failed, continuing anyway:', validationError)
      }
    }

    // Create sequence in database
    const sequence = await createEmailSequence({
      name,
      description,
      steps: steps as any,
      is_active,
    })

    return NextResponse.json({
      success: true,
      sequence,
      message: 'Sequence created successfully',
    })
  } catch (error: any) {
    console.error('Error creating sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

