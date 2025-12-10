'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Mail, Settings } from 'lucide-react'
import { CalendarIntegration } from '@/components/outreach/CalendarIntegration'
import { EmailRoutingRules } from '@/components/outreach/EmailRoutingRules'
import { useBookingTemplates, useSaveBookingTemplate, useDeleteBookingTemplate } from '@/lib/hooks/useOutreach'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Save } from 'lucide-react'

export default function BookingSettingsPage() {
  const { data: templates } = useBookingTemplates()
  const saveTemplate = useSaveBookingTemplate()
  const deleteTemplate = useDeleteBookingTemplate()

  const [showCalendarIntegration, setShowCalendarIntegration] = useState(true)
  const [showEmailRouting, setShowEmailRouting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const handleSaveTemplate = async (template: any) => {
    try {
      await saveTemplate.mutateAsync(template)
      setEditingTemplate(null)
    } catch (error: any) {
      alert(error.message || 'Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await deleteTemplate.mutateAsync(id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete template')
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <h1 className="text-4xl font-bold text-[#004565]">Booking Settings</h1>
        <p className="text-[#004565]/80 mt-2 font-medium">Configure calendar integrations and booking workflows</p>
        <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => {
            setShowCalendarIntegration(true)
            setShowEmailRouting(false)
            setShowTemplates(false)
          }}
          variant={showCalendarIntegration ? 'default' : 'outline'}
          className={showCalendarIntegration ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar Integration
        </Button>
        <Button
          onClick={() => {
            setShowCalendarIntegration(false)
            setShowEmailRouting(true)
            setShowTemplates(false)
          }}
          variant={showEmailRouting ? 'default' : 'outline'}
          className={showEmailRouting ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email Routing
        </Button>
        <Button
          onClick={() => {
            setShowCalendarIntegration(false)
            setShowEmailRouting(false)
            setShowTemplates(true)
          }}
          variant={showTemplates ? 'default' : 'outline'}
          className={showTemplates ? 'bg-[#004565] text-white' : 'border-[#004565]/30 text-[#004565]'}
        >
          <Settings className="h-4 w-4 mr-2" />
          Booking Templates
        </Button>
      </div>

      {showCalendarIntegration && (
        <CalendarIntegration
          onConnect={(provider, credentials) => {
            // Calendar connected: provider, credentials
          }}
          onDisconnect={(provider) => {
            // Calendar disconnected: provider
          }}
        />
      )}

      {showEmailRouting && (
        <EmailRoutingRules
          onSave={(rules) => {
            // Routing rules saved: rules
          }}
        />
      )}

      {showTemplates && (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#004565]">Booking Link Templates</CardTitle>
            <Button
              onClick={() => setEditingTemplate({ name: '', provider: 'calendly', template_url: '', variables: {}, is_default: false })}
              size="sm"
              className="bg-[#004565] hover:bg-[#004565]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Template
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingTemplate && (
              <Card className="border-[#004565]/30 bg-[#004565]/5">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[#004565]">Template Name</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Default Booking Link"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[#004565]">Provider</Label>
                    <select
                      value={editingTemplate.provider}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, provider: e.target.value })}
                      className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="calendly">Calendly</option>
                      <option value="google">Google Calendar</option>
                      <option value="outlook">Outlook</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[#004565]">Template URL</Label>
                    <Input
                      value={editingTemplate.template_url}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, template_url: e.target.value })}
                      placeholder="https://calendly.com/your-link"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_default}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, is_default: e.target.checked })}
                      className="h-4 w-4 text-[#004565]"
                    />
                    <Label className="text-[#004565] cursor-pointer">Set as default</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingTemplate(null)}
                      className="border-[#004565]/30 text-[#004565]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveTemplate(editingTemplate)}
                      className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {templates && templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border border-[#004565]/20 rounded-lg bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#004565]">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="success" className="text-xs">Default</Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">{template.provider}</Badge>
                      </div>
                      <div className="text-sm text-[#004565]/70">{template.template_url}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-[#004565]/50 border-2 border-dashed border-[#004565]/20 rounded-lg">
                No templates configured. Click "Add Template" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

