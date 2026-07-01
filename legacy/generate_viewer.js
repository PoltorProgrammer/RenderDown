const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, 'PCOL2021_Viewer.html');
const MARKED_URL = 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.5/marked.min.js';

// --- CSS Content ---
// Embedded style for the viewer
const CSS_Mj = `
:root {
    --bg-color: #0f1115;
    --sidebar-bg: #16181d;
    --text-primary: #e6e6e6;
    --text-secondary: #a0a0b0;
    --accent-color: #6366f1;
    --accent-hover: #818cf8;
    --border-color: #2d3039;
    --code-bg: #1e2025;
    --highlight-bg: #facc15;
    --highlight-text: #000;
    --font-main: 'Inter', sans-serif;
    --font-mono: 'Fira Code', monospace;
    --toc-active-bg: rgba(99, 102, 241, 0.15);
    --toc-active-stripe: #6366f1;
}

* { box-sizing: border-box; }

body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: var(--font-main);
    height: 100vh;
    overflow: hidden;
    display: flex;
}

/* Sidebar */
#sidebar {
    width: 350px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
}

#sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    background: linear-gradient(180deg, rgba(22,24,29,1) 0%, rgba(22,24,29,0.95) 100%);
}

#sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
}

#sidebar-header small {
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin-top: 5px;
    display: block;
}

#search-container {
    margin-top: 15px;
    position: relative;
}

#search-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: var(--font-main);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
}

#search-input:focus {
    border-color: var(--accent-color);
}

#search-results {
    flex-grow: 1; /* Take up remaining space if needed */
    max-height: calc(100vh - 120px); /* Fill sidebar */
    overflow-y: auto;
    border-top: 1px solid var(--border-color);
    display: none;
    background-color: #111318;
}

.search-result-item {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.search-result-item:hover {
    background-color: #1f2229;
}

.search-lecture-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--accent-color);
    font-weight: 700;
    letter-spacing: 0.05em;
    opacity: 0.8;
}

.search-section-title {
    font-size: 0.85rem;
    color: #e2e8f0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.search-preview {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin-top: 2px;
    /* Limit to 3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.search-preview b {
    color: var(--highlight-text);
    background-color: var(--highlight-bg);
    border-radius: 2px;
    padding: 0 1px;
    font-weight: normal;
}

#toc-container {
    flex-grow: 1;
    overflow-y: auto;
    padding: 10px 0;
}

#toc-container::-webkit-scrollbar { width: 6px; }
#toc-container::-webkit-scrollbar-thumb { background-color: #333; border-radius: 3px; }

.toc-item {
    padding: 6px 15px 6px 10px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.9rem;
    border-left: 3px solid transparent;
    transition: all 0.2s;
    line-height: 1.3;
    display: block;
    text-decoration: none;
    /* Allow wrapping for long titles */
    white-space: normal; 
}

.toc-item:hover {
    color: var(--text-primary);
    background-color: rgba(255,255,255,0.02);
}

.toc-item.active {
    color: var(--accent-color);
    background-color: var(--toc-active-bg);
    border-left-color: var(--toc-active-stripe);
    font-weight: 500;
}

/* Distinct hierarchy with better indentation steps */
.toc-h1 { 
    font-weight: 700; 
    color: var(--text-primary); 
    margin-top: 15px; 
    margin-bottom: 5px; 
    text-transform: uppercase; 
    font-size: 0.85rem; 
    letter-spacing: 0.05em; 
    background-color: rgba(255,255,255,0.03); /* Subtle separator background */
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-left: 10px;
}
.toc-h2 { padding-left: 20px; font-weight: 600; margin-top: 4px; color: #d4d4d8; }
.toc-h3 { padding-left: 35px; }
.toc-h4 { padding-left: 50px; font-size: 0.85rem; color: #71717a; }

/* Context Bar (Sticky) */
#context-bar {
    position: sticky;
    top: 0;
    z-index: 999;
    background-color: rgba(22, 24, 29, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
    padding: 10px 40px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: none;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.context-crumb {
    cursor: pointer;
    transition: color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
}
.context-crumb:hover {
    color: var(--text-primary);
    text-decoration: underline;
}
.context-separator {
    margin: 0 8px;
    color: #555;
    font-size: 0.8em;
}
.context-crumb.active {
    color: var(--accent-color);
    font-weight: 500;
}

/* Folded / Ignored Sections */
details.ignored-search {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 10px;
    margin: 1em 0;
    background-color: rgba(255, 255, 255, 0.02);
}
details.ignored-search summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--text-secondary);
    outline: none;
    list-style: none; /* Hide default triangle in some browsers if desired, or keep it */
}
details.ignored-search summary::-webkit-details-marker {
    color: var(--accent-color);
}
details.ignored-search summary:hover {
    color: var(--accent-color);
}

/* Main Content */
#main-content {
    flex-grow: 1;
    padding: 0;
    overflow-y: auto;
    position: relative;
    scroll-behavior: smooth;
}

#content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 60px 40px 100px;
}

h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    margin-top: 2.5em;
    margin-bottom: 0.8em;
    line-height: 1.3;
}

h1 { font-size: 2.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; color: var(--accent-color); margin-top: 1em; }
h2 { font-size: 1.8rem; font-weight: 600; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
h3 { font-size: 1.4rem; font-weight: 600; color: #d4d4d8; }
h4 { font-size: 1.15rem; font-weight: 600; color: #a1a1aa; }

p, li {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #d1d5db;
}

strong { color: #fff; font-weight: 600; }
em { color: #e2e8f0; }

ul, ol { padding-left: 1.5rem; }
li { margin-bottom: 0.5em; }
ul ul, ol ol { margin-top: 0.5em; }

pre {
    background-color: var(--code-bg);
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid var(--border-color);
}

code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background-color: rgba(255,255,255,0.05);
    padding: 2px 5px;
    border-radius: 4px;
    color: #e0e7ff;
}

pre code {
    background-color: transparent;
    padding: 0;
    color: #a5b4fc;
}

blockquote {
    border-left: 4px solid var(--accent-color);
    margin: 1.5em 0;
    padding-left: 1rem;
    background: linear-gradient(90deg, rgba(99,102,241,0.1) 0%, transparent 100%);
    border-radius: 0 4px 4px 0;
    padding: 10px 20px;
    font-style: italic;
    color: #cbd5e1;
}

hr {
    border: 0;
    height: 1px;
    background: var(--border-color);
    margin: 3em 0;
}

mark.search-match {
    background-color: var(--highlight-bg);
    color: var(--highlight-text);
    border-radius: 2px;
    padding: 0 2px;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 2em 0;
    border: 1px solid var(--border-color);
}
th, td {
    padding: 12px 15px;
    border: 1px solid var(--border-color);
    text-align: left;
}
th {
    background-color: #23262e;
    font-weight: 600;
}
tr:nth-child(even) {
    background-color: #16181d;
}

#main-content::-webkit-scrollbar { width: 10px; }
#main-content::-webkit-scrollbar-track { background: var(--bg-color); }
#main-content::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; border: 2px solid var(--bg-color); }
#main-content::-webkit-scrollbar-thumb:hover { background: #555; }

@media (max-width: 900px) {
    #sidebar { display: none; }
    #content-wrapper { padding: 20px; }
}
`;

