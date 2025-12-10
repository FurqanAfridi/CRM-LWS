'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DomainWarmupCard } from '@/components/outreach/DomainWarmupCard'
import { MetricsCards } from '@/components/outreach/MetricsCards'
import { PipelineFunnel } from '@/components/outreach/PipelineFunnel'
import { SequenceKanban } from '@/components/outreach/SequenceKanban'
import { CalendarBookingCard } from '@/components/outreach/CalendarBookingCard'
import { AIPersonalizationConfig } from '@/components/outreach/AIPersonalizationConfig'
import { SequencePreview } from '@/components/outreach/SequencePreview'
import { DomainWarmupConfig } from '@/components/outreach/DomainWarmupConfig'
import { CalendarIntegration } from '@/components/outreach/CalendarIntegration'
import { useCalendarStatus, useOutreachMetrics } from '@/lib/hooks/useOutreach'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RefreshCw, Play, Pause, Settings, Mail, Sparkles, Eye, Plus, Calendar, TrendingUp, Shield } from 'lucide-react'
import Link from 'next/link'

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'timeline' | 'metrics'>('kanban')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAIPersonalization, setShowAIPersonalization] = useState(false)
  const [showSequencePreview, setShowSequencePreview] = useState(false)
  const [showDomainConfig, setShowDomainConfig] = useState(false)
  const [showBookingConfig, setShowBookingConfig] = useState(false)
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)

  const { data: calendarStatus } = useCalendarStatus()
  const { data: metrics } = useOutreachMetrics()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Trigger a window refresh to refetch all queries
    window.location.reload()
  }

  const connectedCalendars = calendarStatus ? Object.values(calendarStatus).filter((c: any) => c?.is_active).length : 0

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">Email Outreach Pipeline</h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Manage your email warm-up and outreach campaigns</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/pipeline/sequences">
            <Button
              variant="outline"
              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10 hover:border-[#004565]/50 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </Link>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10 hover:border-[#004565]/50 transition-all duration-300 disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-[#004565] border-t-transparent" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10 hover:border-[#004565]/50 transition-all duration-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <MetricsCards />

      {/* AI Personalization Settings Section */}
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#004565]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Personalization Settings
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSequencePreview(true)}
                className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPersonalization(true)}
                className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
              >
                Configure
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#004565]/70">
            Configure AI-powered email personalization for your outreach sequences. Enable personalized messaging to improve engagement rates.
          </p>
        </CardContent>
      </Card>

      {/* Booking Workflow Configuration */}
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#004565]">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Workflow
            </div>
            <div className="flex items-center gap-2">
              {connectedCalendars > 0 && (
                <Badge variant="success" className="text-xs">
                  {connectedCalendars} calendar{connectedCalendars !== 1 ? 's' : ''} connected
                </Badge>
              )}
              <Link href="/dashboard/pipeline/booking-settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
                >
                  Configure
                </Button>
              </Link>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#004565]/70 mb-3">
            Manage calendar integrations and email routing for booking confirmations.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/pipeline/booking-settings">
              <Button variant="outline" size="sm" className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10">
                Calendar Settings
              </Button>
            </Link>
            <Link href="/dashboard/pipeline/booking-settings">
              <Button variant="outline" size="sm" className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10">
                Email Routing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Domain Warm-Up Section */}
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#004565]">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Domain Warm-Up
            </div>
            <Link href="/dashboard/pipeline/domain-settings">
              <Button
                variant="outline"
                size="sm"
                className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
              >
                Configure
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DomainWarmupCard />
        </CardContent>
      </Card>

      {/* Pipeline Funnel */}
      <PipelineFunnel />

      {/* Main Content Area with Tabs */}
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="border-b border-[#004565]/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'kanban'
                    ? 'text-[#004565] border-b-2 border-[#004565]'
                    : 'text-[#004565]/70 hover:text-[#004565]'
                }`}
              >
                Kanban View
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'timeline'
                    ? 'text-[#004565] border-b-2 border-[#004565]'
                    : 'text-[#004565]/70 hover:text-[#004565]'
                }`}
              >
                Timeline View
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'metrics'
                    ? 'text-[#004565] border-b-2 border-[#004565]'
                    : 'text-[#004565]/70 hover:text-[#004565]'
                }`}
              >
                Metrics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'kanban' && (
              <div>
                <SequenceKanban />
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
                  <p className="text-[#004565]/70">Timeline view - Click on a campaign in Kanban view to see its timeline</p>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CalendarBookingCard />
                  <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#004565]">
                        <TrendingUp className="h-5 w-5" />
                        AI Personalization Effectiveness
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Personalization Rate</div>
                          <div className="text-2xl font-bold text-[#004565]">
                            {metrics ? '85%' : '--'}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Avg. Response Rate</div>
                          <div className="text-2xl font-bold text-[#00CD50]">
                            {metrics ? `${metrics.reply_rate.toFixed(1)}%` : '--'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Engagement Score</div>
                          <div className="text-2xl font-bold text-[#376EE1]">
                            {metrics ? `${metrics.open_rate.toFixed(1)}%` : '--'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#004565]">
                        <Calendar className="h-5 w-5" />
                        Booking Conversion Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Booking Link Clicks</div>
                          <div className="text-2xl font-bold text-[#004565]">--</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Confirmed Bookings</div>
                          <div className="text-2xl font-bold text-[#00CD50]">--</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Conversion Rate</div>
                          <div className="text-2xl font-bold text-[#376EE1]">--%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#004565]">
                        <Shield className="h-5 w-5" />
                        Domain Reputation Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Current Reputation</div>
                          <div className="text-2xl font-bold text-[#004565]">--/100</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Trend (7 days)</div>
                          <div className="text-2xl font-bold text-[#00CD50]">↑ +5</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#004565]/70 mb-1">Deliverability Score</div>
                          <div className="text-2xl font-bold text-[#376EE1]">
                            {metrics ? `${metrics.deliverability_score.toFixed(1)}%` : '--'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#004565]">
                      <Shield className="h-5 w-5" />
                      Deliverability Health Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-[#004565]/70 mb-1">Bounce Rate</div>
                        <div className="text-xl font-bold text-[#004565]">
                          {metrics ? `${metrics.bounce_rate.toFixed(2)}%` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#004565]/70 mb-1">Open Rate</div>
                        <div className="text-xl font-bold text-[#00CD50]">
                          {metrics ? `${metrics.open_rate.toFixed(2)}%` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#004565]/70 mb-1">Reply Rate</div>
                        <div className="text-xl font-bold text-[#376EE1]">
                          {metrics ? `${metrics.reply_rate.toFixed(2)}%` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#004565]/70 mb-1">Total Sent</div>
                        <div className="text-xl font-bold text-[#004565]">
                          {metrics ? metrics.total_sent.toLocaleString() : '--'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={showAIPersonalization} onOpenChange={setShowAIPersonalization}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">AI Personalization Configuration</DialogTitle>
          </DialogHeader>
          {selectedSequenceId && selectedStepIndex !== null ? (
            <AIPersonalizationConfig
              sequenceId={selectedSequenceId}
              stepIndex={selectedStepIndex}
              onSave={() => setShowAIPersonalization(false)}
              onClose={() => setShowAIPersonalization(false)}
            />
          ) : (
            <div className="p-4">
              <p className="text-sm text-[#004565]/70 mb-4">
                Please select a sequence and step to configure personalization.
              </p>
              <Link href="/dashboard/pipeline/sequences">
                <Button className="bg-[#004565] hover:bg-[#004565]/90 text-white">
                  Go to Sequences
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSequencePreview} onOpenChange={setShowSequencePreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Email Preview</DialogTitle>
          </DialogHeader>
          {selectedSequenceId && selectedStepIndex !== null ? (
            <SequencePreview
              sequenceId={selectedSequenceId}
              stepIndex={selectedStepIndex}
              onClose={() => setShowSequencePreview(false)}
            />
          ) : (
            <div className="p-4">
              <p className="text-sm text-[#004565]/70 mb-4">
                Please select a sequence and step to preview.
              </p>
              <Link href="/dashboard/pipeline/sequences">
                <Button className="bg-[#004565] hover:bg-[#004565]/90 text-white">
                  Go to Sequences
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
