'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Plus, Trash2, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { useSequenceBuilder } from '@/lib/hooks/useOutreach'

interface SequenceStep {
  id: string
  name: string
  days_after: number
  template_id?: string
  subject?: string
  enabled: boolean
}

interface SequenceBuilderProps {
  sequenceId?: string
  initialSteps?: SequenceStep[]
  onSave: (sequence: { name: string; description?: string; steps: any[]; is_active: boolean }) => void
  onCancel: () => void
}

export function SequenceBuilder({ sequenceId, initialSteps = [], onSave, onCancel }: SequenceBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<SequenceStep[]>(initialSteps.length > 0 ? initialSteps : [
    { id: '1', name: 'Initial Outreach', days_after: 0, enabled: true },
  ])
  const [isActive, setIsActive] = useState(true)

  const builder = useSequenceBuilder()
  const [isSaving, setIsSaving] = useState(false)

  const handleAddStep = () => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      name: `Step ${steps.length + 1}`,
      days_after: steps.length > 0 ? (steps[steps.length - 1].days_after || 0) + 3 : 0,
      enabled: true,
    }
    setSteps([...steps, newStep])
  }

  const handleRemoveStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id))
    }
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    if (direction === 'up' && index > 0) {
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]]
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    }
    setSteps(newSteps)
  }

  const handleUpdateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a sequence name')
      return
    }

    setIsSaving(true)
    try {
      const sequenceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        steps: steps.map((step, index) => ({
          id: step.id,
          name: step.name,
          days_after: step.days_after,
          template_id: step.template_id,
          subject: step.subject,
          enabled: step.enabled,
          step_index: index,
        })),
        is_active: isActive,
      }

      if (sequenceId) {
        await builder.update.mutateAsync({ id: sequenceId, updates: sequenceData })
      } else {
        await builder.create.mutateAsync(sequenceData)
      }

      onSave(sequenceData)
    } catch (error: any) {
      alert(error.message || 'Failed to save sequence')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#004565]">
            {sequenceId ? 'Edit Sequence' : 'Create New Sequence'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-[#004565]">Sequence Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., B2B Outreach Sequence"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-[#004565]">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this sequence"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-[#004565]"
            />
            <Label htmlFor="isActive" className="text-[#004565] cursor-pointer">
              Active
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#004565]">Sequence Steps</CardTitle>
          <Button
            onClick={handleAddStep}
            size="sm"
            className="bg-[#004565] hover:bg-[#004565]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className="border-[#004565]/10 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-2">
                    <GripVertical className="h-5 w-5 text-[#004565]/50" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[#004565]">
                        Step {index + 1}
                      </Badge>
                      <Input
                        value={step.name}
                        onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                        placeholder="Step name"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-[#004565]/70" />
                        <Input
                          type="number"
                          value={step.days_after}
                          onChange={(e) => handleUpdateStep(step.id, { days_after: parseInt(e.target.value) || 0 })}
                          className="w-20"
                          min="0"
                        />
                        <span className="text-sm text-[#004565]/70">days</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={(e) => handleUpdateStep(step.id, { enabled: e.target.checked })}
                        className="h-4 w-4 text-[#004565]"
                      />
                      <Label className="text-sm text-[#004565]/70 cursor-pointer">Enabled</Label>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(step.id)}
                    disabled={steps.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-[#004565] hover:bg-[#004565]/90 text-white"
        >
          {isSaving ? 'Saving...' : 'Save Sequence'}
        </Button>
      </div>
    </div>
  )
}

