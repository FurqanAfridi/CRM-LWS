'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Pipeline kanban board coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

