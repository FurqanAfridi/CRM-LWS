# Professional PDF Generation Instructions

## Quick Start - Easiest Method

### For Windows Users:

1. **Install Pandoc**:
   - Download from: https://github.com/jgm/pandoc/releases/latest
   - Install the .msi file
   - Restart your computer

2. **Install MiKTeX** (for PDF generation):
   - Download from: https://miktex.org/download
   - Install with default settings

3. **Open PowerShell** in the project folder

4. **Run this command**:
   ```powershell
   pandoc CRM-LWS-Complete-Documentation.md -o "CRM-LWS-Complete-Documentation.pdf" --pdf-engine=xelatex -V geometry:margin=1in -V fontsize=11pt -V colorlinks=true -V linkcolor=blue
   ```

5. **Your PDF will be created!**

---

### For Mac Users:

1. **Install Homebrew** (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Pandoc and LaTeX**:
   ```bash
   brew install pandoc
   brew install --cask mactex
   ```

3. **Navigate to project folder** in Terminal

4. **Run this command**:
   ```bash
   pandoc CRM-LWS-Complete-Documentation.md -o "CRM-LWS-Complete-Documentation.pdf" --pdf-engine=xelatex -V geometry:margin=1in -V fontsize=11pt -V colorlinks=true -V linkcolor=blue
   ```

5. **Your PDF will be created!**

---

## Alternative: Use Online Converter (No Installation)

1. Go to: https://www.markdowntopdf.com/
2. Click "Choose File"
3. Select `CRM-LWS-Complete-Documentation.md`
4. Click "Convert"
5. Download the PDF

**Note**: Online converters may not preserve all formatting perfectly.

---

## Diagram Rendering in PDF

**Important**: The documentation includes Mermaid diagrams that need special handling for PDF conversion.

### Option 1: Use Mermaid Support (Recommended)

For best results with diagrams, use Pandoc with Mermaid filter:

1. **Install Mermaid CLI**:
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. **Install Pandoc Mermaid Filter**:
   ```bash
   pip install pandoc-mermaid-filter
   ```

3. **Convert with Mermaid Support**:
   ```bash
   pandoc CRM-LWS-Complete-Documentation.md \
     -o CRM-LWS-Complete-Documentation.pdf \
     --filter pandoc-mermaid \
     --pdf-engine=xelatex \
     -V geometry:margin=1in \
     -V fontsize=11pt
   ```

### Option 2: Render Diagrams Separately

If Mermaid filter doesn't work:

1. Use online Mermaid editor: https://mermaid.live/
2. Copy each diagram code
3. Export as PNG/SVG
4. Insert images into document
5. Convert to PDF

### Option 3: Use Markdown PDF Extension (VS Code)

The "Markdown PDF" extension in VS Code can render Mermaid diagrams:
1. Install extension
2. Open markdown file
3. Right-click → "Markdown PDF: Export (pdf)"
4. Diagrams will be rendered automatically

## Professional Styling Options

### Option 1: Simple Professional (Recommended)

```bash
pandoc CRM-LWS-Complete-Documentation.md \
  -o CRM-LWS-Complete-Documentation.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  -V toccolor=gray
```

### Option 2: With Custom Fonts

```bash
pandoc CRM-LWS-Complete-Documentation.md \
  -o CRM-LWS-Complete-Documentation.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V mainfont="Arial" \
  -V sansfont="Arial" \
  -V colorlinks=true \
  -V linkcolor=blue
```

### Option 3: With Table of Contents

```bash
pandoc CRM-LWS-Complete-Documentation.md \
  -o CRM-LWS-Complete-Documentation.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  --toc \
  --toc-depth=3 \
  -V colorlinks=true \
  -V linkcolor=blue
```

---

## Troubleshooting

### "Pandoc not found" Error

**Solution**: Make sure Pandoc is installed and added to your PATH
- Windows: Restart after installation
- Mac/Linux: Check with `which pandoc`

### "xelatex not found" Error

**Solution**: Install LaTeX distribution
- Windows: Install MiKTeX
- Mac: `brew install --cask mactex`
- Linux: `sudo apt-get install texlive-xetex`

### PDF Looks Unprofessional

**Solutions**:
1. Use the styling options above
2. Install a Pandoc template (like eisvogel)
3. Use HTML conversion method instead

### Font Issues

**Solution**: Specify fonts explicitly:
```bash
-V mainfont="Times New Roman" \
-V sansfont="Arial"
```

---

## Best Practices for Professional PDFs

1. **Always include table of contents** for long documents
2. **Use consistent formatting** throughout
3. **Add page numbers** (automatic with Pandoc)
4. **Use proper margins** (1 inch recommended)
5. **Test print** before sharing
6. **Keep file size reasonable** (under 10MB)

---

## Need Help?

If you encounter issues:
1. Check Pandoc documentation: https://pandoc.org/MANUAL.html
2. Verify all dependencies are installed
3. Try the online converter as backup
4. Contact your system administrator

---

**Happy PDF Generating! 📄✨**
