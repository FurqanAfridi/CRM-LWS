# DNC Bulk Upload Feature

## Overview
The DNC (Do Not Contact) bulk upload feature allows you to upload CSV files containing multiple companies or contacts to add to the DNC list in one operation.

## Features
- ✅ CSV file upload via drag-and-drop or file picker
- ✅ Column header mapping interface
- ✅ Auto-detection of common column names (domain, email, reason)
- ✅ Live preview of uploaded data
- ✅ Support for both company domains and contact emails
- ✅ Optional reason column for each entry
- ✅ Batch processing with success/failure reporting

## How to Use

### 1. Navigate to DNC Page
Go to the DNC List page in your dashboard.

### 2. Open Bulk Upload Dialog
Click the "Add to DNC" button, then switch to the "Bulk Upload" tab.

### 3. Upload Your CSV File
- Click the upload area or drag and drop your CSV file
- Only CSV files are currently supported
- File should contain at least a header row and one data row

### 4. Map Your Columns
After uploading, you'll see a column mapping interface:
- **Upload Type**: Choose whether you're uploading company domains or contact emails
- **Domain/Email Column**: Select which column contains the domains or emails (required)
- **Reason Column**: Optionally select which column contains the reason for DNC status
- The preview table will highlight selected columns (blue for domain/email, green for reason)

### 5. Process the List
Click "Process List" to submit your bulk upload. You'll see:
- Success count for entries added to DNC
- Failure count for entries that couldn't be processed
- Detailed results in the console

## CSV File Format

### For Companies (Domains)
```csv
Domain,Reason,Company Name
example.com,Requested removal,Example Corp
badcompany.net,Spam complaints,Bad Company Inc
testdomain.org,Legal issues,Test Domain LLC
```

### For Contacts (Emails)
```csv
Email,Reason,Name
john.doe@example.com,Unsubscribed,John Doe
jane.smith@badcompany.net,Spam report,Jane Smith
contact@testdomain.org,Requested removal,Test Contact
```

## Sample Files
Two sample CSV files are included in the frontend directory:
- `sample-dnc-companies.csv` - Example for company domains
- `sample-dnc-contacts.csv` - Example for contact emails

## Technical Details

### API Endpoint
- **URL**: `/api/dnc/bulk-upload`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file`: The CSV file
  - `type`: 'company' or 'contact'
  - `valueColumn`: Index of the column containing domains/emails
  - `reasonColumn`: (Optional) Index of the column containing reasons

### Response Format
```json
{
  "success": true,
  "results": {
    "success": ["example.com (2 companies)", "..."],
    "failed": [
      { "value": "notfound.com", "reason": "No matching companies found" }
    ],
    "total": 10
  }
}
```

### Processing Logic
1. File is parsed on the frontend to extract headers and preview data
2. User maps columns to required fields
3. File is sent to backend with column mappings
4. Backend processes each row:
   - For companies: Searches by domain in website field
   - For contacts: Searches by exact email match
   - Updates matching records with `is_dnc=true` and `dnc_reason`
5. Returns success/failure counts

## Limitations
- Currently only supports CSV files (Excel support coming soon)
- Maximum file size: 10MB (configurable)
- Processes synchronously (may timeout for very large files)
- Requires exact domain/email matches in database

## Future Enhancements
- [ ] Excel (.xlsx, .xls) file support
- [ ] Asynchronous processing for large files
- [ ] Progress indicator during processing
- [ ] Download failed entries as CSV
- [ ] Fuzzy matching for domains
- [ ] Bulk removal from DNC list
- [ ] Template download feature
