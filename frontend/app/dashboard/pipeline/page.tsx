'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarIntegration } from '@/components/outreach/CalendarIntegration'
import { AIResponderConfig } from '@/components/outreach/AIResponderConfig'
import { useEmailSequences } from '@/lib/hooks/useOutreach'
import { RefreshCw, Settings, Mail, Plus, Calendar, Edit, Trash2, Sparkles, Eye, Bot } from 'lucide-react'
import { SequenceBuilder } from '@/components/outreach/SequenceBuilder'
import { useSequenceBuilder } from '@/lib/hooks/useOutreach'
import { AIPersonalizationConfig } from '@/components/outreach/AIPersonalizationConfig'
import { SequencePreview } from '@/components/outreach/SequencePreview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function PipelinePage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false)
  const [editingSequenceId, setEditingSequenceId] = useState<string | null>(null)
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const { data: sequences, isLoading: sequencesLoading } = useEmailSequences()
  const builder = useSequenceBuilder()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Trigger a window refresh to refetch all queries
    window.location.reload()
  }

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
          <Button
            onClick={() => {
              setEditingSequenceId(null)
              setShowSequenceBuilder(true)
            }}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
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

      {/* Sequences Section */}
      {showSequenceBuilder ? (
        <SequenceBuilder
          sequenceId={editingSequenceId || undefined}
          onSave={() => {
            setShowSequenceBuilder(false)
            setEditingSequenceId(null)
          }}
          onCancel={() => {
            setShowSequenceBuilder(false)
            setEditingSequenceId(null)
          }}
        />
      ) : (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#004565]">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Sequences
              </div>
              <Button
                onClick={() => {
                  setEditingSequenceId(null)
                  setShowSequenceBuilder(true)
                }}
                size="sm"
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Sequence
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sequencesLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
              </div>
            ) : sequences && sequences.length > 0 ? (
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
                              <Badge variant={sequence.is_active ? 'default' : 'outline'}>
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
                            {steps.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {steps.map((step, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-[#004565]/5 rounded border border-[#004565]/10">
                                    <div className="text-xs text-[#004565]/70">
                                      Step {index + 1}: {step.name || `Step ${index + 1}`} ({step.days_after || 0} days)
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSequenceId(sequence.id)
                                          setSelectedStepIndex(index)
                                          setShowPersonalization(true)
                                        }}
                                        className="h-6 px-2 text-[#004565] hover:bg-[#004565]/10"
                                      >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        <span className="text-xs">AI Config</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSequenceId(sequence.id)
                                          setSelectedStepIndex(index)
                                          setShowPreview(true)
                                        }}
                                        className="h-6 px-2 text-[#004565] hover:bg-[#004565]/10"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Preview</span>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSequenceId(sequence.id)
                                setShowSequenceBuilder(true)
                              }}
                              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this sequence?')) return
                                try {
                                  await builder.delete.mutateAsync(sequence.id)
                                } catch (error: any) {
                                  alert(error.message || 'Failed to delete sequence')
                                }
                              }}
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
                <p className="text-[#004565] font-medium mb-2">No sequences found</p>
                <p className="text-sm text-[#004565]/70 mb-4">Create your first email sequence to get started</p>
                <Button
                  onClick={() => {
                    setEditingSequenceId(null)
                    setShowSequenceBuilder(true)
                  }}
                  className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Responder Configuration */}
      <AIResponderConfig />

      {/* Calendly Schedule */}
      <CalendarIntegration />

      {/* AI Personalization Configuration Dialog */}
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

      {/* Sequence Preview Dialog */}
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
