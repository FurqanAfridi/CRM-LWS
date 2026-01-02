'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useOutreachMetrics } from '@/lib/hooks/useOutreach'
import { Mail, Reply, Calendar, TrendingUp, Clock, MessageSquare } from 'lucide-react'

export function MetricsCards() {
  const { data: metrics, isLoading } = useOutreachMetrics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metricsData = metrics || {
    open_rate: 0,
    reply_rate: 0,
    bounce_rate: 0,
    deliverability_score: 0,
    total_sent: 0,
    total_delivered: 0,
    total_opened: 0,
    total_replied: 0,
    total_bounced: 0,
  }

  const cards = [
    {
      title: 'Open Rate',
      value: `${metricsData.open_rate.toFixed(1)}%`,
      icon: Mail,
      color: 'text-[#376EE1]',
      bgColor: 'bg-[#376EE1]/10',
    },
    {
      title: 'Reply Rate',
      value: `${metricsData.reply_rate.toFixed(1)}%`,
      icon: Reply,
      color: 'text-[#00CD50]',
      bgColor: 'bg-[#00CD50]/10',
    },
    {
      title: 'Deliverability',
      value: `${metricsData.deliverability_score.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-[#004565]',
      bgColor: 'bg-[#004565]/10',
    },
    {
      title: 'Total Sent',
      value: metricsData.total_sent.toLocaleString(),
      icon: Mail,
      color: 'text-[#004565]',
      bgColor: 'bg-[#004565]/10',
    },
    {
      title: 'Total Opened',
      value: metricsData.total_opened.toLocaleString(),
      icon: MessageSquare,
      color: 'text-[#376EE1]',
      bgColor: 'bg-[#376EE1]/10',
    },
    {
      title: 'Total Replied',
      value: metricsData.total_replied.toLocaleString(),
      icon: Reply,
      color: 'text-[#00CD50]',
      bgColor: 'bg-[#00CD50]/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#004565]/70 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-[#004565]">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

