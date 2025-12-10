'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Target, Save } from 'lucide-react'
import { useDomainSettings, useSaveDomainSettings } from '@/lib/hooks/useOutreach'

interface DomainWarmupConfigProps {
  domain?: string
  onSave: (config: any) => void
  onCancel: () => void
}

export function DomainWarmupConfig({ domain, onSave, onCancel }: DomainWarmupConfigProps) {
  const [selectedDomain, setSelectedDomain] = useState(domain || '')
  const [reputationTarget, setReputationTarget] = useState(80)
  const [dailyLimits, setDailyLimits] = useState<Record<number, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  const { data: existingConfig, isLoading } = useDomainSettings(selectedDomain || undefined)
  const saveSettings = useSaveDomainSettings()

  useEffect(() => {
    if (existingConfig) {
      setReputationTarget(existingConfig.reputation_target || 80)
      setDailyLimits(existingConfig.daily_volume_limits || {})
    }
  }, [existingConfig])

  const handleAddDay = () => {
    const maxDay = Object.keys(dailyLimits).length > 0
      ? Math.max(...Object.keys(dailyLimits).map(Number))
      : 0
    setDailyLimits({ ...dailyLimits, [maxDay + 1]: 10 })
  }

  const handleRemoveDay = (day: number) => {
    const newLimits = { ...dailyLimits }
    delete newLimits[day]
    setDailyLimits(newLimits)
  }

  const handleUpdateDayLimit = (day: number, limit: number) => {
    setDailyLimits({ ...dailyLimits, [day]: limit })
  }

  const handleSave = async () => {
    if (!selectedDomain.trim()) {
      alert('Please enter a domain')
      return
    }

    setIsSaving(true)
    try {
      const config = {
        domain: selectedDomain.trim(),
        reputation_target: reputationTarget,
        daily_volume_limits: dailyLimits,
        warmup_schedule: {
          start_date: new Date().toISOString(),
          days: Object.keys(dailyLimits).map(Number).sort((a, b) => a - b),
        },
      }

      await saveSettings.mutateAsync(config)
      onSave(config)
    } catch (error: any) {
      alert(error.message || 'Failed to save domain warmup config')
    } finally {
      setIsSaving(false)
    }
  }

  const sortedDays = Object.keys(dailyLimits).map(Number).sort((a, b) => a - b)

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Calendar className="h-5 w-5" />
          Domain Warmup Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="domain" className="text-[#004565]">Domain *</Label>
          <Input
            id="domain"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            placeholder="example.com"
            className="mt-1"
            disabled={!!domain}
          />
        </div>

        <div>
          <Label htmlFor="reputationTarget" className="text-[#004565] flex items-center gap-2">
            <Target className="h-4 w-4" />
            Reputation Target Score
          </Label>
          <Input
            id="reputationTarget"
            type="number"
            value={reputationTarget}
            onChange={(e) => setReputationTarget(parseInt(e.target.value) || 80)}
            min="0"
            max="100"
            className="mt-1"
          />
          <p className="text-xs text-[#004565]/70 mt-1">
            Target reputation score (0-100)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-[#004565]">Daily Volume Limits</Label>
            <Button
              onClick={handleAddDay}
              size="sm"
              variant="outline"
              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
            >
              Add Day
            </Button>
          </div>

          {sortedDays.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#004565]/50 border-2 border-dashed border-[#004565]/20 rounded-lg">
              No daily limits configured. Click "Add Day" to start.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedDays.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-3 p-3 bg-[#004565]/5 rounded-lg border border-[#004565]/10"
                >
                  <Badge variant="outline" className="text-[#004565] min-w-[60px]">
                    Day {day}
                  </Badge>
                  <Input
                    type="number"
                    value={dailyLimits[day]}
                    onChange={(e) => handleUpdateDayLimit(day, parseInt(e.target.value) || 0)}
                    min="0"
                    className="flex-1"
                    placeholder="Volume limit"
                  />
                  <span className="text-sm text-[#004565]/70">emails/day</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDay(day)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#004565]/10">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedDomain.trim()}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

