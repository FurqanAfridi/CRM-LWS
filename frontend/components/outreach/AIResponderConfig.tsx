'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bot, Save, Power } from 'lucide-react'
import { useAIResponderConfig, useSaveAIResponderConfig } from '@/lib/hooks/useOutreach'

interface AIResponderConfigProps {
  onSave?: (config: any) => void
}

const DEFAULT_RESPONSE_PROMPT = `You are an expert email responder for B2B sales conversations.

Analyze the conversation history and generate a professional, helpful response to the client's latest email.

Guidelines:
1. Be professional, friendly, and solution-oriented
2. Address all questions and concerns raised by the client
3. Keep the response concise and focused
4. Include a clear next step or call-to-action when appropriate
5. Maintain the conversation's tone and context
6. If the client shows interest, suggest a meeting or next steps
7. If they have concerns, address them directly and offer solutions

Context:
- Lead Name: {{lead_name}}
- Company: {{company_name}}
- Industry: {{industry}}
- Previous conversation: {{conversation_history}}

Client's latest message: {{client_message}}

Generate a response that:
- Acknowledges their message
- Addresses their specific points
- Provides value or solutions
- Encourages continued engagement

Return the response in JSON format:
{
  "subject": "Re: [original subject or new relevant subject]",
  "content": "Your response content here"
}`

const strategyDescriptions = {
  aggressive: 'Quick, proactive responses with strong calls-to-action',
  moderate: 'Balanced approach with thoughtful responses and natural progression',
  conservative: 'Cautious, formal responses that wait for clear signals',
}

export function AIResponderConfig({ onSave }: AIResponderConfigProps) {
  const { data: savedConfig, isLoading } = useAIResponderConfig()
  const saveConfig = useSaveAIResponderConfig()
  
  const [enabled, setEnabled] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const [strategy, setStrategy] = useState<'aggressive' | 'moderate' | 'conservative'>('moderate')
  const [responsePrompt, setResponsePrompt] = useState(DEFAULT_RESPONSE_PROMPT)
  const [responseDelay, setResponseDelay] = useState<number>(0)

  useEffect(() => {
    if (savedConfig) {
      setEnabled(savedConfig.enabled || false)
      setAutoSend(savedConfig.auto_send || false)
      setStrategy(savedConfig.strategy || 'moderate')
      setResponsePrompt(savedConfig.response_prompt || DEFAULT_RESPONSE_PROMPT)
      setResponseDelay(savedConfig.response_delay_minutes || 0)
    }
  }, [savedConfig])

  const handleSave = async () => {
    try {
      const config = {
        enabled,
        auto_send: autoSend,
        strategy,
        response_prompt: responsePrompt,
        response_delay_minutes: responseDelay,
      }
      
      await saveConfig.mutateAsync(config)
      
      if (onSave) {
        onSave(config)
      }
      
      alert('AI Responder configuration saved successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to save configuration')
    }
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Bot className="h-5 w-5" />
          AI Responder Configuration
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
          <Label htmlFor="enabled" className="text-[#004565] cursor-pointer flex items-center gap-2">
            <Power className={`h-4 w-4 ${enabled ? 'text-green-500' : 'text-gray-400'}`} />
            Enable AI Auto-Responder
          </Label>
        </div>

        {enabled && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSend"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="h-4 w-4 text-[#004565]"
              />
              <Label htmlFor="autoSend" className="text-[#004565] cursor-pointer">
                Automatically send responses (without manual review)
              </Label>
            </div>

            <div>
              <Label className="text-[#004565]">Response Strategy</Label>
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
              <Label htmlFor="responseDelay" className="text-[#004565]">
                Response Delay (minutes)
              </Label>
              <Input
                id="responseDelay"
                type="number"
                min="0"
                max="4320"
                value={responseDelay}
                onChange={(e) => setResponseDelay(parseInt(e.target.value) || 0)}
                className="mt-1 border-[#004565]/30"
                placeholder="0"
              />
              <p className="text-xs text-[#004565]/70 mt-1">
                Wait this many minutes before sending auto-responses (0 = immediate, max 72 hours = 4320 minutes)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#004565]">Response Generation Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResponsePrompt(DEFAULT_RESPONSE_PROMPT)}
                  className="text-xs text-[#004565]/70 hover:text-[#004565]"
                >
                  Reset to Default
                </Button>
              </div>
              <Textarea
                value={responsePrompt}
                onChange={(e) => setResponsePrompt(e.target.value)}
                className="min-h-[300px] font-mono text-sm border-[#004565]/30"
                placeholder="Enter your prompt template here..."
              />
              <p className="text-xs text-[#004565]/70 mt-1">
                Use variables like {'{'} {'{'}}lead_name{'}'} {'}'}, {'{'} {'{'}}company_name{'}'} {'}'}, {'{'} {'{'}}conversation_history{'}'} {'}'}, {'{'} {'{'}}client_message{'}'} {'}'}
              </p>
            </div>

            <div className="pt-4 border-t border-[#004565]/10">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">How it works:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>When a client responds to your outreach, the AI will analyze the conversation</li>
                  <li>It will generate a contextual response based on your prompt and strategy</li>
                  {autoSend ? (
                    <li className="font-semibold">Responses will be sent automatically after the delay period</li>
                  ) : (
                    <li>Responses will be generated and saved for your review before sending</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-[#004565]/10">
          <Button
            onClick={handleSave}
            disabled={saveConfig.isPending || isLoading}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveConfig.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

