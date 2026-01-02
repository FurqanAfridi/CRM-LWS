'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEmailSequences, useStartSequence } from '@/lib/hooks/useOutreach'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

interface StartSequenceDialogProps {
  leadIds: string[] // Changed to support multiple leads
  leadNames?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function StartSequenceDialog({ leadIds, leadNames, open, onOpenChange, onSuccess }: StartSequenceDialogProps) {
  // Fetch all sequences first, then filter active ones in the component
  const { data: allSequences, isLoading, error } = useEmailSequences(false)
  const startSequence = useStartSequence()
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Filter to only show active sequences
  const sequences = useMemo(() => {
    return allSequences?.filter((seq) => seq.is_active === true) || []
  }, [allSequences])

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSequenceId(null)
    }
  }, [open])

  const handleStart = async () => {
    if (!selectedSequenceId || leadIds.length === 0) return

    // Get the selected sequence to extract template_id from first step
    const selectedSequence = allSequences?.find((seq) => seq.id === selectedSequenceId)
    const steps = (selectedSequence?.steps as any[]) || []
    const firstStep = steps[0] || {}
    const sequenceTemplateId = firstStep.template_id || firstStep.id || null

    setIsStarting(true)
    try {
      // Start sequence for all selected leads
      const promises = leadIds.map((leadId) =>
        startSequence.mutateAsync({
          lead_id: leadId,
          sequence_id: selectedSequenceId,
          sequence_template_id: sequenceTemplateId,
        })
      )

      await Promise.all(promises)
      
      if (onSuccess) {
        onSuccess()
      }
      onOpenChange(false)
      setSelectedSequenceId(null)
    } catch (error: any) {
      alert(error.message || 'Failed to start sequence for one or more leads')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#004565]">Start Email Sequence</DialogTitle>
          <DialogDescription>
            {leadIds.length === 1
              ? leadNames?.[0] 
                ? `Select a sequence to start for ${leadNames[0]}`
                : 'Select a sequence to start for this lead'
              : `Select a sequence to start for ${leadIds.length} selected lead${leadIds.length > 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#004565]" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">Error loading sequences</p>
            <p className="text-sm text-[#004565]/70 mb-4">
              {error instanceof Error ? error.message : 'Failed to load sequences'}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-[#004565]/30 text-[#004565]"
            >
              Retry
            </Button>
          </div>
        ) : sequences && sequences.length > 0 ? (
          <div className="space-y-4 mt-4">
            {sequences.map((sequence) => {
              const steps = (sequence.steps as any[]) || []
              const isSelected = selectedSequenceId === sequence.id
              
              return (
                <Card
                  key={sequence.id}
                  className={`border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#004565] bg-[#004565]/5'
                      : 'border-[#004565]/20 hover:border-[#004565]/40'
                  }`}
                  onClick={() => setSelectedSequenceId(sequence.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#004565]">{sequence.name}</h3>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-[#004565]" />
                          )}
                        </div>
                        {sequence.description && (
                          <p className="text-sm text-[#004565]/70 mb-3">{sequence.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-[#004565]/70">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {steps.length} step{steps.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {steps.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {steps.slice(0, 3).map((step, index) => (
                              <div key={index} className="text-xs text-[#004565]/60">
                                Step {index + 1}: {step.name || `Step ${index + 1}`} ({step.days_after || 0} days)
                              </div>
                            ))}
                            {steps.length > 3 && (
                              <div className="text-xs text-[#004565]/60">
                                +{steps.length - 3} more step{steps.length - 3 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant={sequence.is_active ? 'default' : 'outline'}>
                        {sequence.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#004565]/10">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isStarting}
                className="border-[#004565]/30 text-[#004565]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={!selectedSequenceId || isStarting || leadIds.length === 0}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting for {leadIds.length} lead{leadIds.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  `Start Sequence ${leadIds.length > 1 ? `(${leadIds.length} leads)` : ''}`
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
            <p className="text-[#004565] font-medium mb-2">No active sequences found</p>
            <p className="text-sm text-[#004565]/70 mb-4">
              {allSequences && allSequences.length > 0
                ? `You have ${allSequences.length} sequence(s) but none are active. Please activate a sequence in the Sequences page, or create a new one.`
                : 'No sequences available. Please create a sequence in the Sequences page first.'}
            </p>
            {allSequences && allSequences.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <p className="font-semibold mb-1">Available sequences (inactive):</p>
                <ul className="list-disc list-inside space-y-1">
                  {allSequences.map((seq) => (
                    <li key={seq.id}>{seq.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

