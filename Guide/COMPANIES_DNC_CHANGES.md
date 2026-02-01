# Companies Page DNC Updates

## Changes needed:

1. Add import: `import { useQueryClient } from '@tanstack/react-query'`
2. Add `const queryClient = useQueryClient()` at start of component
3. Add state: `const [isDncConfirmOpen, setIsDncConfirmOpen] = useState(false)`
4. Add state: `const [isSubmittingDNC, setIsSubmittingDNC] = useState(false)`
5. Add state: `const [dncReasonInput, setDncReasonInput] = useState('')`
6. Add state: `const [companyToMarkDNC, setCompanyToMarkDNC] = useState<Company | null>(null)`

7. Replace handleMarkDNC function with dialog opener
8. Add confirmMarkDNC function with loading state and cache update
9. Add DNC confirmation dialog before closing `</div>`
10. Add Loader2 icon to button when submitting

The dialog should show:
- Loading spinner on button when isSubmittingDNC is true
- Disabled inputs when submitting
- Update cache instead of page reload
- Close dialog after success
