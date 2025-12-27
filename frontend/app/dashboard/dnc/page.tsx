'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ban, Plus, Trash2, Search, Upload, Building2, Users } from 'lucide-react'

// Mock Data for DNC List (since no backend table exists yet)
const INITIAL_DNC_DATA = [
  { id: '1', type: 'company', value: 'bad-company.com', reason: 'Requested removal', added_at: '2023-12-01' },
  { id: '2', type: 'contact', value: 'john.doe@competitor.com', reason: 'Competitor', added_at: '2023-12-05' },
  { id: '3', type: 'company', value: 'example-corp.com', reason: 'Hard bounce', added_at: '2023-12-10' },
  { id: '4', type: 'contact', value: 'jane@spam.com', reason: 'Spam complaints', added_at: '2023-12-15' },
]

export default function DNCPage() {
  const [dncList, setDncList] = useState(INITIAL_DNC_DATA)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addMode, setAddMode] = useState<'single' | 'list'>('single')
  const [newEntry, setNewEntry] = useState({ type: 'company', value: '', reason: '' })
  
  // Filter logic
  const filteredList = dncList.filter(item => 
    item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSubmit = () => {
    if (addMode === 'single') {
      if (!newEntry.value) return
      
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: newEntry.type,
        value: newEntry.value,
        reason: newEntry.reason || 'Manual Add',
        added_at: new Date().toISOString().split('T')[0]
      }
      
      setDncList([newItem, ...dncList])
      setNewEntry({ type: 'company', value: '', reason: '' })
      setIsAddDialogOpen(false)
      // In a real app, this would make an API call using useMutation
      alert(`Added ${newItem.value} to DNC list`)
    } else {
      // Simulation for list upload
      alert("List processed and added to DNC (Simulation)")
      setIsAddDialogOpen(false)
    }
  }

  const handleRemove = (id: string, value: string) => {
    if (window.confirm(`Are you sure you want to remove ${value} from the DNC list?`)) {
      setDncList(dncList.filter(item => item.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#004565] flex items-center gap-2">
            <Ban className="h-8 w-8 text-red-600" />
            DNC List
          </h1>
          <p className="text-[#004565]/70 mt-1">Manage Do Not Contact entries for companies and contacts</p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to DNC
        </Button>
      </div>

      <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004565]/50" />
                <Input 
                    placeholder="Search DNC list..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white border-[#004565]/20 focus:border-[#004565]"
                />
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Entries</TabsTrigger>
              <TabsTrigger value="company">Companies</TabsTrigger>
              <TabsTrigger value="contact">Contacts</TabsTrigger>
            </TabsList>
            
            {['all', 'company', 'contact'].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                <div className="rounded-md border border-[#004565]/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#004565]/5 border-b border-[#004565]/10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Value (Domain/Email)</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Reason</th>
                        <th className="px-4 py-3 text-left font-medium text-[#004565]">Date Added</th>
                        <th className="px-4 py-3 text-right font-medium text-[#004565]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#004565]/10 bg-white">
                        {filteredList
                            .filter(item => tabValue === 'all' || item.type === tabValue)
                            .map((item) => (
                            <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className={item.type === 'company' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-purple-200 text-purple-700 bg-purple-50'}>
                                        {item.type === 'company' ? <Building2 className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                                        {item.type === 'company' ? 'Company' : 'Contact'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">{item.value}</td>
                                <td className="px-4 py-3 text-gray-500">{item.reason}</td>
                                <td className="px-4 py-3 text-gray-500">{item.added_at}</td>
                                <td className="px-4 py-3 text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemove(item.id, item.value)}
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredList.filter(item => tabValue === 'all' || item.type === tabValue).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                                    No entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add DNC Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to DNC List</DialogTitle>
            <DialogDescription>
              Block outreach to specific companies or contacts.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'single' | 'list')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">Single Entry</TabsTrigger>
                <TabsTrigger value="list">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
                <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Type</Label>
                    <div className="col-span-3 flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                checked={newEntry.type === 'company'} 
                                onChange={() => setNewEntry({...newEntry, type: 'company'})}
                                className="text-[#004565]"
                            />
                            Company
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                checked={newEntry.type === 'contact'} 
                                onChange={() => setNewEntry({...newEntry, type: 'contact'})}
                                className="text-[#004565]"
                            />
                            Contact
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Value</Label>
                    <Input 
                        placeholder={newEntry.type === 'company' ? 'example.com' : 'email@example.com'}
                        className="col-span-3"
                        value={newEntry.value}
                        onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-right">Reason</Label>
                    <Input 
                        placeholder="Optional reason..."
                        className="col-span-3"
                        value={newEntry.reason}
                        onChange={(e) => setNewEntry({...newEntry, reason: e.target.value})}
                    />
                </div>
            </TabsContent>

            <TabsContent value="list" className="py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">CSV, XLS, XLSX containing domains or emails</p>
                    <Input type="file" className="hidden" />
                </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} className="bg-red-600 hover:bg-red-700 text-white">
                {addMode === 'single' ? 'Add Entry' : 'Process List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
