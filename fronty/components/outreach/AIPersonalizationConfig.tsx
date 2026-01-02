'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Eye, Save } from 'lucide-react'
import { usePersonalizationConfig, useSavePersonalizationConfig, usePersonalizePreview } from '@/lib/hooks/useOutreach'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AIPersonalizationConfigProps {
  sequenceId: string
  stepIndex: number
  onSave: (config: any) => void
  onClose?: () => void
}

const DEFAULT_PROMPT_TEMPLATE = `You are an expert B2B email copywriter specializing in personalized outreach.

Write a professional, personalized email based on the following lead information:
- Lead Name: {{lead_name}}
- Company: {{company_name}}
- Industry: {{industry}}
- Email: {{email}}
- Pain Points: {{pain_points}}

Instructions:
1. Create a compelling subject line (max 60 characters)
2. Write an engaging email body (3-4 paragraphs)
3. Use a professional but friendly tone
4. Address their specific pain points
5. Include a clear call-to-action
6. Keep it concise and scannable

Strategy: {{strategy}}
- If "aggressive": Be highly creative, use all available data, take more risks
- If "moderate": Balanced approach, professional yet personable
- If "conservative": Formal tone, minimal personalization, safe messaging

Return the response in JSON format:
{
  "subject": "Your subject line here",
  "content": "Your email body here"
}`

export function AIPersonalizationConfig({ sequenceId, stepIndex, onSave, onClose }: AIPersonalizationConfigProps) {
  const { data: config, isLoading } = usePersonalizationConfig(sequenceId, stepIndex)
  const saveConfig = useSavePersonalizationConfig()
  const preview = usePersonalizePreview()

  const [enabled, setEnabled] = useState(true)
  const [strategy, setStrategy] = useState<'aggressive' | 'moderate' | 'conservative'>('moderate')
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE)
  const [variables, setVariables] = useState<Record<string, boolean>>({
    lead_name: true,
    company_name: true,
    industry: true,
    pain_points: true,
    email: true,
  })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled ?? true)
      setStrategy((config.strategy as any) || 'moderate')
      setPromptTemplate(config.prompt_template || DEFAULT_PROMPT_TEMPLATE)
      setVariables(config.variables || {
        lead_name: true,
        company_name: true,
        industry: true,
        pain_points: true,
        email: true,
      })
    } else {
      // Set defaults if no config exists
      setPromptTemplate(DEFAULT_PROMPT_TEMPLATE)
    }
  }, [config])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveConfig.mutateAsync({
        sequence_id: sequenceId,
        step_index: stepIndex,
        prompt_template: promptTemplate,
        strategy,
        variables,
        enabled,
      })
      onSave({ enabled, strategy, promptTemplate, variables })
      if (onClose) onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save personalization config')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = async () => {
    // Show a message that preview needs a lead
    alert('To preview personalized emails, use the Preview button in the Sequence Preview dialog after selecting a lead.')
  }

  const strategyDescriptions = {
    aggressive: 'Highly personalized, uses all available data, more creative',
    moderate: 'Balanced personalization, professional tone',
    conservative: 'Minimal personalization, formal and safe',
  }

  return (
    <>
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#004565]">
            <Sparkles className="h-5 w-5" />
            AI Personalization Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 text-[#004565]"
            />
            <Label htmlFor="enabled" className="text-[#004565] cursor-pointer">
              Enable AI Personalization for this step
            </Label>
          </div>

          {enabled && (
            <>
              <div>
                <Label className="text-[#004565]">Personalization Strategy</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['aggressive', 'moderate', 'conservative'] as const).map((strat) => (
                    <button
                      key={strat}
                      onClick={() => setStrategy(strat)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        strategy === strat
                          ? 'border-[#004565] bg-[#004565]/10'
                          : 'border-[#004565]/20 hover:border-[#004565]/40'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#004565] capitalize">{strat}</div>
                      <div className="text-xs text-[#004565]/70 mt-1">
                        {strategyDescriptions[strat]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="promptTemplate" className="text-[#004565]">
                  Prompt Template
                </Label>
                <Textarea
                  id="promptTemplate"
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="Enter your personalization prompt template. Use variables like {{lead_name}}, {{company_name}}, etc."
                  className="mt-1 min-h-[200px] font-mono text-sm"
                  rows={10}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[#004565]/70">
                    Available variables: {'{'}lead_name{'}'}, {'{'}company_name{'}'}, {'{'}industry{'}'}, {'{'}pain_points{'}'}, {'{'}email{'}'}, {'{'}strategy{'}'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPromptTemplate(DEFAULT_PROMPT_TEMPLATE)}
                    className="text-xs h-6 text-[#004565]/70 hover:text-[#004565]"
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[#004565] mb-2 block">Variables to Include</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(variables).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`var-${key}`}
                        checked={variables[key]}
                        onChange={(e) => setVariables({ ...variables, [key]: e.target.checked })}
                        className="h-4 w-4 text-[#004565]"
                      />
                      <Label htmlFor={`var-${key}`} className="text-sm text-[#004565]/70 cursor-pointer capitalize">
                        {key.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#004565]/10">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!enabled}
              className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#004565] hover:bg-[#004565]/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#004565]">Personalization Preview</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#004565]">Subject</Label>
                <div className="p-3 bg-[#004565]/5 rounded-lg mt-1">
                  {previewData.subject}
                </div>
              </div>
              <div>
                <Label className="text-[#004565]">Content</Label>
                <div className="p-3 bg-[#004565]/5 rounded-lg mt-1 whitespace-pre-wrap">
                  {previewData.content}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[#004565]">
                  Strategy: {previewData.strategy}
                </Badge>
                <Badge variant="outline" className="text-[#004565]">
                  Variables: {previewData.variables_used.length}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

