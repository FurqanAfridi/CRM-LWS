# DNC Feature - Loading States and Cache Updates

## Summary
This document contains the exact code changes needed to add loading states to DNC modal buttons and update cache instead of reloading the page.

## Files to Update

### 1. Companies Page (`frontend/app/dashboard/companies/page.tsx`)

#### Step 1: Add import (line 4, after useCompanies import)
```tsx
import { useQueryClient } from '@tanstack/react-query'
```

#### Step 2: Add queryClient (line 75, first line in component)
```tsx
const queryClient = useQueryClient()
```

#### Step 3: Add new state variables (after line 107, after isDncDialogOpen)
```tsx
const [isDncConfirmOpen, setIsDncConfirmOpen] = useState(false)
const [isSubmittingDNC, setIsSubmittingDNC] = useState(false)
const [dncReasonInput, setDncReasonInput] = useState('')
const [companyToMarkDNC, setCompanyToMarkDNC] = useState<Company | null>(null)
```

#### Step 4: Replace handleMarkDNC function (around line 236-244)
Replace the entire function with:
```tsx
const handleMarkDNC = (company: Company | null) => {
  if (!company) {
    alert('DNC List uploaded successfully (Simulation)')
    setIsDncDialogOpen(false)
    return
  }

  setCompanyToMarkDNC(company)
  setDncReasonInput('')
  setIsDncConfirmOpen(true)
}

const confirmMarkDNC = async () => {
  if (!companyToMarkDNC) return

  const isDNC = !companyToMarkDNC.is_dnc
  const reason = isDNC ? (dncReasonInput || 'Marked as DNC') : null

  setIsSubmittingDNC(true)
  try {
    const response = await fetch(`/api/companies/${companyToMarkDNC.id}/dnc`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_dnc: isDNC,
        dnc_reason: reason
        }),
    })

    if (!response.ok) {
      throw new Error('Failed to update DNC status')
    }

    // Update the cache instead of reloading
    queryClient.setQueryData(['companies', { search: debouncedSearch }], (oldData: any) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any[]) =>
          page.map((company: any) =>
            company.id === companyToMarkDNC.id
              ? { ...company, is_dnc: isDNC, dnc_reason: reason, dnc_date: isDNC ? new Date().toISOString() : null }
              : company
          )
        )
      }
    })

    // Close dialog
    setIsDncConfirmOpen(false)
    setCompanyToMarkDNC(null)
    setDncReasonInput('')
  } catch (error) {
    console.error('Error updating DNC status:', error)
    alert('Failed to update DNC status. Please try again.')
  } finally {
    setIsSubmittingDNC(false)
  }
}
```

#### Step 5: Add DNC Confirmation Dialog (before the final `</div>` and `</div>` at the end)
Add this AFTER the "Upload DNC List Dialog" (after line 662):
```tsx
{/* DNC Confirmation Dialog */}
<Dialog open={isDncConfirmOpen} onOpenChange={setIsDncConfirmOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Ban className="h-5 w-5 text-red-600" />
        {companyToMarkDNC?.is_dnc ? 'Remove from DNC List' : 'Mark as DNC'}
      </DialogTitle>
      <DialogDescription>
        {companyToMarkDNC?.is_dnc 
          ? `Are you sure you want to remove "${companyToMarkDNC?.name}" from the Do Not Contact list?`
          : `Are you sure you want to mark "${companyToMarkDNC?.name}" as Do Not Contact?`
        }
      </DialogDescription>
    </DialogHeader>

    {!companyToMarkDNC?.is_dnc && (
      <div className="space-y-2 py-4">
        <Label htmlFor="dnc-reason">Reason (optional)</Label>
        <Input
          id="dnc-reason"
          placeholder="e.g., Requested removal, Competitor, etc."
          value={dncReasonInput}
          onChange={(e) => setDncReasonInput(e.target.value)}
          className="border-[#004565]/20 focus:border-[#004565]"
          disabled={isSubmittingDNC}
        />
      </div>
    )}

    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => {
          setIsDncConfirmOpen(false)
          setCompanyToMarkDNC(null)
          setDncReasonInput('')
        }}
        disabled={isSubmittingDNC}
      >
        Cancel
      </Button>
      <Button 
        variant={companyToMarkDNC?.is_dnc ? "default" : "destructive"}
        onClick={confirmMarkDNC}
        className={companyToMarkDNC?.is_dnc ? "" : "bg-red-600 hover:bg-red-700"}
        disabled={isSubmittingDNC}
      >
        {isSubmittingDNC ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {companyToMarkDNC?.is_dnc ? 'Removing...' : 'Marking...'}
          </>
        ) : (
          <>
            <Ban className="h-4 w-4 mr-2" />
            {companyToMarkDNC?.is_dnc ? 'Remove from DNC' : 'Mark as DNC'}
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 2. DNC Page (`frontend/app/dashboard/dnc/page.tsx`)

#### Step 1: Add state variables (after line 25)
```tsx
const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)
const [isSubmittingRemove, setIsSubmittingRemove] = useState(false)
const [itemToRemove, setItemToRemove] = useState<DNCEntry | null>(null)
```

#### Step 2: Replace handleRemove function (around line 73)
Replace with:
```tsx
const handleRemove = (item: DNCEntry) => {
  setItemToRemove(item)
  setIsRemoveConfirmOpen(true)
}

const confirmRemove = async () => {
  if (!itemToRemove) return

  setIsSubmittingRemove(true)
  try {
    const endpoint = itemToRemove.type === 'company' 
      ? `/api/companies/${itemToRemove.id}/dnc` 
      : `/api/contacts/${itemToRemove.id}/dnc`
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_dnc: false,
        dnc_reason: null
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to remove from DNC list')
    }

    // Update local state instead of refetching
    setDncList(prev => prev.filter(item => item.id !== itemToRemove.id))
    
    // Close dialog
    setIsRemoveConfirmOpen(false)
    setItemToRemove(null)
  } catch (error) {
    console.error('Error removing from DNC list:', error)
    alert('Failed to remove from DNC list. Please try again.')
  } finally {
    setIsSubmittingRemove(false)
  }
}
```

#### Step 3: Update handleRemove call (line 193)
Change from:
```tsx
onClick={() => handleRemove(item.id, item.value, item.type)}
```
To:
```tsx
onClick={() => handleRemove(item)}
```

#### Step 4: Add Remove Confirmation Dialog (before final `</div>`, after line 296)
```tsx
{/* Remove Confirmation Dialog */}
<Dialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-red-600" />
        Remove from DNC List
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to remove <strong>{itemToRemove?.value}</strong> from the Do Not Contact list?
        This will allow outreach to this {itemToRemove?.type} again.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => {
          setIsRemoveConfirmOpen(false)
          setItemToRemove(null)
        }}
        disabled={isSubmittingRemove}
      >
        Cancel
      </Button>
      <Button 
        variant="destructive"
        onClick={confirmRemove}
        className="bg-red-600 hover:bg-red-700"
        disabled={isSubmittingRemove}
      >
        {isSubmittingRemove ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Removing...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Remove from DNC
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Testing

After making these changes:
1. Mark a company as DNC - you should see a loading spinner on the button
2. The page should NOT reload - the DNC badge should appear immediately
3. Go to DNC tab - the company should appear there
4. Click remove - you should see a loading spinner
5. The item should disappear from the list without page reload

## Benefits

✅ No page reloads - instant feedback
✅ Loading states on buttons - better UX
✅ Optimistic UI updates - feels faster
✅ Proper error handling
✅ Disabled inputs during submission
