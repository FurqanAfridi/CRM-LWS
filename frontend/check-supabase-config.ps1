# Quick script to check Supabase configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase Configuration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check .env.local file
Write-Host "1. Checking .env.local file..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   ✓ File exists" -ForegroundColor Green
    
    $content = Get-Content .env.local -Raw
    $urlMatch = [regex]::Match($content, 'NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\r\n]+)')
    $keyMatch = [regex]::Match($content, 'NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\r\n]+)')
    
    if ($urlMatch.Success) {
        $url = $urlMatch.Groups[1].Value.Trim()
        Write-Host "   ✓ URL found: $($url.Substring(0, [Math]::Min(50, $url.Length)))..." -ForegroundColor Green
        if ($url -match 'placeholder') {
            Write-Host "   ✗ WARNING: URL contains 'placeholder'!" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ URL not found!" -ForegroundColor Red
    }
    
    if ($keyMatch.Success) {
        $key = $keyMatch.Groups[1].Value.Trim()
        Write-Host "   ✓ Key found: $($key.Substring(0, [Math]::Min(30, $key.Length)))..." -ForegroundColor Green
        if ($key -match 'placeholder') {
            Write-Host "   ✗ WARNING: Key contains 'placeholder'!" -ForegroundColor Red
        }
        if (-not $key.StartsWith('eyJ')) {
            Write-Host "   ✗ WARNING: Key doesn't start with 'eyJ' (invalid format)!" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ Key not found!" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ File does NOT exist!" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Checking .next cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Write-Host "   ⚠️  .next cache exists" -ForegroundColor Yellow
    Write-Host "      If env vars were added after server start, cache needs clearing" -ForegroundColor Gray
} else {
    Write-Host "   ✓ No cache (or already cleared)" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Stop dev server (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Clear cache: Remove-Item -Recurse -Force .next" -ForegroundColor White
Write-Host "   3. Restart: npm run dev" -ForegroundColor White
Write-Host "   4. Hard refresh browser: Ctrl+Shift+R" -ForegroundColor White
Write-Host ""
Write-Host "4. After restart, check browser console for:" -ForegroundColor Cyan
Write-Host "   - Look for '🔍 Supabase Client Configuration' log" -ForegroundColor White
Write-Host "   - Should show your actual Supabase URL (not placeholder)" -ForegroundColor White
Write-Host ""

