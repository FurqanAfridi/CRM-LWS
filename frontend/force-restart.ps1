# Force Restart Script for Next.js Environment Variables
# This script will kill all Node processes, clear cache, and restart

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Restart Next.js Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Killing process: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  ✓ All Node processes stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ No Node processes running" -ForegroundColor Gray
}

# Step 2: Clear Next.js cache
Write-Host ""
Write-Host "Step 2: Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    if (Test-Path .next) {
        Write-Host "  ⚠ Warning: .next folder still exists (may be locked)" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Cache cleared" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ No cache to clear" -ForegroundColor Gray
}

# Step 3: Verify .env.local
Write-Host ""
Write-Host "Step 3: Verifying .env.local file..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    $content = Get-Content .env.local -Raw
    $hasUrl = $content -match 'NEXT_PUBLIC_SUPABASE_URL\s*=\s*[^\r\n]+'
    $hasKey = $content -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*[^\r\n]+'
    
    if ($hasUrl -and $hasKey) {
        Write-Host "  ✓ .env.local file exists and has required variables" -ForegroundColor Green
    } else {
        Write-Host "  ✗ .env.local file is missing required variables!" -ForegroundColor Red
        Write-Host "     Make sure it has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✗ .env.local file not found!" -ForegroundColor Red
    Write-Host "     Create it in the frontend directory with your Supabase credentials" -ForegroundColor Red
    exit 1
}

# Step 4: Check for BOM
Write-Host ""
Write-Host "Step 4: Checking file encoding..." -ForegroundColor Yellow
$bytes = [System.IO.File]::ReadAllBytes('.env.local')
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "  ⚠ File has UTF-8 BOM - removing it..." -ForegroundColor Yellow
    $content = [System.IO.File]::ReadAllText('.env.local', [System.Text.Encoding]::UTF8)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText('.env.local', $content, $utf8NoBom)
    Write-Host "  ✓ BOM removed" -ForegroundColor Green
} else {
    Write-Host "  ✓ File encoding is correct (no BOM)" -ForegroundColor Green
}

# Step 5: Restart server
Write-Host ""
Write-Host "Step 5: Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: After the server starts:" -ForegroundColor Cyan
Write-Host "   1. Wait for 'Ready' message" -ForegroundColor Cyan
Write-Host "   2. Go to http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   3. Press Ctrl+Shift+R to hard refresh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server now..." -ForegroundColor Green
Write-Host ""

npm run dev


