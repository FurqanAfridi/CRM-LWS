# DNC Filtering - Complete Solution

## Overview

This document explains the complete DNC (Do Not Contact) filtering implementation across the CRM system.

## Problem Statement

**Original Issue**: When a company (e.g., Flynn Group) was marked as DNC:
- ✅ It appeared in the DNC tab (correct)
- ❌ Leads from that company still appeared in Qualified Leads tab (incorrect)
- ❌ Leads from that company still appeared in Outreach tab (incorrect)
- ❓ The company still appeared in Companies page search results (user preference)

## Solution Implemented

### 1. **Qualified Leads & Outreach Tabs** - AUTOMATIC FILTERING

**File**: `frontend/lib/supabase/queries/leads.ts`

**What it does**:
- Automatically filters out leads from DNC companies and contacts
- Uses database joins to check `is_dnc` status of associated companies/contacts
- No user action required - DNC leads are always hidden

**How it works**:
```typescript
// Joins with companies and contacts tables
.select(`
  *,
  companies!leads_company_id_fkey(is_dnc),
  contacts!leads_contact_id_fkey(is_dnc)
`)

// Filters out leads where company OR contact is DNC
const filteredData = (data || []).filter((lead: any) => {
  const companyIsDnc = lead.companies?.is_dnc === true
  const contactIsDnc = lead.contacts?.is_dnc === true
  return !companyIsDnc && !contactIsDnc
})
```

**Result**:
- ✅ Flynn Group leads NO LONGER appear in Qualified Leads
- ✅ Flynn Group leads NO LONGER appear in Outreach
- ✅ Removing from DNC automatically restores leads

---

### 2. **Companies Page** - OPTIONAL FILTERING

**Files Modified**:
- `frontend/app/api/companies/route.ts`
- `frontend/lib/supabase/queries/companies.ts`
- `frontend/app/dashboard/companies/page.tsx`

**What it does**:
- Adds an OPTIONAL toggle to hide/show DNC companies
- By default, DNC companies are VISIBLE (so you can manage them)
- Click "DNC Hidden" button to hide them from search results

**How it works**:

1. **API Layer** (`route.ts`):
```typescript
const exclude_dnc = searchParams.get('exclude_dnc')

if (exclude_dnc === 'true') {
  query = query.eq('is_dnc', false)
}
```

2. **Query Layer** (`queries/companies.ts`):
```typescript
export interface CompanyFilters {
  // ... other filters
  exclude_dnc?: boolean
}

if (filters?.exclude_dnc) params.append('exclude_dnc', 'true')
```

3. **UI Layer** (`page.tsx`):
```tsx
const [hideDncCompanies, setHideDncCompanies] = useState(false)

useCompanies({ 
  search: debouncedSearch, 
  exclude_dnc: hideDncCompanies 
})

// Toggle button
<Button onClick={() => setHideDncCompanies(!hideDncCompanies)}>
  {hideDncCompanies ? 'DNC Hidden' : 'Show All'}
</Button>
```

**Result**:
- ✅ By default: DNC companies are VISIBLE in Companies page
- ✅ Click "DNC Hidden": DNC companies are FILTERED OUT
- ✅ Click "Show All": DNC companies are VISIBLE again

---

## Why Different Behavior?

### Qualified Leads & Outreach
**Always hide DNC** - These are action-oriented tabs where you're actively reaching out. You should NEVER contact DNC entities, so they're automatically hidden.

### Companies Page
**Optional hide/show** - This is a management page where you need to:
- View all companies (including DNC ones)
- Mark/unmark companies as DNC
- See DNC status and reasons
- Manage your entire company database

---

## Testing Guide

### Test 1: Qualified Leads & Outreach (Automatic)
1. Go to Companies tab
2. Find Flynn Group
3. Mark as DNC with reason
4. Go to **Qualified Leads** → Flynn Group leads should NOT appear ✓
5. Go to **Outreach** → Flynn Group leads should NOT appear ✓
6. Go back to Companies, remove Flynn Group from DNC
7. Check Qualified Leads/Outreach → Flynn Group leads should reappear ✓

### Test 2: Companies Page (Optional)
1. Go to Companies tab
2. Search for "Flynn" → Flynn Group appears (even if DNC) ✓
3. Click **"DNC Hidden"** button
4. Search for "Flynn" → Flynn Group does NOT appear ✓
5. Click **"Show All"** button
6. Search for "Flynn" → Flynn Group appears again ✓

---

## User Guide

### To Hide DNC Companies from Search:
1. Go to **Companies** tab
2. Click the **"Show All"** button (it will change to **"DNC Hidden"**)
3. DNC companies are now filtered out from search results
4. Click **"DNC Hidden"** to show them again

### To Manage DNC List:
1. Go to **DNC** tab to see all DNC entries
2. Or go to **Companies** tab and ensure "Show All" is active
3. Mark/unmark companies as needed

---

## Files Changed

### Core DNC Filtering (Leads)
- ✅ `frontend/lib/supabase/queries/leads.ts`
- ✅ `frontend/app/dashboard/dnc/page.tsx` (description update)

### Optional DNC Filtering (Companies)
- ✅ `frontend/app/api/companies/route.ts`
- ✅ `frontend/lib/supabase/queries/companies.ts`
- ✅ `frontend/app/dashboard/companies/page.tsx`

---

## Summary

| Page | DNC Filtering | User Control |
|------|---------------|--------------|
| **Qualified Leads** | ✅ Always Hidden | ❌ No (automatic) |
| **Outreach** | ✅ Always Hidden | ❌ No (automatic) |
| **Companies** | ⚙️ Optional | ✅ Yes (toggle button) |
| **DNC Tab** | ✅ Shows DNC Only | N/A |

---

## Benefits

1. **Data Integrity**: Prevents accidental outreach to DNC entities
2. **Compliance**: Ensures DNC list is respected automatically
3. **Flexibility**: Companies page allows viewing/managing DNC entries
4. **User Control**: Toggle button for Companies page filtering
5. **Performance**: Efficient database joins with foreign keys

---

**Status**: ✅ Complete and Ready for Use
**Last Updated**: 2026-01-02
