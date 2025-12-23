'use client'

import { useState, useMemo } from 'react'
import { useContacts, useCreateContact, useUpdateContact } from '@/lib/hooks/useContacts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { Database } from '@/lib/supabase/types'
import { Users, Plus, Mail, Phone, Building2, ArrowRight, Edit, ArrowUp, ArrowDown } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

// Sortable Header Component
function SortableHeader({ id, children, onClick }: { id: string; children: React.ReactNode; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    zIndex: transform ? 1 : 0,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-6 py-3 text-left text-xs font-semibold text-[#004565] uppercase tracking-wider cursor-move bg-[#004565]/5 relative group touch-none select-none"
      onClick={onClick}
    >
      {children}
    </th>
  )
}

export default function ContactsPage() {
  const { data: contacts, isLoading, error } = useContacts()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const queryClient = useQueryClient()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<ContactInsert & { company_name?: string | null }>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    company_name: '',
    is_decision_maker: false,
  })

  // Column definitions
  const allColumns = {
    hash: { label: '#' },
    first_name: { label: 'Name' },
    job_title: { label: 'Job Title' },
    email: { label: 'Email' },
    phone: { label: 'Phone' },
    company_name: { label: 'Company' },
    is_decision_maker: { label: 'Status' },
    actions: { label: 'Actions' },
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'hash',
    'first_name',
    'job_title',
    'email',
    'phone',
    'company_name',
    'is_decision_maker',
    'actions'
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedContacts = useMemo(() => {
    if (!contacts || !sortConfig) return contacts || []

    return [...contacts].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle booleans
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc' ? (aValue === bValue ? 0 : aValue ? 1 : -1) : (aValue === bValue ? 0 : aValue ? -1 : 1)
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      const comparison = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [contacts, sortConfig])

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUp className="h-3 w-3 ml-1 opacity-30" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    )
  }

  const handleOpenCreateDialog = () => {
    setIsEditing(false)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department: '',
      company_name: '',
      is_decision_maker: false,
    })
    setIsFormDialogOpen(true)
  }

  const handleOpenEditDialog = (contact: Contact) => {
    setIsEditing(true)
    setSelectedContact(contact)
    const contactWithCompany = contact as Contact & { company_name?: string | null }
    setFormData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      job_title: contact.job_title || '',
      department: contact.department || '',
      company_name: contactWithCompany.company_name || '',
      is_decision_maker: contact.is_decision_maker || false,
    })
    setIsFormDialogOpen(true)
  }

  const handleSaveContact = async () => {
    try {
      if (isEditing && selectedContact) {
        await updateContact.mutateAsync({
          id: selectedContact.id,
          updates: formData as ContactUpdate & { company_name?: string | null },
        })
      } else {
        await createContact.mutateAsync(formData as ContactInsert & { company_name?: string | null })
      }
      setIsFormDialogOpen(false)
      setSelectedContact(null)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    } catch (error: any) {
      alert(error.message || 'Failed to save contact')
    }
  }

  const renderCell = (contact: Contact, columnId: string, index: number) => {
    switch (columnId) {
      case 'hash':
        return <span className="text-sm text-[#004565]/70 font-mono">{index + 1}</span>
      case 'first_name':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {contact.first_name || contact.last_name
                  ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                  : 'Unnamed Contact'}
              </div>
              {contact.department && (
                <div className="text-sm text-gray-500">{contact.department}</div>
              )}
            </div>
          </div>
        )
      case 'job_title':
        return <div className="text-sm text-gray-900">{contact.job_title || '—'}</div>
      case 'email':
        return contact.email ? (
          <div className="flex items-center text-sm text-gray-900">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            <a
              href={`mailto:${contact.email}`}
              className="text-[#376EE1] hover:text-[#004565] hover:underline"
            >
              {contact.email}
            </a>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      case 'phone':
        return contact.phone ? (
          <div className="flex items-center text-sm text-gray-900">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <a
              href={`tel:${contact.phone}`}
              className="text-[#376EE1] hover:text-[#004565] hover:underline"
            >
              {contact.phone}
            </a>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      case 'company_name':
        return (contact as Contact & { company_name?: string | null }).company_name ? (
          <div className="flex items-center text-sm text-[#000000]">
            <Building2 className="h-4 w-4 mr-2 text-[#004565]/60" />
            {(contact as Contact & { company_name?: string | null }).company_name}
          </div>
        ) : (
          <span className="text-sm text-[#004565]/50">—</span>
        )
      case 'is_decision_maker':
        return contact.is_decision_maker ? (
          <Badge variant="default">Decision Maker</Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#004565] hover:text-[#004565]/80 hover:bg-[#004565]/10"
              onClick={() => handleOpenEditDialog(contact)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#004565]/20 border-t-[#004565] mx-auto mb-4"></div>
          <p className="text-sm text-[#004565] font-medium">Loading contacts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 z-40 bg-white shadow-sm pb-4">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">
              Contacts
            </h1>
          </div>
        </div>
        <Card className="border-red-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-2 font-semibold">Error loading contacts</p>
            <p className="text-sm text-[#000000]/80 mb-4">{error.message}</p>
            <p className="text-xs text-[#000000]/70">
              Please check your Supabase connection and ensure the database tables are set up correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white shadow-sm pb-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#004565]">
              Contacts
              <span className="ml-2 text-2xl text-[#004565]/60 font-medium">
                ({contacts?.length || 0})
              </span>
            </h1>
            <div className="absolute -top-2 -left-2 w-24 h-24 bg-[#376EE1]/20 rounded-full blur-2xl -z-10"></div>
          </div>
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      {contacts && contacts.length > 0 ? (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="overflow-x-scroll overflow-y-auto flex-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="w-full">
                    <thead className="sticky top-0 z-30 bg-[#004565]/5">
                      <tr className="border-b bg-[#004565]/5">
                        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                          {columnOrder.map((columnId) => (
                            <SortableHeader
                              key={columnId}
                              id={columnId}
                              onClick={() => {
                                // Only allow sorting if it's not the actions or hash column
                                if (columnId !== 'actions' && columnId !== 'hash') {
                                  handleSort(columnId)
                                }
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center">
                                  {allColumns[columnId as keyof typeof allColumns].label}
                                  {columnId !== 'actions' && columnId !== 'hash' && <SortIcon columnKey={columnId} />}
                                </span>
                              </div>
                            </SortableHeader>
                          ))}
                        </SortableContext>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#004565]/10">
                      {sortedContacts.map((contact, index) => (
                        <tr key={contact.id} className="hover:bg-[#004565]/5 transition-colors">
                          {columnOrder.map(columnId => (
                            <td key={columnId} className="px-6 py-4 whitespace-nowrap">
                              {renderCell(contact, columnId, index)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DndContext>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#004565]/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-[#004565]" />
            </div>
            <p className="text-[#004565] font-medium mb-2">No contacts found</p>
            <p className="text-[#004565]/70 text-sm mb-4">Create your first contact to get started.</p>
            <Button
              onClick={handleOpenCreateDialog}
              className="mt-4 bg-[#004565] hover:bg-[#004565]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Contact Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5 text-[#004565]" />
                  Edit Contact
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-[#004565]" />
                  New Contact
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update contact information' : 'Enter the details for the new contact'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-[#004565]">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-[#004565]">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-[#004565]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#004565]">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title" className="text-[#004565]">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title || ''}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="CEO"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-[#004565]">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Sales"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_name" className="text-[#004565]">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Corp"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_decision_maker"
                checked={formData.is_decision_maker || false}
                onChange={(e) => setFormData({ ...formData, is_decision_maker: e.target.checked })}
                className="h-4 w-4 text-[#004565]"
              />
              <Label htmlFor="is_decision_maker" className="text-[#004565] cursor-pointer">
                Decision Maker
              </Label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#004565]/10">
              <Button
                variant="outline"
                onClick={() => setIsFormDialogOpen(false)}
                className="border-[#004565]/30 text-[#004565] hover:bg-[#004565]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveContact}
                disabled={createContact.isPending || updateContact.isPending || (!formData.first_name && !formData.last_name)}
                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
              >
                {createContact.isPending || updateContact.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Contact' : 'Create Contact'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
