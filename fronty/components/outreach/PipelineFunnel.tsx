'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEmailCampaigns } from '@/lib/hooks/useOutreach'
import { useLeads } from '@/lib/hooks/useLeads'
import { TrendingUp } from 'lucide-react'

interface FunnelStage {
  name: string
  count: number
  color: string
}

export function PipelineFunnel() {
  const { data: campaigns } = useEmailCampaigns()
  const { data: leads } = useLeads()

  // Calculate counts for each stage
  const readyForOutreach = leads?.filter(
    lead => lead.outreach_status === 'not_started' || lead.outreach_status === 'queued'
  ).length || 0

  const personalizing = campaigns?.filter(c => c.status === 'pending').length || 0

  const initialOutreach = campaigns?.filter(c => 
    c.status === 'active' && c.current_step === 0
  ).length || 0

  const followUps = campaigns?.filter(c => 
    c.status === 'active' && c.current_step > 0
  ).length || 0

  const bookingLinks = campaigns?.filter(c => 
    c.status === 'active' && c.current_step >= 3
  ).length || 0

  const activeConversations = campaigns?.filter(c => 
    c.status === 'active'
  ).length || 0

  const completed = campaigns?.filter(c => 
    c.status === 'completed'
  ).length || 0

  const stages: FunnelStage[] = [
    { name: 'Ready for Outreach', count: readyForOutreach, color: 'bg-[#004565]' },
    { name: 'Personalizing', count: personalizing, color: 'bg-[#376EE1]' },
    { name: 'Initial Outreach', count: initialOutreach, color: 'bg-[#00CD50]' },
    { name: 'Follow-ups', count: followUps, color: 'bg-[#FFA500]' },
    { name: 'Booking Links', count: bookingLinks, color: 'bg-[#9B59B6]' },
    { name: 'Active Conversations', count: activeConversations, color: 'bg-[#E74C3C]' },
    { name: 'Completed', count: completed, color: 'bg-[#95A5A6]' },
  ]

  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <TrendingUp className="h-5 w-5" />
          Pipeline Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#004565]">{stage.name}</span>
                  <span className="text-sm font-bold text-[#004565]">{stage.count}</span>
                </div>
                <div className="w-full bg-[#004565]/10 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${stage.color} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${width}%` }}
                  >
                    {width > 15 && (
                      <span className="text-xs font-semibold text-white">{stage.count}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

