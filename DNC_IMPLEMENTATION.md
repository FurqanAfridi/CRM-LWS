# DNC (Do Not Contact) Feature Implementation

## Overview
This implementation adds full DNC (Do Not Contact) functionality to the CRM system, allowing users to mark companies and contacts as DNC and view them in a dedicated DNC tab.

## Changes Made

### 1. Database Schema Updates
**File:** `database/add-dnc-column.sql`

Added the following columns to both `companies` and `contacts` tables:
- `is_dnc` (BOOLEAN, default FALSE) - Indicates if the entity is on the DNC list
- `dnc_reason` (TEXT, nullable) - Reason for adding to DNC list
- `dnc_date` (TIMESTAMP, nullable) - Date when added to DNC list

Also created indexes for better query performance on DNC entries.

**Action Required:** Run this SQL file in your Supabase SQL Editor to apply the schema changes.

### 2. TypeScript Type Definitions
**File:** `frontend/lib/supabase/types.ts`

Updated both `companies` and `contacts` table types to include the new DNC fields in Row, Insert, and Update types.

### 3. API Endpoints

#### Companies DNC Endpoint
**File:** `frontend/app/api/companies/[id]/dnc/route.ts`
- PATCH endpoint to update DNC status for a company
- Sets/unsets `is_dnc`, `dnc_reason`, and `dnc_date`

#### Contacts DNC Endpoint
**File:** `frontend/app/api/contacts/[id]/dnc/route.ts`
- PATCH endpoint to update DNC status for a contact
- Sets/unsets `is_dnc`, `dnc_reason`, and `dnc_date`

#### DNC List Endpoint
**File:** `frontend/app/api/dnc/route.ts`
- GET endpoint to fetch all DNC entries (companies and contacts)
- Supports filtering by type (company, contact, or all)
- Returns formatted data for the DNC page

### 4. UI Updates

#### Companies Page
**File:** `frontend/app/dashboard/companies/page.tsx`

Changes:
- Updated `handleMarkDNC` function to make actual API calls
- Added confirmation dialog before marking/unmarking DNC
- Added prompt for DNC reason when marking as DNC
- Added DNC badge display in both grid and list views
- Badge shows next to company name with red styling
- Refreshes data after DNC status change

#### DNC Page
**File:** `frontend/app/dashboard/dnc/page.tsx`

Changes:
- Replaced mock data with real API calls to `/api/dnc`
- Added loading state with spinner
- Implemented `handleRemove` to actually remove items from DNC list
- Fetches fresh data on mount and after removals
- Shows proper error messages for failed operations

## Features

### 1. Mark Company/Contact as DNC
- From Companies page (grid or list view), click the "Mark as DNC" button
- Confirmation dialog appears
- User can optionally provide a reason
- DNC status is saved to database with timestamp

### 2. DNC Badge Display
- Companies marked as DNC show a red "DNC" badge
- Badge appears in:
  - Grid view (card header)
  - List view (next to company name)
  - All other places where company is displayed

### 3. DNC List Page
- Dedicated page at `/dashboard/dnc`
- Shows all companies and contacts marked as DNC
- Displays:
  - Type (Company or Contact)
  - Value (company name or contact email)
  - Reason for DNC
  - Date added
- Filter by type (All, Companies, Contacts)
- Search functionality
- Remove from DNC list functionality

### 4. Remove from DNC
- Click trash icon on DNC list page
- Confirmation dialog appears
- DNC status is removed from database
- List refreshes automatically

## Testing Steps

1. **Apply Database Migration**
   - Open Supabase SQL Editor
   - Run the SQL from `database/add-dnc-column.sql`
   - Verify columns are added to both tables

2. **Mark a Company as DNC**
   - Go to Companies tab
   - Find "Flynn Group" (or any company)
   - Click the three-dot menu → "Mark as DNC"
   - Confirm the action
   - Optionally enter a reason
   - Verify the DNC badge appears next to the company name

3. **View DNC List**
   - Navigate to DNC tab in sidebar
   - Verify "Flynn Group" appears in the list
   - Check that type, reason, and date are displayed correctly

4. **Remove from DNC**
   - In DNC tab, click the trash icon next to "Flynn Group"
   - Confirm removal
   - Verify the company is removed from the DNC list
   - Go back to Companies tab and verify DNC badge is gone

## Notes

- The DNC status is persisted in the database
- All changes are reflected immediately across all views
- The system uses confirmation dialogs to prevent accidental changes
- Error handling is in place for failed API calls
- Loading states provide user feedback during operations

## Future Enhancements

Potential improvements for future iterations:
1. Bulk DNC upload via CSV file
2. DNC reason dropdown with predefined options
3. Audit log for DNC changes
4. Email validation before allowing DNC marking
5. Integration with email sending to prevent sending to DNC contacts
6. Export DNC list to CSV
