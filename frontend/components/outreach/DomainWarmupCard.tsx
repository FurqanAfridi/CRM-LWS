'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDomainWarmup } from '@/lib/hooks/useOutreach'
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

export function DomainWarmupCard({ domain }: { domain?: string }) {
  const { data: warmup, isLoading } = useDomainWarmup(domain)

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  if (!warmup) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#004565]">
            <ShieldCheck className="h-5 w-5" />
            Domain Warm-Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#004565]/70">No warm-up data available</p>
        </CardContent>
      </Card>
    )
  }

  const progress = warmup.daily_volume_limit > 0 
    ? (warmup.daily_volume_sent / warmup.daily_volume_limit) * 100 
    : 0

  const getHealthStatus = () => {
    if (warmup.reputation_score >= 80 && warmup.bounce_rate < 2 && warmup.spam_complaint_rate < 0.1) {
      return { color: 'success', icon: CheckCircle2, label: 'Healthy' }
    }
    if (warmup.reputation_score >= 60 && warmup.bounce_rate < 5 && warmup.spam_complaint_rate < 0.5) {
      return { color: 'warning', icon: AlertCircle, label: 'Warning' }
    }
    return { color: 'destructive', icon: XCircle, label: 'Critical' }
  }

  const health = getHealthStatus()
  const HealthIcon = health.icon

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#004565]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Domain Warm-Up
          </div>
          <Badge variant={health.color as any} className="flex items-center gap-1">
            <HealthIcon className="h-3 w-3" />
            {health.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#004565]">Day {warmup.day_number} Progress</span>
            <span className="text-sm text-[#004565]/70">
              {warmup.daily_volume_sent} / {warmup.daily_volume_limit}
            </span>
          </div>
          <div className="w-full bg-[#004565]/10 rounded-full h-2.5">
            <div
              className="bg-[#00CD50] h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Reputation Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#004565]/70">Reputation Score</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#00CD50]" />
            <span className="text-sm font-semibold text-[#004565]">{warmup.reputation_score}/100</span>
          </div>
        </div>

        {/* DNS Status */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-[#004565]/70 mb-1">SPF</div>
            <Badge 
              variant={warmup.spf_status === 'pass' ? 'success' : 'outline'} 
              className="text-xs"
            >
              {warmup.spf_status || 'N/A'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#004565]/70 mb-1">DKIM</div>
            <Badge 
              variant={warmup.dkim_status === 'pass' ? 'success' : 'outline'} 
              className="text-xs"
            >
              {warmup.dkim_status || 'N/A'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#004565]/70 mb-1">DMARC</div>
            <Badge 
              variant={warmup.dmarc_status === 'pass' ? 'success' : 'outline'} 
              className="text-xs"
            >
              {warmup.dmarc_status || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#004565]/10">
          <div>
            <div className="text-xs text-[#004565]/70 mb-1">Bounce Rate</div>
            <div className="text-sm font-semibold text-[#004565]">{warmup.bounce_rate.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-xs text-[#004565]/70 mb-1">Spam Complaints</div>
            <div className="text-sm font-semibold text-[#004565]">{warmup.spam_complaint_rate.toFixed(2)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

