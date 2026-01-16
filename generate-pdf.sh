#!/bin/bash

# Bash Script to Generate Professional PDF Documentation
# For Mac and Linux Users

echo "========================================"
echo "CRM-LWS PDF Documentation Generator"
echo "========================================"
echo ""

# Check if Pandoc is installed
if command -v pandoc &> /dev/null; then
    echo "[✓] Pandoc found"
else
    echo "[✗] Pandoc not found!"
    echo ""
    echo "Please install Pandoc first:"
    echo "  Mac:    brew install pandoc"
    echo "  Linux:  sudo apt-get install pandoc"
    echo "  Or download from: https://pandoc.org/installing.html"
    echo ""
    read -p "Press Enter to exit"
    exit 1
fi

# Check if input file exists
if [ ! -f "CRM-LWS-Complete-Documentation.md" ]; then
    echo "[✗] Documentation file not found!"
    echo "Looking for: CRM-LWS-Complete-Documentation.md"
    echo ""
    read -p "Press Enter to exit"
    exit 1
fi

echo "[✓] Documentation file found"
echo ""
echo "Generating PDF..."
echo "This may take a minute..."
echo ""

# Generate PDF with professional styling
pandoc CRM-LWS-Complete-Documentation.md \
    -o "CRM-LWS-Complete-Documentation.pdf" \
    --pdf-engine=xelatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    -V colorlinks=true \
    -V linkcolor=blue \
    -V urlcolor=blue \
    -V toccolor=gray \
    --toc \
    --toc-depth=3

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "[✓] PDF Generated Successfully!"
    echo "========================================"
    echo ""
    echo "Output file: CRM-LWS-Complete-Documentation.pdf"
    echo ""
    
    # Check if file was created and show size
    if [ -f "CRM-LWS-Complete-Documentation.pdf" ]; then
        fileSize=$(du -h "CRM-LWS-Complete-Documentation.pdf" | cut -f1)
        echo "File size: $fileSize"
        echo ""
        read -p "Would you like to open the PDF now? (y/n) " response
        if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # Mac
                open "CRM-LWS-Complete-Documentation.pdf"
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                xdg-open "CRM-LWS-Complete-Documentation.pdf" 2>/dev/null || \
                gnome-open "CRM-LWS-Complete-Documentation.pdf" 2>/dev/null || \
                echo "Please open the PDF manually"
            fi
        fi
    fi
else
    echo ""
    echo "[✗] PDF generation failed!"
    echo ""
    echo "Common issues:"
    echo "1. LaTeX not installed"
    echo "   Mac:    brew install --cask mactex"
    echo "   Linux:  sudo apt-get install texlive-xetex"
    echo "2. Missing fonts"
    echo "3. Pandoc version too old"
    echo ""
fi

echo ""
read -p "Press Enter to exit"
