import { NextRequest, NextResponse } from 'next/server'
import { createCalendarBooking, updateCalendarBooking } from '@/lib/supabase/queries/outreach'
import { updateLead } from '@/lib/supabase/queries/leads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      booking_id,
      lead_id,
      campaign_id,
      calendar_link,
      booking_status,
      scheduled_time,
      calendar_provider,
      meeting_id,
    } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // If booking_id exists, update existing booking
    if (booking_id) {
      await updateCalendarBooking(booking_id, {
        booking_status,
        scheduled_time,
        meeting_id,
      })

      // Update lead outreach status if booking is confirmed
      if (booking_status === 'confirmed') {
        await updateLead(lead_id, {
          outreach_status: 'booked',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Booking updated successfully',
      })
    }

    // Otherwise, create new booking record
    const booking = await createCalendarBooking({
      lead_id,
      campaign_id,
      calendar_link,
      booking_status: booking_status || 'link_sent',
      scheduled_time,
      calendar_provider,
      meeting_id,
    })

    // Update lead outreach status
    if (booking_status === 'confirmed') {
      await updateLead(lead_id, {
        outreach_status: 'booked',
      })
    } else {
      await updateLead(lead_id, {
        outreach_status: 'in_sequence',
      })
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      message: 'Booking created successfully',
    })
  } catch (error: any) {
    console.error('Error handling booking webhook:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

