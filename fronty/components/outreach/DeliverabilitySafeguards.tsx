'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, Save, Plus, X } from 'lucide-react'
import { useDeliverabilitySafeguards, useSaveDeliverabilitySafeguards } from '@/lib/hooks/useOutreach'

interface DeliverabilitySafeguardsProps {
  domain: string
  onSave: (safeguards: any) => void
}

export function DeliverabilitySafeguards({ domain, onSave }: DeliverabilitySafeguardsProps) {
  const { data: existing, isLoading } = useDeliverabilitySafeguards(domain)
  const saveSafeguards = useSaveDeliverabilitySafeguards()

  const [bounceRateWarning, setBounceRateWarning] = useState(2.0)
  const [bounceRateCritical, setBounceRateCritical] = useState(5.0)
  const [spamComplaintWarning, setSpamComplaintWarning] = useState(0.1)
  const [spamComplaintCritical, setSpamComplaintCritical] = useState(0.5)
  const [minReputationScore, setMinReputationScore] = useState(60)
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true)
  const [alertEmails, setAlertEmails] = useState<string[]>([''])
  const [alertInApp, setAlertInApp] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setBounceRateWarning(existing.bounce_rate_warning || 2.0)
      setBounceRateCritical(existing.bounce_rate_critical || 5.0)
      setSpamComplaintWarning(existing.spam_complaint_warning || 0.1)
      setSpamComplaintCritical(existing.spam_complaint_critical || 0.5)
      setMinReputationScore(existing.min_reputation_score || 60)
      setAutoPauseEnabled(existing.auto_pause_enabled ?? true)
      setAlertEmails(existing.alert_emails && existing.alert_emails.length > 0 ? existing.alert_emails : [''])
      setAlertInApp(existing.alert_in_app ?? true)
    }
  }, [existing])

  const handleAddEmail = () => {
    setAlertEmails([...alertEmails, ''])
  }

  const handleRemoveEmail = (index: number) => {
    setAlertEmails(alertEmails.filter((_, i) => i !== index))
  }

  const handleUpdateEmail = (index: number, email: string) => {
    const newEmails = [...alertEmails]
    newEmails[index] = email
    setAlertEmails(newEmails)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const safeguards = {
        domain,
        bounce_rate_warning: bounceRateWarning,
        bounce_rate_critical: bounceRateCritical,
        spam_complaint_warning: spamComplaintWarning,
        spam_complaint_critical: spamComplaintCritical,
        min_reputation_score: minReputationScore,
        auto_pause_enabled: autoPauseEnabled,
        alert_emails: alertEmails.filter(e => e.trim()),
        alert_in_app: alertInApp,
      }

      await saveSafeguards.mutateAsync(safeguards)
      onSave(safeguards)
    } catch (error: any) {
      alert(error.message || 'Failed to save deliverability safeguards')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Shield className="h-5 w-5" />
          Deliverability Safeguards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bounceWarning" className="text-[#004565] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Bounce Rate Warning (%)
            </Label>
            <Input
              id="bounceWarning"
              type="number"
              value={bounceRateWarning}
              onChange={(e) => setBounceRateWarning(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bounceCritical" className="text-[#004565] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Bounce Rate Critical (%)
            </Label>
            <Input
              id="bounceCritical"
              type="number"
              value={bounceRateCritical}
              onChange={(e) => setBounceRateCritical(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="spamWarning" className="text-[#004565]">Spam Complaint Warning (%)</Label>
            <Input
              id="spamWarning"
              type="number"
              value={spamComplaintWarning}
              onChange={(e) => setSpamComplaintWarning(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.01"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="spamCritical" className="text-[#004565]">Spam Complaint Critical (%)</Label>
            <Input
              id="spamCritical"
              type="number"
              value={spamComplaintCritical}
              onChange={(e) => setSpamComplaintCritical(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.01"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="minReputation" className="text-[#004565]">Minimum Reputation Score</Label>
            <Input
              id="minReputation"
              type="number"
              value={minReputationScore}
              onChange={(e) => setMinReputationScore(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoPause"
              checked={autoPauseEnabled}
              onChange={(e) => setAutoPauseEnabled(e.target.checked)}
              className="h-4 w-4 text-[#004565]"
            />
            <Label htmlFor="autoPause" className="text-[#004565] cursor-pointer">
              Auto-pause sending when thresholds are exceeded
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertInApp"
              checked={alertInApp}
              onChange={(e) => setAlertInApp(e.target.checked)}
              className="h-4 w-4 text-[#004565]"
            />
            <Label htmlFor="alertInApp" className="text-[#004565] cursor-pointer">
              Show in-app alerts
            </Label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[#004565]">Alert Email Addresses</Label>
            <Button
              onClick={handleAddEmail}
              size="sm"
              variant="outline"
              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Email
            </Button>
          </div>
          <div className="space-y-2">
            {alertEmails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleUpdateEmail(index, e.target.value)}
                  placeholder="alert@example.com"
                  className="flex-1"
                />
                {alertEmails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#004565]/10">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Safeguards'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

