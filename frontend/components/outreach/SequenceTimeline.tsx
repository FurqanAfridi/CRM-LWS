'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSequenceTimeline } from '@/lib/hooks/useOutreach'
import { Mail, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface SequenceTimelineProps {
  campaignId: string
}

export function SequenceTimeline({ campaignId }: SequenceTimelineProps) {
  const { data: timeline, isLoading } = useSequenceTimeline(campaignId)

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#004565]">Sequence Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#004565]/70">No timeline data available</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'replied':
        return <CheckCircle2 className="h-4 w-4 text-[#00CD50]" />
      case 'queued':
        return <Clock className="h-4 w-4 text-[#FFA500]" />
      case 'bounced':
      case 'failed':
        return <XCircle className="h-4 w-4 text-[#E74C3C]" />
      default:
        return <Mail className="h-4 w-4 text-[#004565]/50" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'replied':
        return <Badge variant="success" className="text-xs">{status}</Badge>
      case 'queued':
        return <Badge variant="warning" className="text-xs">{status}</Badge>
      case 'bounced':
      case 'failed':
        return <Badge variant="destructive" className="text-xs">{status}</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#004565]">Sequence Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#004565]/20" />

          <div className="space-y-6">
            {timeline.map((step, index) => (
              <div key={index} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#004565] flex items-center justify-center">
                  {getStatusIcon(step.status)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#004565]">
                        Step {step.sequence_step}
                      </span>
                      {getStatusBadge(step.status)}
                    </div>
                    {step.sent_date && (
                      <span className="text-xs text-[#004565]/70">
                        {new Date(step.sent_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {step.subject && (
                    <p className="text-sm text-[#004565]/80 truncate">{step.subject}</p>
                  )}

                  {step.scheduled_date && !step.sent_date && (
                    <p className="text-xs text-[#FFA500]">
                      Scheduled: {new Date(step.scheduled_date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

