'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { useEmailRoutingRules, useSaveEmailRoutingRule, useDeleteEmailRoutingRule } from '@/lib/hooks/useOutreach'

interface EmailRoutingRule {
  id?: string
  trigger_event: string
  conditions: any
  action_type: string
  recipient_email: string
  template_id?: string
  priority: number
  is_active: boolean
}

interface EmailRoutingRulesProps {
  rules?: EmailRoutingRule[]
  onSave: (rules: EmailRoutingRule[]) => void
}

export function EmailRoutingRules({ onSave }: EmailRoutingRulesProps) {
  const { data: existingRules = [], isLoading } = useEmailRoutingRules()
  const saveRule = useSaveEmailRoutingRule()
  const deleteRule = useDeleteEmailRoutingRule()

  const [rules, setRules] = useState<EmailRoutingRule[]>(existingRules)
  const [editingRule, setEditingRule] = useState<EmailRoutingRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (existingRules.length > 0) {
      setRules(existingRules)
    }
  }, [existingRules])

  const handleAddRule = () => {
    const newRule: EmailRoutingRule = {
      trigger_event: 'booking_confirmed',
      conditions: {},
      action_type: 'send_email',
      recipient_email: '',
      priority: rules.length,
      is_active: true,
    }
    setEditingRule(newRule)
  }

  const handleEditRule = (rule: EmailRoutingRule) => {
    setEditingRule({ ...rule })
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) {
      return
    }

    try {
      await deleteRule.mutateAsync(id)
      setRules(rules.filter(r => r.id !== id))
      onSave(rules.filter(r => r.id !== id))
    } catch (error: any) {
      alert(error.message || 'Failed to delete rule')
    }
  }

  const handleSaveRule = async () => {
    if (!editingRule) return

    if (!editingRule.trigger_event || !editingRule.recipient_email) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const result = await saveRule.mutateAsync(editingRule)
      const updatedRule = result.rule || editingRule

      if (editingRule.id) {
        setRules(rules.map(r => r.id === editingRule.id ? updatedRule : r))
      } else {
        setRules([...rules, updatedRule])
      }

      setEditingRule(null)
      onSave(editingRule.id ? rules.map(r => r.id === editingRule.id ? updatedRule : r) : [...rules, updatedRule])
    } catch (error: any) {
      alert(error.message || 'Failed to save rule')
    } finally {
      setIsSaving(false)
    }
  }

  const triggerEvents = [
    { value: 'booking_confirmed', label: 'Booking Confirmed' },
    { value: 'booking_cancelled', label: 'Booking Cancelled' },
    { value: 'booking_reminder', label: 'Booking Reminder' },
    { value: 'email_replied', label: 'Email Replied' },
  ]

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'notify_team', label: 'Notify Team' },
    { value: 'update_lead', label: 'Update Lead Status' },
  ]

  if (isLoading) {
    return (
      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-[#004565]">
          <Mail className="h-5 w-5" />
          Email Routing Rules
        </CardTitle>
        <Button
          onClick={handleAddRule}
          size="sm"
          className="bg-[#004565] hover:bg-[#004565]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#004565]/50 border-2 border-dashed border-[#004565]/20 rounded-lg">
            No routing rules configured. Click "Add Rule" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div
                key={rule.id || index}
                className="p-4 border border-[#004565]/20 rounded-lg bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={rule.is_active ? 'success' : 'outline'} className="text-[#004565]">
                        {rule.trigger_event.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-[#004565]/70">→</span>
                      <Badge variant="outline" className="text-[#004565]">
                        {rule.action_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-[#004565]/50">Priority: {rule.priority}</span>
                    </div>
                    <div className="text-sm text-[#004565]">
                      Send to: <span className="font-medium">{rule.recipient_email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      className="text-[#004565] hover:bg-[#004565]/10"
                    >
                      Edit
                    </Button>
                    {rule.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingRule && (
          <Card className="border-[#004565]/30 bg-[#004565]/5">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-[#004565]">Trigger Event *</Label>
                <select
                  value={editingRule.trigger_event}
                  onChange={(e) => setEditingRule({ ...editingRule, trigger_event: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {triggerEvents.map(event => (
                    <option key={event.value} value={event.value}>{event.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-[#004565]">Action Type *</Label>
                <select
                  value={editingRule.action_type}
                  onChange={(e) => setEditingRule({ ...editingRule, action_type: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {actionTypes.map(action => (
                    <option key={action.value} value={action.value}>{action.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="recipientEmail" className="text-[#004565]">Recipient Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={editingRule.recipient_email}
                  onChange={(e) => setEditingRule({ ...editingRule, recipient_email: e.target.value })}
                  placeholder="recipient@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-[#004565]">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingRule.is_active}
                  onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                  className="h-4 w-4 text-[#004565]"
                />
                <Label htmlFor="isActive" className="text-[#004565] cursor-pointer">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingRule(null)}
                  className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRule}
                  disabled={isSaving}
                  className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Rule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

