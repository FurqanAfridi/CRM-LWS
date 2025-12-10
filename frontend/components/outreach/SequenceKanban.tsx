'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmailCampaigns } from '@/lib/hooks/useOutreach'
import { Mail, Building2, ArrowRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { CampaignDetailsDialog } from './CampaignDetailsDialog'

const columns = [
  { id: 'queued', name: 'Queued', status: 'pending' as const },
  { id: 'personalizing', name: 'Personalizing', status: 'pending' as const },
  { id: 'sending', name: 'Sending', status: 'active' as const },
  { id: 'followups', name: 'Follow-ups', status: 'active' as const },
  { id: 'booking', name: 'Booking', status: 'active' as const },
  { id: 'active', name: 'Active', status: 'active' as const },
  { id: 'completed', name: 'Completed', status: 'completed' as const },
]

export function SequenceKanban() {
  const { data: campaigns, isLoading } = useEmailCampaigns()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  const getCampaignsForColumn = (columnId: string) => {
    if (!campaigns) return []

    switch (columnId) {
      case 'queued':
        return campaigns.filter(c => c.status === 'pending' && c.current_step === 0)
      case 'personalizing':
        return campaigns.filter(c => c.status === 'pending' && c.current_step > 0)
      case 'sending':
        return campaigns.filter(c => c.status === 'active' && c.current_step === 0)
      case 'followups':
        return campaigns.filter(c => c.status === 'active' && c.current_step > 0 && c.current_step < 3)
      case 'booking':
        return campaigns.filter(c => c.status === 'active' && c.current_step >= 3)
      case 'active':
        return campaigns.filter(c => c.status === 'active')
      case 'completed':
        return campaigns.filter(c => c.status === 'completed')
      default:
        return []
    }
  }

  const handleCardClick = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setIsDialogOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {columns.map((column) => {
            const columnCampaigns = getCampaignsForColumn(column.id)
            return (
              <div key={column.id} className="flex-shrink-0 w-64">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-[#004565]">{column.name}</h3>
                  <span className="text-xs text-[#004565]/70">({columnCampaigns.length})</span>
                </div>
                <div className="space-y-2 min-h-[400px]">
                  {columnCampaigns.map((campaign) => {
                    const lead = campaign.leads as any
                    return (
                      <Card
                        key={campaign.id}
                        className="border-[#004565]/20 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleCardClick(campaign.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#004565] truncate">
                                  {lead?.name || lead?.email || `Lead ${lead?.id?.slice(0, 8)}`}
                                </div>
                                {lead?.company_name && (
                                  <div className="text-xs text-[#004565]/70 flex items-center gap-1 mt-1">
                                    <Building2 className="h-3 w-3" />
                                    {lead.company_name}
                                  </div>
                                )}
                              </div>
                              <Badge variant={campaign.status === 'active' ? 'success' : 'outline'} className="text-xs">
                                Step {campaign.current_step}
                              </Badge>
                            </div>

                            {campaign.started_at && (
                              <div className="text-xs text-[#004565]/70 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Started {new Date(campaign.started_at).toLocaleDateString()}
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCardClick(campaign.id)
                              }}
                            >
                              View Details
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {columnCampaigns.length === 0 && (
                    <div className="text-center text-sm text-[#004565]/50 py-8 border-2 border-dashed border-[#004565]/20 rounded-lg">
                      No campaigns
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <CampaignDetailsDialog
        campaignId={selectedCampaignId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}