// --- Helpers ---
function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (e) => { reject(e); });
    });
}

function preprocessMarkdown(content) {
    // Runs at build time to fix deep indentation
    const lines = content.split('\n');
    const processedLines = [];

    let lastInputIndent = 0;
    let currentOutputIndent = 0;
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();

        // Empty lines: preserve
        if (trimmed.length === 0) {
            processedLines.push('');
            continue;
        }

        // 1. Headers: Always reset list context and flatten to 0
        if (trimmed.startsWith('#')) {
            processedLines.push(trimmed);
            inList = false;
            currentOutputIndent = 0;
            lastInputIndent = 0;
            continue;
        }

        // Calculate current input indent (tabs -> 4 spaces)
        const expandedLine = line.replace(/\t/g, '    ');
        const leadingSpaces = expandedLine.match(/^\s*/)[0].length;

        // 2. List Items
        // Check for dashes, asterisks, pluses, or "1." digit lists
        const isList = trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+') || /^\d+\./.test(trimmed);

        if (isList) {
            if (!inList) {
                // Start of a new list block
                inList = true;
                currentOutputIndent = 0; // Force root list to 0 indent
                lastInputIndent = leadingSpaces;
            } else {
                // Continue list
                // Calculate step difference (assume approx 4 spaces per level in input)
                const diff = leadingSpaces - lastInputIndent;
                // Round to nearest level step (4 spaces input -> 2 spaces output)
                const steps = Math.round(diff / 4.0);

                // Update output indent
                currentOutputIndent += (steps * 2);

                // Safety: prevent negative indent
                if (currentOutputIndent < 0) currentOutputIndent = 0;

                lastInputIndent = leadingSpaces;
            }

            const newIndentStr = ' '.repeat(currentOutputIndent);
            processedLines.push(newIndentStr + trimmed);
        }
        else {
            // 3. Normal Text
            if (inList) {
                if (trimmed.startsWith('```')) {
                    processedLines.push(' '.repeat(currentOutputIndent) + trimmed);
                } else {
                    processedLines.push(' '.repeat(currentOutputIndent) + trimmed);
                }
            } else {
                processedLines.push(trimmed);
            }
        }
    }

    return processedLines.join('\n');
}

