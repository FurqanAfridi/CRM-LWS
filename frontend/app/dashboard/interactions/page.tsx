'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function InteractionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interactions</h1>
        <p className="text-gray-600 mt-1">View all interactions and communications</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Interactions timeline coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

