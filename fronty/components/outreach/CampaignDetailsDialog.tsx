'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useCampaign, useCampaignMessages, useEmailSequence } from '@/lib/hooks/useOutreach'
import { useLead } from '@/lib/hooks/useLeads'
import { Mail, Calendar, TrendingUp, Clock } from 'lucide-react'
import { SequenceTimeline } from './SequenceTimeline'

interface CampaignDetailsDialogProps {
  campaignId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CampaignDetailsDialog({ campaignId, open, onOpenChange }: CampaignDetailsDialogProps) {
  const { data: campaign } = useCampaign(campaignId || '')
  const { data: messages } = useCampaignMessages(campaignId || '')
  const { data: lead } = useLead(campaign?.lead_id || '')
  const { data: sequence } = useEmailSequence(campaign?.sequence_id || '')

  if (!campaignId || !campaign) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#004565]">
            <Mail className="h-5 w-5" />
            Campaign Details
          </DialogTitle>
          <DialogDescription>
            {lead?.name || lead?.email || `Lead ${lead?.id?.slice(0, 8)}`}
            {lead?.company_name && ` • ${lead.company_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-[#004565]/70 mb-1">Status</div>
              <Badge variant={campaign.status === 'active' ? 'success' : 'outline'}>
                {campaign.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-[#004565]/70 mb-1">Current Step</div>
              <div className="text-sm font-semibold text-[#004565]">{campaign.current_step}</div>
            </div>
            {campaign.started_at && (
              <div>
                <div className="text-sm font-medium text-[#004565]/70 mb-1">Started</div>
                <div className="text-sm text-[#004565]">
                  {new Date(campaign.started_at).toLocaleString()}
                </div>
              </div>
            )}
            {sequence && (
              <div>
                <div className="text-sm font-medium text-[#004565]/70 mb-1">Sequence</div>
                <div className="text-sm text-[#004565]">{sequence.name}</div>
              </div>
            )}
          </div>

          {/* Messages Summary */}
          {messages && messages.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-[#004565] mb-2">Email Messages</div>
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-lg bg-[#004565]/5 border border-[#004565]/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#004565]">
                        Step {message.sequence_step}
                      </span>
                      <Badge variant={message.status === 'replied' ? 'success' : 'outline'} className="text-xs">
                        {message.status}
                      </Badge>
                    </div>
                    {message.subject && (
                      <div className="text-sm text-[#004565]/80">{message.subject}</div>
                    )}
                    {message.sent_at && (
                      <div className="text-xs text-[#004565]/70 mt-1">
                        Sent: {new Date(message.sent_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <SequenceTimeline campaignId={campaignId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

