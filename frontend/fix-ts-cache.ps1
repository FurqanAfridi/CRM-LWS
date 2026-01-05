#!/usr/bin/env pwsh
# Script to fix TypeScript cache issues

Write-Host "Fixing TypeScript cache issues..." -ForegroundColor Cyan

# Remove TypeScript build info
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item "tsconfig.tsbuildinfo" -Force
    Write-Host "✓ Removed tsconfig.tsbuildinfo" -ForegroundColor Green
}

# Remove .next cache
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
    Write-Host "✓ Removed .next cache" -ForegroundColor Green
}

# Remove node_modules/.cache if it exists
if (Test-Path "node_modules/.cache") {
    Remove-Item "node_modules/.cache" -Recurse -Force
    Write-Host "✓ Removed node_modules/.cache" -ForegroundColor Green
}

Write-Host "`nCache cleared successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. In VS Code, press Ctrl+Shift+P" -ForegroundColor White
Write-Host "2. Type 'TypeScript: Restart TS Server' and press Enter" -ForegroundColor White
Write-Host "3. The error should disappear" -ForegroundColor White
