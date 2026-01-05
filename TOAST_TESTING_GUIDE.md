# Toast Testing Guide

## Quick Test

To test if toasts are working:

1. **Go to the DNC page**
   - Navigate to: `/dashboard/dnc`
   - Click "Add to DNC" button
   - Leave the value field empty
   - Click "Add Entry"
   - **Expected**: You should see a red error toast in the top-right corner saying "Please enter a domain or email"

2. **Go to Companies page**
   - Navigate to: `/dashboard/companies`
   - Click "DNC List" button
   - Leave the manual input field empty
   - Click "Process List"
   - **Expected**: You should see a red error toast saying "Please enter a domain or email"

3. **Create a new company**
   - Navigate to: `/dashboard/companies/new`
   - Fill in the company name: "Test Company"
   - Click "Create Company"
   - **Expected**: You should see a green success toast saying "Company created successfully!"

## Toast Types

### Success (Green)
- Company created
- Entry added to DNC
- Operations completed successfully

### Error (Red)
- Validation errors
- API failures
- Missing required fields

### Info (Blue)
- File upload ready for processing
- Informational messages

## Troubleshooting

If toasts are not showing:

1. **Check browser console** for errors
2. **Verify Toaster is in dashboard layout**:
   - File: `frontend/app/dashboard/layout.tsx`
   - Should have `<Toaster />` component
3. **Verify sonner is installed**:
   - Run: `npm list sonner`
   - Should show: `sonner@1.x.x`
4. **Clear browser cache** and hard reload (Ctrl+Shift+R)
5. **Check if dev server restarted** after changes

## Common Issues

### Issue: Toasts not appearing
**Solution**: Make sure you're on a dashboard page (not login page). Toaster is only in dashboard layout.

### Issue: Multiple toasts stacking incorrectly
**Solution**: This is normal behavior - toasts stack vertically in top-right corner.

### Issue: Toast dismissed too quickly
**Solution**: Default duration is ~4 seconds. You can customize this in the toast call:
```typescript
toast.success('Message', { duration: 5000 }) // 5 seconds
```

## Manual Testing Checklist

- [ ] Error toast shows when validation fails
- [ ] Success toast shows when operation succeeds
- [ ] Info toast shows for informational messages
- [ ] Toasts appear in top-right corner
- [ ] Toasts auto-dismiss after ~4 seconds
- [ ] Multiple toasts stack correctly
- [ ] Toasts can be manually dismissed (click X)
- [ ] Toast colors match message type (green/red/blue)
- [ ] Toast text is readable and clear

## Where Toasts Are Used

### DNC Page
- Error: Empty value validation
- Error: File type validation
- Error: API failures
- Success: Entry added to DNC
- Info: File ready for processing

### Companies Page
- Error: File type validation
- Error: Empty file selection
- Error: DNC update failures
- Success: Manual DNC entry added
- Info: File ready for processing

### New Company Page
- Error: Company name required
- Error: API failure
- Success: Company created

## Next Steps

If toasts are still not working after following this guide:
1. Check the browser's Network tab for API errors
2. Check the browser's Console tab for JavaScript errors
3. Verify the Toaster component is rendering (inspect HTML)
4. Try a different browser
5. Clear all browser data and try again
