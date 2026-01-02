import { NextRequest, NextResponse } from 'next/server'
import { getEmailSequenceById, updateEmailSequence, deleteEmailSequence } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for sequence validation
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_VALIDATE_SEQUENCE || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sequence = await getEmailSequenceById(params.id)

    return NextResponse.json({
      success: true,
      sequence,
    })
  } catch (error: any) {
    console.error('Error fetching sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, steps, is_active } = body

    // Validate if steps provided
    if (steps !== undefined && (!Array.isArray(steps) || steps.length === 0)) {
      return NextResponse.json(
        { error: 'steps must be a non-empty array' },
        { status: 400 }
      )
    }

    // Optional: Call n8n webhook for validation if steps are being updated
    // Only if webhook URL is configured and not a placeholder
    const isWebhookConfigured = N8N_WEBHOOK_URL && 
                                 !N8N_WEBHOOK_URL.includes('[id]') && 
                                 N8N_WEBHOOK_URL !== 'https://auto.lincolnwaste.co/webhook/[id]'
    
    if (steps && isWebhookConfigured) {
      try {
        const validateResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name || params.id, steps }),
        })

        if (!validateResponse.ok) {
          const errorData = await validateResponse.json().catch(() => ({ error: 'Sequence validation failed' }))
          return NextResponse.json(
            { error: errorData?.error || 'Sequence validation failed' },
            { status: 400 }
          )
        }
      } catch (validationError) {
        console.warn('Sequence validation webhook failed, continuing anyway:', validationError)
      }
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (steps !== undefined) updates.steps = steps
    if (is_active !== undefined) updates.is_active = is_active

    const sequence = await updateEmailSequence(params.id, updates)

    return NextResponse.json({
      success: true,
      sequence,
      message: 'Sequence updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteEmailSequence(params.id)

    return NextResponse.json({
      success: true,
      message: 'Sequence deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting sequence:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