function foldIgnoredSections(content) {
    // Keep helper but make it a no-op as we do not have specific ignored sections in this course
    return content;
}

// --- Client Script (Injected) ---
function clientScript() {
    // --- State ---
    const RAW_MD = `%%BASE64_MD%%`;

    // --- Utils ---
    function decodeBase64(str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            const markdown = decodeBase64(RAW_MD);
            const wrapper = document.getElementById('content-wrapper');

            // Initialize MathJax protection map
            const mathMap = new Map();
            let mathCount = 0;

            let protectedMd = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m) => {
                const key = `MATHBLOCK${mathCount++}`;
                mathMap.set(key, m);
                return key;
            }).replace(/\$([^$]+?)\$/g, (m) => {
                const key = `MATHINLINE${mathCount++}`;
                mathMap.set(key, m);
                return key;
            });

            try {
                wrapper.innerHTML = marked.parse(protectedMd);
            } catch (err) {
                console.error('Marked parsing failed:', err);
                wrapper.innerHTML = '<div class="error">Error rendering markdown content.</div>';
            }

            wrapper.innerHTML = wrapper.innerHTML.replace(/MATH(BLOCK|INLINE)\d+/g, (match) => {
                return mathMap.get(match) || match;
            });

            if (window.MathJax) {
                try {
                    window.MathJax.typesetPromise([wrapper]).catch(err => console.error('MathJax Error:', err));
                } catch (e) { console.error('MathJax synchronous error', e); }
            }

            try { setupTOC(); } catch (e) { console.error('TOC Setup Failed:', e); }
            try { setupSearch(); } catch (e) { console.error('Search Setup Failed:', e); }
            try { setupScrollSpy(); } catch (e) { console.error('ScrollSpy Setup Failed:', e); }
            try { setupContextBar(); } catch (e) { console.error('ContextBar Setup Failed:', e); }

            if (window.location.hash) {
                setTimeout(() => {
                    try {
                        const target = document.querySelector(window.location.hash);
                        if (target) target.scrollIntoView();
                    } catch (e) { }
                }, 500);
            }
        } catch (criticalError) {
            console.error('Critical Viewer Error:', criticalError);
            alert('A critical error occurred initializing the viewer. Check console for details.');
        }
    });

    // --- Context Bar (Sticky Headers) ---
    function setupContextBar() {
        const mainContent = document.getElementById('main-content');
        const contextBar = document.getElementById('context-bar');
        let headerMap = [];

        function cacheOffsets() {
            const headers = Array.from(document.querySelectorAll('#content-wrapper h1, #content-wrapper h2, #content-wrapper h3'));
            headerMap = headers.map(h => ({
                id: h.id,
                tag: h.tagName,
                text: h.textContent,
                top: h.offsetTop
            }));
        }

        setTimeout(() => {
            cacheOffsets();
            updateContext();
        }, 300);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                cacheOffsets();
                updateContext();
            }, 100);
        });

        let lastKey = '';

        function updateContext() {
            if (headerMap.length === 0) return;
            const scrollY = mainContent.scrollTop + 80;
            let activeH1 = null;
            let activeH2 = null;
            let activeH3 = null;

            for (let i = 0; i < headerMap.length; i++) {
                const h = headerMap[i];
                if (h.top > scrollY) break;
                if (h.tag === 'H1') { activeH1 = h; activeH2 = null; activeH3 = null; }
                else if (h.tag === 'H2') { activeH2 = h; activeH3 = null; }
                else if (h.tag === 'H3') { activeH3 = h; }
            }

            const key = `${activeH1 ? activeH1.id : ''}|${activeH2 ? activeH2.id : ''}|${activeH3 ? activeH3.id : ''}`;
            if (key === lastKey) return;
            lastKey = key;

            const crumbs = [];
            if (activeH1) crumbs.push(activeH1);
            if (activeH2) crumbs.push(activeH2);
            if (activeH3) crumbs.push(activeH3);

            if (crumbs.length === 0) {
                contextBar.style.display = 'none';
                return;
            }

            contextBar.style.display = 'flex';
            contextBar.innerHTML = crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                let html = i > 0 ? `<span class="context-separator"> › </span>` : '';
                const safeText = c.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html += `<span class="context-crumb ${isLast ? 'active' : ''}" onclick="document.getElementById('${c.id}').scrollIntoView({behavior:'smooth'})">${safeText}</span>`;
                return html;
            }).join('');
        }

        mainContent.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateContext);
        });
    }

    // --- TOC Generator ---
    function setupTOC() {
        const tocContainer = document.getElementById('toc-container');
        const headers = document.querySelectorAll('#content-wrapper h1, #content-wrapper h2, #content-wrapper h3, #content-wrapper h4');
        const fragment = document.createDocumentFragment();

        headers.forEach((h, index) => {
            if (!h.id) h.id = `section-${index}`;
            const link = document.createElement('a');
            link.href = `#${h.id}`;
            link.className = `toc-item toc-${h.tagName.toLowerCase()}`;
            link.textContent = h.textContent;
            link.dataset.targetId = h.id;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, null, `#${h.id}`);
            });
            fragment.appendChild(link);
        });

        tocContainer.appendChild(fragment);
    }

    // --- ScrollSpy ---
    function setupScrollSpy() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    document.querySelectorAll('.toc-item').forEach(l => l.classList.remove('active'));
                    const activeLink = document.querySelector(`.toc-item[data-target-id="${id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { rootMargin: '-10% 0px -80% 0px' });
        document.querySelectorAll('#content-wrapper h1, #content-wrapper h2, #content-wrapper h3, #content-wrapper h4').forEach(h => {
            observer.observe(h);
        });
    }

    // --- Search ---
    function setupSearch() {
        const input = document.getElementById('search-input');
        const resultsBox = document.getElementById('search-results');
        const content = document.getElementById('content-wrapper');
        const tocContainer = document.getElementById('toc-container');

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                input.focus();
                input.select();
            }
        });

        let debounceTimer;
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => runSearch(e.target.value), 300);
        });

        function runSearch(term) {
            term = term.toLowerCase();
            if (term.length < 2) {
                resultsBox.style.display = 'none';
                tocContainer.style.display = 'block';
                return;
            }

            tocContainer.style.display = 'none';
            resultsBox.style.display = 'block';
            resultsBox.innerHTML = '<div style="padding:20px; color:#666;">Searching...</div>';

            const matches = [];
            // Filter out nodes inside .ignored-search
            const filter = {
                acceptNode: function (node) {
                    // Check if parent or any ancestor has ignore class
                    if (node.parentElement && node.parentElement.closest('.ignored-search')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            };
            const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, filter, false);
            let node;
            const maxResults = 100;

            while (node = walker.nextNode()) {
                if (matches.length >= maxResults) break;
                const text = node.nodeValue;
                const idx = text.toLowerCase().indexOf(term);

                if (idx !== -1) {
                    // Context Discovery
                    let lectureTitle = "General";
                    let sectionTitle = "Introduction";
                    let current = node.parentElement;
                    let check = current;
                    let foundSection = false;
                    let foundLecture = false;

                    let sibling = check;
                    while (sibling && sibling.parentElement !== content) {
                        sibling = sibling.parentElement;
                    }
                    while (sibling) {
                        if (!foundSection && ['H2', 'H3', 'H4'].includes(sibling.tagName)) {
                            sectionTitle = sibling.textContent;
                            foundSection = true;
                        }
                        if (!foundLecture && sibling.tagName === 'H1') {
                            lectureTitle = sibling.textContent;
                            foundLecture = true;
                        }
                        if (foundSection && foundLecture) break;
                        sibling = sibling.previousElementSibling;
                    }

                    const start = Math.max(0, idx - 40);
                    const end = Math.min(text.length, idx + term.length + 60);
                    let snippet = text.substring(start, end);
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    snippet = snippet.replace(regex, '<b>$1</b>');

                    matches.push({
                        node: node,
                        lecture: lectureTitle,
                        section: sectionTitle,
                        snippet: snippet
                    });
                }
            }
            renderResults(matches, term);
        }

        function renderResults(matches, term) {
            resultsBox.innerHTML = '';
            if (matches.length === 0) {
                resultsBox.innerHTML = '<div style="padding:20px; color:#666; text-align:center;">No matches found</div>';
                return;
            }

            matches.forEach(m => {
                const el = document.createElement('div');
                el.className = 'search-result-item';
                el.innerHTML = `
                    <div class="search-lecture-title">${m.lecture}</div>
                    <div class="search-section-title">${m.section}</div>
                    <div class="search-preview">...${m.snippet}...</div>
                `;
                el.addEventListener('click', () => {
                    const parent = m.node.parentElement;
                    parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    parent.style.transition = 'background 0.5s';
                    const originalBg = parent.style.backgroundColor;
                    parent.style.backgroundColor = 'rgba(250, 204, 21, 0.2)';
                    setTimeout(() => {
                        parent.style.backgroundColor = originalBg;
                    }, 1500);
                });
                resultsBox.appendChild(el);
            });
        }
    }
}

// --- Main Build Script ---
async function main() {
    try {
        console.log('--- Starting Viewer Generation ---');

        console.log('Downloading marked.js...');
        const markedJsContent = await download(MARKED_URL);

        const INPUT_FILE = path.join(__dirname, 'ALL_LECTURES.md');
        console.log(`Reading unified markdown from ${INPUT_FILE}...`);
        if (!fs.existsSync(INPUT_FILE)) throw new Error('Input file missing!');

        const rawMarkdown = fs.readFileSync(INPUT_FILE, 'utf8');

        console.log('Preprocessing Markdown (fixing indentation)...');
        let cleanMarkdown = preprocessMarkdown(rawMarkdown);

        console.log('Applying Foldable Sections (Non-searchable)...');
        cleanMarkdown = foldIgnoredSections(cleanMarkdown);

        const base64Md = Buffer.from(cleanMarkdown).toString('base64');

        let clientJs = clientScript.toString();
        clientJs = `(${clientJs})();`; // IIFE
        clientJs = clientJs.replace('%%BASE64_MD%%', base64Md);

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PCOL2021 Pharmacology Notes Viewer</title>
    <link rel="icon" type="image/png" href="https://instructure-uploads-apse2.s3-ap-southeast-2.amazonaws.com/account_31560000000000001/attachments/128313/Usyd%20new%20logo%20mono.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>${CSS_Mj}</style>
    <script>
        ${markedJsContent}
    </script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            },
            svg: { fontCache: 'global' }
        };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <div id="sidebar">
        <div id="sidebar-header">
            <h2>PCOL2021 Pharmacology Notes</h2>
            <small>Lectures &amp; Transcripts</small>
            <div id="search-container">
                <input type="text" id="search-input" placeholder="Search (Ctrl+F)...">
            </div>
        </div>
        <div id="search-results"></div>
        <div id="toc-container"></div>
    </div>
    <div id="main-content">
        <div id="context-bar"></div>
        <div id="content-wrapper"></div>
    </div>
    <script>
        ${clientJs}
    </script>
</body>
</html>`;

        fs.writeFileSync(OUTPUT_FILE, html);
        console.log(`✅ Success! Viewer generated at: ${OUTPUT_FILE}`);
        console.log(`   Size: ${(html.length / 1024).toFixed(2)} KB`);
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}

main();
