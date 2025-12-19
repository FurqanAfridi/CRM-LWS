import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingResponses,
  getPendingResponseById,
  getPendingResponseByLead,
  createPendingResponse,
  updatePendingResponse,
  deletePendingResponse,
} from '@/lib/supabase/queries/outreach'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lead_id = searchParams.get('lead_id')
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    if (id) {
      const response = await getPendingResponseById(id)
      return NextResponse.json({
        success: true,
        response: response || null,
      })
    }

    if (lead_id) {
      // Get latest pending response for a lead
      if (status === 'pending') {
        const response = await getPendingResponseByLead(lead_id)
        return NextResponse.json({
          success: true,
          response: response || null,
        })
      }
    }

    const responses = await getPendingResponses(lead_id || undefined, status || undefined)

    return NextResponse.json({
      success: true,
      responses,
    })
  } catch (error: any) {
    console.error('Error fetching pending responses:', error)
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
      lead_id,
      email_message_id,
      campaign_id,
      subject,
      content,
      status = 'pending',
    } = body

    if (!lead_id || !subject || !content) {
      return NextResponse.json(
        { error: 'lead_id, subject, and content are required' },
        { status: 400 }
      )
    }

    const response = await createPendingResponse({
      lead_id,
      email_message_id: email_message_id || null,
      campaign_id: campaign_id || null,
      subject,
      content,
      status: status as 'pending' | 'approved' | 'rejected' | 'sent',
      user_changes: null,
      generated_at: new Date().toISOString(),
      reviewed_at: null,
      sent_at: null,
    })

    return NextResponse.json({
      success: true,
      response,
      message: 'Pending response created successfully',
    })
  } catch (error: any) {
    console.error('Error creating pending response:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const response = await updatePendingResponse(id, updates)

    return NextResponse.json({
      success: true,
      response,
      message: 'Pending response updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating pending response:', error)
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
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await deletePendingResponse(id)

    return NextResponse.json({
      success: true,
      message: 'Pending response deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting pending response:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

