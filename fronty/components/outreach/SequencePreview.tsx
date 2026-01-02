'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, Eye, ArrowRight } from 'lucide-react'
import { usePersonalizePreview } from '@/lib/hooks/useOutreach'
import { useLeads } from '@/lib/hooks/useLeads'

interface SequencePreviewProps {
  sequenceId: string
  stepIndex: number
  leadId?: string
  onClose?: () => void
}

export function SequencePreview({ sequenceId, stepIndex, leadId, onClose }: SequencePreviewProps) {
  const { data: leads } = useLeads()
  const preview = usePersonalizePreview()

  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '')
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedLead = leads?.find(l => l.id === selectedLeadId)

  const handlePreview = async () => {
    if (!selectedLeadId) {
      alert('Please select a lead to preview')
      return
    }

    setIsLoading(true)
    try {
      const result = await preview.mutateAsync({
        lead_id: selectedLeadId,
        sequence_id: sequenceId,
        step_index: stepIndex,
      })
      setPreviewData(result)
    } catch (error: any) {
      alert(error.message || 'Failed to generate preview')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Mail className="h-5 w-5" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="leadSelect" className="text-[#004565]">
            Select Lead for Preview
          </Label>
          <select
            id="leadSelect"
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Select a lead --</option>
            {leads?.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name || lead.email || `Lead ${lead.id.slice(0, 8)}`}
                {lead.company_name && ` - ${lead.company_name}`}
              </option>
            ))}
          </select>
        </div>

        {selectedLead && (
          <div className="p-3 bg-[#004565]/5 rounded-lg">
            <div className="text-sm font-medium text-[#004565]">
              {selectedLead.name || selectedLead.email}
            </div>
            {selectedLead.company_name && (
              <div className="text-xs text-[#004565]/70 mt-1">
                {selectedLead.company_name}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handlePreview}
          disabled={!selectedLeadId || isLoading}
          className="w-full bg-[#004565] hover:bg-[#004565]/90 text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          {isLoading ? 'Generating Preview...' : 'Generate Preview'}
        </Button>

        {previewData && (
          <div className="space-y-4 pt-4 border-t border-[#004565]/10">
            <div>
              <Label className="text-[#004565]">Subject Line</Label>
              <div className="p-3 bg-white border border-[#004565]/20 rounded-lg mt-1">
                {previewData.subject || previewData.personalized_content?.subject || 'No subject'}
              </div>
            </div>

            <div>
              <Label className="text-[#004565]">Email Body</Label>
              <div className="p-4 bg-white border border-[#004565]/20 rounded-lg mt-1 whitespace-pre-wrap min-h-[200px]">
                {previewData.personalized_content || previewData.content || 'No content'}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {previewData.confidence_score && (
                <Badge variant="outline" className="text-[#004565]">
                  Confidence: {previewData.confidence_score}%
                </Badge>
              )}
              {previewData.variables_used && previewData.variables_used.length > 0 && (
                <Badge variant="outline" className="text-[#004565]">
                  Variables: {previewData.variables_used.join(', ')}
                </Badge>
              )}
            </div>
          </div>
        )}

        {onClose && (
          <div className="flex justify-end pt-4 border-t border-[#004565]/10">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
            >
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

