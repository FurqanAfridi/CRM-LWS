# DNC Bulk Upload Fix

## Problem Report
The DNC bulk upload feature was not working in both the Companies tab and the DNC tab. Users could not:
1. Click to select a file (file input was hidden with no trigger)
2. Drag and drop files (no drag-and-drop handlers implemented)
3. See which file was selected
4. Process the uploaded file

## Issues Found

### 1. Companies Page (`frontend/app/dashboard/companies/page.tsx`)
- **Line 706**: File input was hidden (`className="hidden"`) but had no way to trigger it
- **No ref**: No reference to the file input element to programmatically trigger it
- **No handlers**: Missing `onChange`, `onDragOver`, `onDragLeave`, and `onDrop` handlers
- **No state**: No state to track uploaded file or drag status
- **No visual feedback**: No indication when a file was selected or being dragged

### 2. DNC Page (`frontend/app/dashboard/dnc/page.tsx`)
- **Line 284**: Same issues as Companies page
- File input was completely non-functional
- No drag-and-drop support
- No file state management

## Solutions Implemented

### 1. Added State Management
Both pages now have:
```typescript
const fileInputRef = useRef<HTMLInputElement>(null)
const [isDragging, setIsDragging] = useState(false)
const [uploadedFile, setUploadedFile] = useState<File | null>(null)
```

### 2. Implemented File Selection Handler
```typescript
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    setUploadedFile(file)
  }
}
```

### 3. Implemented Drag-and-Drop Handlers
```typescript
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragging(true)
}

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragging(false)
}

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragging(false)
  
  const file = e.dataTransfer.files?.[0]
  if (file) {
    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setUploadedFile(file)
    } else {
      alert('Please upload a CSV or Excel file')
    }
  }
}
```

### 4. Implemented File Processing Handler
```typescript
const handleBulkUpload = async () => {
  if (!uploadedFile) {
    alert('Please select a file to upload')
    return
  }

  // For now, show a simulation message
  // In a real implementation, you would:
  // 1. Parse the CSV/Excel file
  // 2. Send the data to an API endpoint
  // 3. Process the bulk upload on the backend
  alert(`File "${uploadedFile.name}" would be processed here. This feature requires backend implementation.`)
  setUploadedFile(null)
  setIsAddDialogOpen(false)
}
```

### 5. Updated UI with Interactive Elements
The upload area now:
- **Responds to clicks**: Triggers file selection dialog
- **Responds to drag-and-drop**: Visual feedback when dragging files
- **Shows file info**: Displays selected file name and size
- **Provides visual feedback**: 
  - Gray border when idle
  - Blue border when dragging
  - Green border when file is selected
- **Validates file types**: Only accepts CSV, XLS, and XLSX files
- **Has proper accept attribute**: `accept=".csv,.xls,.xlsx"`

### 6. Enhanced Dialog Footer
The dialog footer now:
- Clears uploaded file when canceled
- Shows different button text based on whether a file is uploaded
- Calls the appropriate handler (bulk upload vs manual add)

## Features Now Working

### ✅ Click to Upload
- Users can click anywhere on the upload area
- File selection dialog opens
- Selected file is displayed with name and size

### ✅ Drag and Drop
- Users can drag files from their file explorer
- Visual feedback shows when dragging over the upload area
- Files are validated and rejected if not CSV/Excel format

### ✅ Visual Feedback
- **Idle state**: Gray dashed border
- **Dragging**: Blue border with light blue background
- **File selected**: Green border with green background, showing file details
- **File info**: Shows filename and size in KB

### ✅ File Validation
- Only accepts CSV, XLS, and XLSX files
- Shows error message for invalid file types
- Validates both by MIME type and file extension

## Testing Instructions

### Test 1: Click to Upload (Companies Page)
1. Go to `/dashboard/companies`
2. Click "DNC List" button
3. In the dialog, click anywhere on the upload area
4. File selection dialog should open
5. Select a CSV or Excel file
6. File name and size should appear in green

### Test 2: Drag and Drop (Companies Page)
1. Go to `/dashboard/companies`
2. Click "DNC List" button
3. Drag a CSV file from your file explorer
4. Hover over the upload area
5. Border should turn blue
6. Drop the file
7. File name and size should appear in green

### Test 3: Click to Upload (DNC Page)
1. Go to `/dashboard/dnc`
2. Click "Add to DNC" button
3. Click "Bulk Upload" tab
4. Click anywhere on the upload area
5. File selection dialog should open
6. Select a CSV or Excel file
7. File name and size should appear in green

### Test 4: Drag and Drop (DNC Page)
1. Go to `/dashboard/dnc`
2. Click "Add to DNC" button
3. Click "Bulk Upload" tab
4. Drag a CSV file from your file explorer
5. Hover over the upload area
6. Border should turn blue
7. Drop the file
8. File name and size should appear in green

### Test 5: File Validation
1. Try uploading a non-CSV/Excel file (e.g., .txt, .pdf)
2. Should see error: "Please upload a CSV or Excel file"

### Test 6: Process File
1. Upload a valid CSV file
2. Click "Process File" button
3. Should see message: "File '[filename]' would be processed here..."

## Next Steps (Backend Implementation Required)

The frontend is now fully functional, but the actual file processing needs backend implementation:

1. **Create API endpoint** for bulk DNC upload (e.g., `/api/dnc/bulk-upload`)
2. **Parse CSV/Excel files** on the backend using a library like `csv-parser` or `xlsx`
3. **Validate data** in the uploaded file
4. **Process entries** and add them to the DNC list in the database
5. **Return results** showing how many entries were added, skipped, or failed
6. **Update frontend** to call the real API endpoint instead of showing simulation message

### Suggested CSV Format
```csv
type,value,reason
company,example.com,Competitor
contact,john@example.com,Requested removal
company,acme.com,Out of business
```

### Suggested API Response
```json
{
  "success": true,
  "processed": 100,
  "added": 95,
  "skipped": 3,
  "failed": 2,
  "errors": [
    { "row": 5, "error": "Invalid email format" },
    { "row": 12, "error": "Duplicate entry" }
  ]
}
```

## Files Modified
1. `frontend/app/dashboard/companies/page.tsx`
2. `frontend/app/dashboard/dnc/page.tsx`

## Summary
The DNC bulk upload feature is now fully functional on the frontend. Users can:
- ✅ Click to select files
- ✅ Drag and drop files
- ✅ See visual feedback during interaction
- ✅ View selected file information
- ✅ Have files validated before processing

The only remaining work is backend implementation to actually parse and process the uploaded files.
