import { NextRequest, NextResponse } from 'next/server'
import { updateEmailMessage, createEmailMessage, updateEmailCampaign } from '@/lib/supabase/queries/outreach'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message_id,
      campaign_id,
      lead_id,
      sequence_step,
      status,
      subject,
      content,
      sent_at,
      delivered_at,
      opened_at,
      replied_at,
      bounce_reason,
    } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    // If message_id exists, update existing message
    if (message_id) {
      const updates: any = {
        status,
      }

      if (sent_at) updates.sent_at = sent_at
      if (delivered_at) updates.delivered_at = delivered_at
      if (opened_at) updates.opened_at = opened_at
      if (replied_at) updates.replied_at = replied_at
      if (bounce_reason) updates.bounce_reason = bounce_reason

      const updatedMessage = await updateEmailMessage(message_id, updates)

      // Update campaign current_step when email is sent (to track sequence progress)
      if (status === 'sent' && updatedMessage.campaign_id && updatedMessage.sequence_step !== undefined) {
        try {
          await updateEmailCampaign(updatedMessage.campaign_id, {
            current_step: updatedMessage.sequence_step,
          })
        } catch (campaignError) {
          // Log error but don't fail the webhook - campaign update is secondary
          console.error('Error updating campaign current_step:', campaignError)
        }
      }

      // Show success message specifically for response tracking (replied status)
      if (status === 'replied') {
        return NextResponse.json({
          success: true,
          message: 'Email response tracked successfully',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Email message updated successfully',
      })
    }

    // Otherwise, create new message record
    if (!campaign_id || !lead_id || sequence_step === undefined) {
      return NextResponse.json(
        { error: 'campaign_id, lead_id, and sequence_step are required for new messages' },
        { status: 400 }
      )
    }

    const message = await createEmailMessage({
      campaign_id,
      lead_id,
      sequence_step,
      subject,
      content,
      status,
      sent_at,
      delivered_at,
      opened_at,
      replied_at,
      bounce_reason,
    })

    // Update campaign current_step when email is sent (to track sequence progress)
    if (status === 'sent' && campaign_id && sequence_step !== undefined) {
      try {
        await updateEmailCampaign(campaign_id, {
          current_step: sequence_step,
        })
      } catch (campaignError) {
        // Log error but don't fail the webhook - campaign update is secondary
        console.error('Error updating campaign current_step:', campaignError)
      }
    }

    // Show success message specifically for response tracking (replied status)
    if (status === 'replied') {
      return NextResponse.json({
        success: true,
        message_id: message.id,
        message: 'Email response tracked successfully',
      })
    }

    return NextResponse.json({
      success: true,
      message_id: message.id,
      message: 'Email message created successfully',
    })
  } catch (error: any) {
    console.error('Error handling email webhook:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

