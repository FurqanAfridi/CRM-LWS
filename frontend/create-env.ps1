# PowerShell script to create .env.local file
# Run this script: .\create-env.ps1

$envFile = ".env.local"
$envExample = ".env.example"

Write-Host "Creating .env.local file..." -ForegroundColor Green

if (Test-Path $envFile) {
    Write-Host "⚠ .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Red
        exit
    }
}

# Get Supabase URL
Write-Host "`nEnter your Supabase credentials:" -ForegroundColor Cyan
Write-Host "You can find these in Supabase Dashboard > Settings > API" -ForegroundColor Gray
Write-Host ""

$supabaseUrl = Read-Host "Supabase Project URL (e.g., https://xxxxx.supabase.co)"
$supabaseKey = Read-Host "Supabase Anon Key (starts with eyJ...)"

# Create .env.local content
$content = @"
# Supabase Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl

# Supabase Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey
"@

# Write to file
$content | Out-File -FilePath $envFile -Encoding utf8 -NoNewline

Write-Host "`n✓ .env.local file created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host "2. Navigate to http://localhost:3000/login" -ForegroundColor White
Write-Host ""

