'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, Mail } from 'lucide-react'
import { useEmailSequences, useSequenceBuilder } from '@/lib/hooks/useOutreach'
import { SequenceBuilder } from '@/components/outreach/SequenceBuilder'
import { AIPersonalizationConfig } from '@/components/outreach/AIPersonalizationConfig'
import { SequencePreview } from '@/components/outreach/SequencePreview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SequencesPage() {
  const { data: sequences, isLoading } = useEmailSequences()
  const builder = useSequenceBuilder()

  const [showBuilder, setShowBuilder] = useState(false)
  const [editingSequenceId, setEditingSequenceId] = useState<string | null>(null)
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleCreateNew = () => {
    setEditingSequenceId(null)
    setShowBuilder(true)
  }

  const handleEdit = (id: string) => {
    setEditingSequenceId(id)
    setShowBuilder(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sequence?')) {
      return
    }

    try {
      await builder.delete.mutateAsync(id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete sequence')
    }
  }

  const handleSaveSequence = (sequence: any) => {
    setShowBuilder(false)
    setEditingSequenceId(null)
  }

  const handleConfigurePersonalization = (sequenceId: string, stepIndex: number) => {
    setSelectedSequenceId(sequenceId)
    setSelectedStepIndex(stepIndex)
    setShowPersonalization(true)
  }

  const handlePreview = (sequenceId: string, stepIndex: number) => {
    setSelectedSequenceId(sequenceId)
    setSelectedStepIndex(stepIndex)
    setShowPreview(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 className="text-4xl font-bold text-[#004565]">Email Sequences</h1>
          <p className="text-[#004565]/80 mt-2 font-medium">Create and manage your email outreach sequences</p>
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-[#004565] hover:bg-[#004565]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      {showBuilder && (
        <SequenceBuilder
          sequenceId={editingSequenceId || undefined}
          onSave={handleSaveSequence}
          onCancel={() => {
            setShowBuilder(false)
            setEditingSequenceId(null)
          }}
        />
      )}

      {!showBuilder && (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-[#004565]">All Sequences</CardTitle>
          </CardHeader>
          <CardContent>
            {sequences && sequences.length > 0 ? (
              <div className="space-y-4">
                {sequences.map((sequence) => {
                  const steps = (sequence.steps as any[]) || []
                  return (
                    <Card key={sequence.id} className="border-[#004565]/10 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-[#004565]">{sequence.name}</h3>
                              <Badge variant={sequence.is_active ? 'success' : 'outline'}>
                                {sequence.is_active ? 'Active' : 'Inactive'}
                              </Badge>
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
                            <div className="mt-3 space-y-2">
                              {steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    Step {index + 1}
                                  </Badge>
                                  <span className="text-[#004565]/70">{step.name || `Step ${index + 1}`}</span>
                                  <span className="text-[#004565]/50">({step.days_after || 0} days)</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleConfigurePersonalization(sequence.id, index)}
                                    className="h-6 text-xs text-[#004565] hover:bg-[#004565]/10"
                                  >
                                    Configure AI
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(sequence.id, index)}
                                    className="h-6 text-xs text-[#004565] hover:bg-[#004565]/10"
                                  >
                                    Preview
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(sequence.id)}
                              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(sequence.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-[#004565]/50 mb-4" />
                <p className="text-[#004565]/70 mb-4">No sequences created yet</p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sequence
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showPersonalization} onOpenChange={setShowPersonalization}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">AI Personalization Configuration</DialogTitle>
          </DialogHeader>
          {selectedSequenceId && selectedStepIndex !== null && (
            <AIPersonalizationConfig
              sequenceId={selectedSequenceId}
              stepIndex={selectedStepIndex}
              onSave={() => setShowPersonalization(false)}
              onClose={() => setShowPersonalization(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Email Preview</DialogTitle>
          </DialogHeader>
          {selectedSequenceId && selectedStepIndex !== null && (
            <SequencePreview
              sequenceId={selectedSequenceId}
              stepIndex={selectedStepIndex}
              onClose={() => setShowPreview(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

