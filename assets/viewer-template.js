/*
 * Builds a self-contained "notes viewer" HTML document from a title + markdown string.
 * This is the same dark sidebar/TOC/search/MathJax viewer originally hand-built for
 * PCOL2021_Viewer.html (see legacy/generate_viewer.js), generalized so it no longer
 * hardcodes a filename, title, or course name.
 */

const MARKED_CDN_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

const VIEWER_CSS = `
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
    flex-grow: 1;
    max-height: calc(100vh - 120px);
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

.toc-h1 {
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 15px;
    margin-bottom: 5px;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    background-color: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-left: 10px;
}
.toc-h2 { padding-left: 20px; font-weight: 600; margin-top: 4px; color: #d4d4d8; }
.toc-h3 { padding-left: 35px; }
.toc-h4 { padding-left: 50px; font-size: 0.85rem; color: #71717a; }

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
    list-style: none;
}
details.ignored-search summary::-webkit-details-marker {
    color: var(--accent-color);
}
details.ignored-search summary:hover {
    color: var(--accent-color);
}

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

@media (max-width: 640px) {
    #sidebar { display: none; }
    #content-wrapper { padding: 20px; }
}
`;

// Injected verbatim into the exported HTML as an IIFE. Runs inside the *generated*
// document, not this app, so it can only rely on globals it sets up itself (marked, MathJax).
function viewerClientScript() {
    const RAW_MD = '%%BASE64_MD%%';

    function decodeBase64(str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            const markdown = decodeBase64(RAW_MD);
            const wrapper = document.getElementById('content-wrapper');

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

            // MathJax's script tag is async, so window.MathJax may still just be the plain
            // config object (no startup.promise yet) at this point — poll briefly until the
            // real runtime attaches, then typeset the dynamically-inserted content.
            (function typesetWhenReady(attempts) {
                attempts = attempts || 0;
                if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
                    window.MathJax.startup.promise
                        .then(() => window.MathJax.typesetPromise([wrapper]))
                        .catch(err => console.error('MathJax Error:', err));
                } else if (attempts < 40) {
                    setTimeout(() => typesetWhenReady(attempts + 1), 250);
                }
            })();

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
            const filter = {
                acceptNode: function (node) {
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

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * @param {{title: string, markdown: string, markedJsSource: string|null}} opts
 *   markedJsSource: full text of marked.min.js to inline for a fully offline-capable
 *   export. If null, falls back to a CDN <script src> reference.
 */
function buildViewerHtml({ title, markdown, markedJsSource }) {
    const safeTitle = escapeHtml(title || 'Untitled Notes');
    const base64Md = btoa(unescape(encodeURIComponent(markdown || '')));

    let clientJs = viewerClientScript.toString();
    clientJs = `(${clientJs})();`;
    clientJs = clientJs.replace('%%BASE64_MD%%', base64Md);

    const markedScriptTag = markedJsSource
        ? `<script>${markedJsSource}<\/script>`
        : `<script src="${MARKED_CDN_URL}"><\/script>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>${VIEWER_CSS}</style>
${markedScriptTag}
<script>
    window.MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
        },
        svg: { fontCache: 'global' },
        // Content is injected after load (base64-decoded markdown), so MathJax's own
        // automatic startup typeset would race with that and can double-render. We
        // trigger typesetting ourselves once the content is in the DOM instead.
        startup: { typeset: false }
    };
<\/script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
</head>
<body>
    <div id="sidebar">
        <div id="sidebar-header">
            <h2>${safeTitle}</h2>
            <small>Generated with MD Notes Studio</small>
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
    <script>${clientJs}<\/script>
</body>
</html>`;
}
