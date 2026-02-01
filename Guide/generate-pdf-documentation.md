# How to Generate PDF from Documentation

## Option 1: Using Markdown to PDF Tools (Recommended)

### Method A: Using Pandoc (Most Professional)

1. **Install Pandoc**:
   - Windows: Download from https://pandoc.org/installing.html
   - Mac: `brew install pandoc`
   - Linux: `sudo apt-get install pandoc`

2. **Install LaTeX** (for better PDF formatting):
   - Windows: Install MiKTeX from https://miktex.org/download
   - Mac: `brew install --cask mactex`
   - Linux: `sudo apt-get install texlive-full`

3. **Convert to PDF**:
   ```bash
   pandoc CRM-LWS-Complete-Documentation.md -o CRM-LWS-Documentation.pdf --pdf-engine=xelatex -V geometry:margin=1in -V fontsize=11pt -V documentclass=article
   ```

### Method B: Using VS Code Extension

1. Install "Markdown PDF" extension in VS Code
2. Open `CRM-LWS-Complete-Documentation.md`
3. Right-click → "Markdown PDF: Export (pdf)"
4. PDF will be generated in the same folder

### Method C: Using Online Converters

1. Go to https://www.markdowntopdf.com/
2. Upload `CRM-LWS-Complete-Documentation.md`
3. Click "Convert"
4. Download the PDF

## Option 2: Using Browser Print (Quick Method)

1. Open the markdown file in a markdown viewer (GitHub, VS Code preview, etc.)
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Select "Save as PDF" as destination
4. Adjust settings:
   - Layout: Portrait
   - Margins: Default
   - Scale: 100%
5. Click "Save"

## Option 3: Using HTML Conversion (Best Styling)

1. Convert markdown to HTML first:
   ```bash
   pandoc CRM-LWS-Complete-Documentation.md -o documentation.html --standalone --css=styles.css
   ```

2. Open HTML in browser
3. Print to PDF with custom settings

## Recommended Settings for Professional PDF

- **Page Size**: Letter (8.5" x 11") or A4
- **Margins**: 1 inch (2.54 cm) on all sides
- **Font**: 11pt for body, 14pt for headings
- **Line Spacing**: 1.5
- **Page Numbers**: Bottom center
- **Headers/Footers**: Include document title and page numbers
- **Table of Contents**: Auto-generated with clickable links

## Adding Professional Styling

For best results, use Pandoc with a custom template:

```bash
pandoc CRM-LWS-Complete-Documentation.md \
  -o CRM-LWS-Documentation.pdf \
  --pdf-engine=xelatex \
  --template=eisvogel \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V mainfont="Calibri" \
  -V sansfont="Calibri" \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V toccolor=gray
```

## Quick Script for Windows (PowerShell)

Save this as `generate-pdf.ps1`:

```powershell
# Check if Pandoc is installed
if (Get-Command pandoc -ErrorAction SilentlyContinue) {
    Write-Host "Generating PDF..."
    pandoc CRM-LWS-Complete-Documentation.md `
        -o CRM-LWS-Documentation.pdf `
        --pdf-engine=xelatex `
        -V geometry:margin=1in `
        -V fontsize=11pt `
        -V documentclass=article `
        -V colorlinks=true
    Write-Host "PDF generated successfully!"
} else {
    Write-Host "Pandoc not found. Please install Pandoc first."
    Write-Host "Download from: https://pandoc.org/installing.html"
}
```

Run with: `.\generate-pdf.ps1`

## Quick Script for Mac/Linux (Bash)

Save this as `generate-pdf.sh`:

```bash
#!/bin/bash

if command -v pandoc &> /dev/null; then
    echo "Generating PDF..."
    pandoc CRM-LWS-Complete-Documentation.md \
        -o CRM-LWS-Documentation.pdf \
        --pdf-engine=xelatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        -V documentclass=article \
        -V colorlinks=true
    echo "PDF generated successfully!"
else
    echo "Pandoc not found. Please install Pandoc first."
    echo "Install with: brew install pandoc (Mac) or sudo apt-get install pandoc (Linux)"
fi
```

Make executable: `chmod +x generate-pdf.sh`  
Run with: `./generate-pdf.sh`
