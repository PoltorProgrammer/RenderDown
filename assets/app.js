(() => {
    const els = {
        title: document.getElementById('doc-title'),
        md: document.getElementById('md-input'),
        file: document.getElementById('file-input'),
        dropzone: document.getElementById('dropzone'),
        preview: document.getElementById('preview-frame'),
        downloadViewer: document.getElementById('download-viewer'),
        downloadPdf: document.getElementById('download-pdf'),
        status: document.getElementById('status'),
    };

    let markedJsSource = null; // inlined into exported viewer HTML for offline use

    function setStatus(msg, isError) {
        els.status.textContent = msg;
        els.status.classList.toggle('error', !!isError);
    }

    function slugify(s) {
        return (s || 'notes').trim().toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '') || 'notes';
    }

    function currentTitle() {
        return els.title.value.trim() || 'Untitled Notes';
    }

    function protectMath(md) {
        const map = new Map();
        let i = 0;
        const protectedMd = md
            .replace(/\$\$([\s\S]*?)\$\$/g, (m) => { const k = `MATHBLOCK${i++}`; map.set(k, m); return k; })
            .replace(/\$([^$\n]+?)\$/g, (m) => { const k = `MATHINLINE${i++}`; map.set(k, m); return k; });
        return { protectedMd, map };
    }

    function restoreMath(html, map) {
        return html.replace(/MATH(BLOCK|INLINE)\d+/g, (m) => map.get(m) || m);
    }

    function renderMarkdownFragment(md) {
        const { protectedMd, map } = protectMath(md);
        let html;
        try {
            html = marked.parse(protectedMd);
        } catch (e) {
            html = `<p>Error rendering markdown: ${String(e)}</p>`;
        }
        return restoreMath(html, map);
    }

    function downloadBlob(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function refreshPreview() {
        const html = buildViewerHtml({ title: currentTitle(), markdown: els.md.value, markedJsSource });
        els.preview.srcdoc = html;
    }

    let debounceTimer;
    function scheduleRefresh() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(refreshPreview, 250);
    }

    async function loadFile(file) {
        if (!/\.(md|markdown|txt)$/i.test(file.name)) {
            setStatus(`"${file.name}" doesn't look like a markdown file, loading it anyway.`, false);
        }
        const text = await file.text();
        els.md.value = text;
        if (!els.title.value.trim()) {
            els.title.value = file.name.replace(/\.(md|markdown|txt)$/i, '');
        }
        setStatus(`Loaded "${file.name}" (${text.length.toLocaleString()} characters).`);
        refreshPreview();
    }

    els.md.addEventListener('input', scheduleRefresh);
    els.title.addEventListener('input', scheduleRefresh);

    els.file.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadFile(file);
        e.target.value = '';
    });

    ['dragover'].forEach(evt => els.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        els.dropzone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(evt => els.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        els.dropzone.classList.remove('dragover');
    }));
    els.dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    });
    els.dropzone.addEventListener('click', () => els.file.click());

    els.downloadViewer.addEventListener('click', () => {
        if (!els.md.value.trim()) { setStatus('Nothing to export yet — paste or upload some markdown first.', true); return; }
        const title = currentTitle();
        const html = buildViewerHtml({ title, markdown: els.md.value, markedJsSource });
        downloadBlob(`${slugify(title)}-viewer.html`, html, 'text/html');
        setStatus(`Downloaded ${slugify(title)}-viewer.html`);
    });

    els.downloadPdf.addEventListener('click', () => {
        if (!els.md.value.trim()) { setStatus('Nothing to export yet — paste or upload some markdown first.', true); return; }
        // Open synchronously (before any async work) so browsers don't treat it as a blocked popup.
        const win = window.open('', '_blank');
        if (!win) {
            setStatus('Pop-up blocked — please allow pop-ups for this page, then try again.', true);
            return;
        }
        const title = currentTitle();
        const contentHtml = renderMarkdownFragment(els.md.value);
        const html = buildPrintHtml(title, contentHtml);
        win.document.open();
        win.document.write(html);
        win.document.close();
        setStatus('Opened print view — choose "Save as PDF" in the print dialog.');
    });

    async function init() {
        setStatus('Loading markdown renderer...');
        try {
            const res = await fetch(MARKED_CDN_URL);
            if (res.ok) markedJsSource = await res.text();
        } catch (e) {
            console.warn('Could not fetch marked.js for offline inlining; exported viewer will reference the CDN instead.', e);
        }
        setStatus('Ready. Paste markdown, or upload a .md file.');
        refreshPreview();
    }

    init();
})();
