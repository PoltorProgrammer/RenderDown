@python -x "%~f0" %* & goto :eof

import os
import subprocess
import glob
import sys

# Style template for a professional look
def get_html_template(content):
    return f"""
<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        window.MathJax = {{
            tex: {{
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true
            }},
            options: {{
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process'
            }}
        }};
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        :root {{
            --primary: #1a4d80;
            --secondary: #2e75b6;
            --text: #2d3436;
            --light-gray: #f8f9fa;
            --border: #e9ecef;
        }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--text);
            max-width: 800px;
            margin: 0 auto;
            padding: 10px 60px;
            background-color: white;
        }}
        @page {{ margin: 15mm 20mm; }}
        h1 {{
            color: var(--primary);
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            border-bottom: 3px solid var(--primary);
            padding-bottom: 10px;
        }}
        h2 {{
            color: var(--secondary);
            font-size: 1.5rem;
            margin-top: 1.5rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 6px;
        }}
        h3 {{ color: var(--primary); font-size: 1.2rem; margin-top: 1.2rem; }}
        p {{ margin-bottom: 1.2rem; }}
        ul, ol {{ margin-bottom: 1.5rem; padding-left: 2rem; }}
        ul {{ list-style-type: disc; }}
        li {{ margin-bottom: 0.6rem; }}
        li p {{ margin-bottom: 0.2rem; }}
        strong {{ color: #000; font-weight: 600; }}
        hr {{ border: 0; border-top: 1px solid var(--border); margin: 3rem 0; }}
        a {{
            color: #4A8FE2;
            text-decoration: underline;
            text-underline-offset: 2px;
        }}
        .MathJax {{ font-size: 1.1em !important; }}
        .footer {{
            margin-top: 2.5rem;
            padding-top: 0;
            border-top: none;
            color: #636e72;
            font-size: 0.9rem;
        }}
        .footer p {{
            margin-bottom: 0 !important;
            margin-top: 0 !important;
            line-height: 1.3;
        }}
        .footer strong {{
            color: var(--primary);
        }}
        @media print {{
            body {{ padding: 0; }}
            h1 {{ page-break-before: avoid; }}
        }}
    </style>
</head>
<body>
    {content}
</body>
</html>
"""

def batch_convert():
    print("==============================================")
    print("  Markdown to PDF Professional Converter")
    print("==============================================\n")
    
    # Check if 'pandoc' is installed
    try:
        subprocess.run(["pandoc", "--version"], check=True, capture_output=True, text=True, encoding='utf-8')
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: 'pandoc' is not installed or not in PATH. Please install it from https://pandoc.org/")
        os.system("pause")
        return

    md_files = glob.glob("*.md")
    if not md_files:
        print("No .md files found in this folder.")
        os.system("pause")
        return

    # Find Microsoft Edge executable for PDF generation
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\Edge\Application\msedge.exe")
    ]
    edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
    
    if not edge_exe:
        print("Error: Microsoft Edge not found. Please ensure it is installed.")
        os.system("pause")
        return

    print(f"Found {len(md_files)} markdown file(s).")
    
    for md_file in md_files:
        base_name = os.path.splitext(md_file)[0]
        pdf_name = f"pdf_{base_name}.pdf"
        
        # Check if the PDF already exists
        if os.path.exists(pdf_name):
            print(f"[-] Skipping '{md_file}': '{pdf_name}' already exists.")
            continue
            
        print(f"[*] Converting '{md_file}' to '{pdf_name}'...")
        temp_html = None
        try:
            # Use pandoc to convert MD to HTML (fragment)
            cmd_pandoc = ["pandoc", md_file, "-t", "html", "--mathjax"]
            result = subprocess.run(cmd_pandoc, check=True, capture_output=True, text=True, encoding='utf-8')
            html_content = result.stdout
            
            # Application of the professional styling template
            if "<!-- footer -->" in html_content or "<!-- footer  -->" in html_content:
                footer_marker = "<!-- footer -->" if "<!-- footer -->" in html_content else "<!-- footer  -->"
                parts = html_content.split(footer_marker)
                html_content = parts[0] + '<div class="footer">' + parts[1] + '</div>'
            
            full_html = get_html_template(html_content)
            temp_html = f"temp_{base_name}.html"
            
            with open(temp_html, 'w', encoding='utf-8') as f:
                f.write(full_html)
                
            # Command to print to PDF using Edge's headless mode
            cmd = [
                edge_exe,
                "--headless",
                "--disable-gpu",
                f"--print-to-pdf={os.path.abspath(pdf_name)}",
                "--no-pdf-header-footer",
                "--run-all-compositor-stages-before-draw",
                "--virtual-time-budget=5000",
                os.path.abspath(temp_html)
            ]
            
            subprocess.run(cmd, check=True, capture_output=True, timeout=60, text=True, encoding='utf-8', errors='replace')
            print(f"[+] Successfully created: {pdf_name}")
            
        except subprocess.CalledProcessError as e:
            print(f"[!] Pandoc or Edge error for '{md_file}': {e.stderr}")
        except Exception as e:
            print(f"[!] Error processing '{md_file}': {e}")
        finally:
            # Clean up temp file
            if temp_html and os.path.exists(temp_html):
                os.remove(temp_html)

    print("\n----------------------------------------------")
    print("  Done!")
    print("----------------------------------------------\n")
    os.system("pause")

if __name__ == "__main__":
    batch_convert()
