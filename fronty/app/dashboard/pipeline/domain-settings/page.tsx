'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { DomainWarmupConfig } from '@/components/outreach/DomainWarmupConfig'
import { DeliverabilitySafeguards } from '@/components/outreach/DeliverabilitySafeguards'
import { useDomainWarmup } from '@/lib/hooks/useOutreach'
import { useDNSCheck } from '@/lib/hooks/useOutreach'

export default function DomainSettingsPage() {
  const [domain, setDomain] = useState('')
  const [showWarmupConfig, setShowWarmupConfig] = useState(false)
  const [showSafeguards, setShowSafeguards] = useState(false)
  const [dnsResults, setDnsResults] = useState<any>(null)

  const { data: warmup } = useDomainWarmup(domain || undefined)
  const dnsCheck = useDNSCheck()

  const handleDNSCheck = async () => {
    if (!domain.trim()) {
      alert('Please enter a domain')
      return
    }

    try {
      const result = await dnsCheck.mutateAsync(domain.trim())
      setDnsResults(result)
    } catch (error: any) {
      alert(error.message || 'Failed to check DNS records')
    }
  }

  const getDNSStatusBadge = (status: string | null) => {
    if (status === 'pass') {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Pass</Badge>
    } else if (status === 'fail') {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Fail</Badge>
    }
    return <Badge variant="outline">{status || 'N/A'}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <h1 className="text-4xl font-bold text-[#004565]">Domain Settings</h1>
        <p className="text-[#004565]/80 mt-2 font-medium">Configure domain warmup and deliverability safeguards</p>
        <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
      </div>

      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#004565]">Domain Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="domain" className="text-[#004565]">Domain</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1"
              />
              <Button
                onClick={handleDNSCheck}
                disabled={!domain.trim() || dnsCheck.isPending}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${dnsCheck.isPending ? 'animate-spin' : ''}`} />
                Check DNS
              </Button>
            </div>
          </div>

          {dnsResults && (
            <div className="p-4 bg-[#004565]/5 rounded-lg border border-[#004565]/20">
              <h3 className="text-sm font-semibold text-[#004565] mb-3">DNS Records Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-[#004565]/70 mb-1">SPF</div>
                  {getDNSStatusBadge(dnsResults.dns_records?.spf)}
                </div>
                <div>
                  <div className="text-xs text-[#004565]/70 mb-1">DKIM</div>
                  {getDNSStatusBadge(dnsResults.dns_records?.dkim)}
                </div>
                <div>
                  <div className="text-xs text-[#004565]/70 mb-1">DMARC</div>
                  {getDNSStatusBadge(dnsResults.dns_records?.dmarc)}
                </div>
              </div>
              {dnsResults.last_checked && (
                <div className="text-xs text-[#004565]/50 mt-3">
                  Last checked: {new Date(dnsResults.last_checked).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {domain && (
        <>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowWarmupConfig(!showWarmupConfig)}
              variant={showWarmupConfig ? 'default' : 'outline'}
              className={showWarmupConfig ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
            >
              {showWarmupConfig ? 'Hide' : 'Show'} Warmup Configuration
            </Button>
            <Button
              onClick={() => setShowSafeguards(!showSafeguards)}
              variant={showSafeguards ? 'default' : 'outline'}
              className={showSafeguards ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
            >
              {showSafeguards ? 'Hide' : 'Show'} Deliverability Safeguards
            </Button>
          </div>

          {showWarmupConfig && (
            <DomainWarmupConfig
              domain={domain}
              onSave={() => {
                setShowWarmupConfig(false)
                // Refresh warmup data
              }}
              onCancel={() => setShowWarmupConfig(false)}
            />
          )}

          {showSafeguards && (
            <DeliverabilitySafeguards
              domain={domain}
              onSave={() => {
                setShowSafeguards(false)
              }}
            />
          )}
        </>
      )}

      {warmup && (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#004565]">
              <Shield className="h-5 w-5" />
              Current Warmup Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#004565]/70">Day Number</div>
                <div className="text-lg font-semibold text-[#004565]">{warmup.day_number}</div>
              </div>
              <div>
                <div className="text-sm text-[#004565]/70">Reputation Score</div>
                <div className="text-lg font-semibold text-[#004565]">{warmup.reputation_score}/100</div>
              </div>
              <div>
                <div className="text-sm text-[#004565]/70">Daily Volume</div>
                <div className="text-lg font-semibold text-[#004565]">
                  {warmup.daily_volume_sent} / {warmup.daily_volume_limit}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#004565]/70">Bounce Rate</div>
                <div className="text-lg font-semibold text-[#004565]">{warmup.bounce_rate.toFixed(2)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

