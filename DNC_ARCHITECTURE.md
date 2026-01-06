# DNC System Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Add Single   │ │ Bulk Upload  │ │   Remove     │
        │    Entry     │ │     CSV      │ │    Entry     │
        └──────────────┘ └──────────────┘ └──────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                    ┌───────────────────────┐
                    │   API ENDPOINTS       │
                    │                       │
                    │ POST /api/dnc/add     │
                    │ POST /bulk-upload     │
                    │ DELETE /api/dnc/[id]  │
                    │ GET /api/dnc          │
                    └───────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
    │   dnc_list       │ │  companies   │ │   contacts   │
    │   (PRIMARY)      │ │  (OPTIONAL)  │ │  (OPTIONAL)  │
    │                  │ │              │ │              │
    │ ✅ ALWAYS        │ │ ✅ IF EXISTS │ │ ✅ IF EXISTS │
    │    STORED        │ │    UPDATED   │ │    UPDATED   │
    └──────────────────┘ └──────────────┘ └──────────────┘
```

## Before vs After

### BEFORE (❌ Problem)
```
User uploads: example.com
         │
         ▼
Search companies table
         │
         ├─ Found? → Update is_dnc ✅ → Shows in DNC list
         │
         └─ Not found? → ❌ NOTHING HAPPENS → NOT in DNC list
```

### AFTER (✅ Solution)
```
User uploads: example.com
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
Insert into dnc_list ✅          Search companies table
(ALWAYS SUCCEEDS)                        │
         │                               ├─ Found? → Update is_dnc ✅
         │                               │
         │                               └─ Not found? → Skip (OK)
         │
         └─────────────────────────────────┐
                                           │
                                           ▼
                              Shows in DNC list ✅
```

## Table Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         dnc_list                             │
│  (Source of Truth for DNC List Display)                     │
├─────────────────────────────────────────────────────────────┤
│ id          │ type     │ value              │ reason         │
├─────────────────────────────────────────────────────────────┤
│ uuid-1      │ company  │ example.com        │ Competitor     │
│ uuid-2      │ contact  │ john@test.com      │ Requested      │
│ uuid-3      │ company  │ nonexistent.com    │ Manual add     │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ (Lookup for matching records)
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  companies   │        │   contacts   │
│              │        │              │
│ is_dnc ✅    │        │ is_dnc ✅    │
│ dnc_reason   │        │ dnc_reason   │
│ dnc_date     │        │ dnc_date     │
└──────────────┘        └──────────────┘
```

## Add Entry Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters: "example.com" with reason "Competitor"      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Normalize value:                                          │
│    - Remove https://                                         │
│    - Remove www.                                             │
│    - Result: "example.com"                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. INSERT into dnc_list                                      │
│    type: 'company'                                           │
│    value: 'example.com'                                      │
│    reason: 'Competitor'                                      │
│    ✅ ALWAYS SUCCEEDS (or updates if exists)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Search companies WHERE website LIKE '%example.com%'      │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ Found 3      │        │ Found 0      │
        │ companies    │        │ companies    │
        └──────────────┘        └──────────────┘
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ UPDATE all 3 │        │ Skip update  │
        │ set is_dnc   │        │ (no problem) │
        └──────────────┘        └──────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Return success message:                                   │
│    - If companies found: "Added 3 companies to DNC"         │
│    - If not found: "Added to DNC list (no matches)"         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend refreshes DNC list                              │
│    ✅ Entry is ALWAYS visible                               │
└─────────────────────────────────────────────────────────────┘
```

## Bulk Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User uploads CSV with 100 domains                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Parse CSV → Extract domains from selected column            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH domain in CSV:                                      │
│                                                              │
│   1. INSERT into dnc_list ✅                                │
│   2. Search for matching companies                          │
│   3. UPDATE if found (optional)                             │
│   4. Add to success list                                    │
│                                                              │
│ ✅ ALL 100 entries added to dnc_list                        │
│ ✅ 45 had matching companies (updated)                      │
│ ✅ 55 had no matches (still in dnc_list)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Return results:                                              │
│   success: [                                                 │
│     "example1.com (3 companies updated)",                   │
│     "example2.com (added to DNC list)",                     │
│     ...                                                      │
│   ]                                                          │
│   failed: [] (empty - all succeeded)                        │
└─────────────────────────────────────────────────────────────┘
```

## Remove Entry Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks remove on "example.com"                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. DELETE FROM dnc_list WHERE id = 'uuid-1'                 │
│    ✅ Entry removed from DNC list                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Search for matching companies                            │
│    WHERE website LIKE '%example.com%'                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. UPDATE companies                                          │
│    SET is_dnc = false, dnc_reason = null                    │
│    (if any found)                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return success                                            │
│    Frontend removes from display                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

### ✅ Complete Visibility
- ALL uploaded entries are visible in DNC list
- No data loss
- No "not found" errors

### ✅ Dual System
- `dnc_list` = Source of truth for DNC list display
- `companies.is_dnc` = Quick flag for individual company checks
- Both stay in sync when possible

### ✅ Future-Proof
- New companies added later can be checked against dnc_list
- Can implement background job to auto-flag new companies
- Maintains comprehensive DNC database

### ✅ Better UX
- Clear success messages
- No confusing failures
- Users know exactly what happened

## Database Indexes

```sql
-- For fast lookups
CREATE INDEX idx_dnc_list_type ON dnc_list(type);
CREATE INDEX idx_dnc_list_value ON dnc_list(value);
CREATE INDEX idx_dnc_list_created_at ON dnc_list(created_at DESC);

-- Unique constraint prevents duplicates
UNIQUE(type, value)
```

## Query Examples

### Get all DNC companies
```sql
SELECT * FROM dnc_list WHERE type = 'company';
```

### Check if domain is in DNC
```sql
SELECT EXISTS (
  SELECT 1 FROM dnc_list 
  WHERE type = 'company' 
  AND value = 'example.com'
);
```

### Get DNC entries with matching companies
```sql
SELECT 
  d.*,
  COUNT(c.id) as matching_companies
FROM dnc_list d
LEFT JOIN companies c ON c.website LIKE '%' || d.value || '%'
WHERE d.type = 'company'
GROUP BY d.id;
```
