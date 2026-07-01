/*
 * Builds the light "professional" print document used to produce a PDF, and drives
 * the browser's native print-to-PDF instead of the old pandoc + headless-Edge pipeline
 * (legacy/convert-MD-PDF.bat). Same rendering engine family (Chromium print), no
 * external tools required.
 */

function escapeHtmlPrint(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
:root {
    --primary: #1a4d80;
    --secondary: #2e75b6;
    --text: #2d3436;
    --light-gray: #f8f9fa;
    --border: #e9ecef;
}
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text);
    max-width: 800px;
    margin: 0 auto;
    padding: 10px 60px;
    background-color: white;
}
@page { margin: 15mm 20mm; }
h1 {
    color: var(--primary);
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    border-bottom: 3px solid var(--primary);
    padding-bottom: 10px;
}
h2 {
    color: var(--secondary);
    font-size: 1.5rem;
    margin-top: 1.5rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 6px;
}
h3 { color: var(--primary); font-size: 1.2rem; margin-top: 1.2rem; }
p { margin-bottom: 1.2rem; }
ul, ol { margin-bottom: 1.5rem; padding-left: 2rem; }
ul { list-style-type: disc; }
li { margin-bottom: 0.6rem; }
li p { margin-bottom: 0.2rem; }
strong { color: #000; font-weight: 600; }
hr { border: 0; border-top: 1px solid var(--border); margin: 3rem 0; }
a {
    color: #4A8FE2;
    text-decoration: underline;
    text-underline-offset: 2px;
}
.MathJax { font-size: 1.1em !important; }
pre {
    background-color: var(--light-gray);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid var(--border);
}
code {
    font-family: 'Fira Code', monospace;
    font-size: 0.85em;
    background-color: var(--light-gray);
    padding: 2px 5px;
    border-radius: 4px;
}
pre code { background: none; padding: 0; }
blockquote {
    border-left: 4px solid var(--secondary);
    margin: 1.5em 0;
    padding: 0.2rem 1.2rem;
    color: #4a4a4a;
    font-style: italic;
}
table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
th, td { padding: 8px 12px; border: 1px solid var(--border); text-align: left; }
th { background-color: var(--light-gray); }
@media print {
    body { padding: 0; }
    h1 { page-break-before: avoid; }
}
`;

/**
 * @param {string} title
 * @param {string} contentHtml already-rendered HTML fragment (marked.parse output)
 */
function buildPrintHtml(title, contentHtml) {
    const safeTitle = escapeHtmlPrint(title || 'Untitled Notes');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
<script>
    window.MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true
        },
        options: {
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
        }
    };
<\/script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
<style>${PRINT_CSS}</style>
</head>
<body>
${contentHtml}
<script>
    function triggerPrint() {
        window.focus();
        window.print();
    }
    window.addEventListener('load', () => {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise.then(triggerPrint).catch(triggerPrint);
        } else {
            setTimeout(triggerPrint, 800);
        }
    });
    window.onafterprint = () => window.close();
<\/script>
</body>
</html>`;
}
