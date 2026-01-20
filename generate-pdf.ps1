# PowerShell Script to Generate Professional PDF Documentation
# For Windows Users

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM-LWS PDF Documentation Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Pandoc is installed
if (Get-Command pandoc -ErrorAction SilentlyContinue) {
    Write-Host "[✓] Pandoc found" -ForegroundColor Green
} else {
    Write-Host "[✗] Pandoc not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Pandoc first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://github.com/jgm/pandoc/releases/latest" -ForegroundColor Yellow
    Write-Host "2. Install the .msi file" -ForegroundColor Yellow
    Write-Host "3. Restart your computer" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# Check if input file exists
if (-not (Test-Path "CRM-LWS-Complete-Documentation.md")) {
    Write-Host "[✗] Documentation file not found!" -ForegroundColor Red
    Write-Host "Looking for: CRM-LWS-Complete-Documentation.md" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "[✓] Documentation file found" -ForegroundColor Green
Write-Host ""
Write-Host "Generating PDF..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Gray
Write-Host ""

try {
    # Generate PDF with professional styling
    pandoc CRM-LWS-Complete-Documentation.md `
        -o "CRM-LWS-Complete-Documentation.pdf" `
        --pdf-engine=xelatex `
        -V geometry:margin=1in `
        -V fontsize=11pt `
        -V documentclass=article `
        -V colorlinks=true `
        -V linkcolor=blue `
        -V urlcolor=blue `
        -V toccolor=gray `
        --toc `
        --toc-depth=3 `
        2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "[✓] PDF Generated Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output file: CRM-LWS-Complete-Documentation.pdf" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if file was created
        if (Test-Path "CRM-LWS-Complete-Documentation.pdf") {
            $fileSize = (Get-Item "CRM-LWS-Complete-Documentation.pdf").Length / 1MB
            Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Would you like to open the PDF now? (Y/N)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq "Y" -or $response -eq "y") {
                Start-Process "CRM-LWS-Complete-Documentation.pdf"
            }
        }
    } else {
        Write-Host ""
        Write-Host "[✗] PDF generation failed!" -ForegroundColor Red
        Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "1. LaTeX not installed (install MiKTeX)" -ForegroundColor Yellow
        Write-Host "2. Missing fonts" -ForegroundColor Yellow
        Write-Host "3. Pandoc version too old" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "[✗] Error occurred: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to exit"
