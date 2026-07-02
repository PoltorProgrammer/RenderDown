# MD Notes Studio

[![Deploy](https://img.shields.io/badge/🔗%20See-Live%20demo-blue)](https://poltorprogrammer.github.io/RenderDown/)

A single static web page that turns Markdown into:

- **A searchable notes viewer** — a self-contained, dark-themed `.html` file with a
  sidebar table of contents, full-text search, scroll-spy, sticky breadcrumbs, and
  MathJax math rendering.
- **A PDF** — a clean, print-styled document generated via your browser's native
  "Save as PDF" print flow.

No install, no build step, no backend. Paste markdown or drop a `.md` file, preview it
live, and download either output.

## Using it

Open `index.html` directly in a browser, or serve the folder with any static file
server, e.g.:

```
npx serve .
```

or host it for free on **GitHub Pages**: push this repo to GitHub, then in the repo
settings enable Pages for the root of the default branch.

## How it works

This is a browser-only rewrite of a local two-script workflow (kept in [`legacy/`](legacy/)
for reference):

| Old local script | New in-browser equivalent |
| --- | --- |
| `legacy/generate_viewer.js` (Node, hardcoded to one course's `ALL_LECTURES.md`) | [`assets/viewer-template.js`](assets/viewer-template.js) — same dark viewer/TOC/search UI, generalized to any title + markdown, built entirely client-side |
| `legacy/convert-MD-PDF.bat` (Python + pandoc + headless Microsoft Edge) | [`assets/print-template.js`](assets/print-template.js) — same "professional" print theme, rendered in a popup window and printed via the browser's own print engine (no pandoc/Edge/Python needed) |

[`assets/app.js`](assets/app.js) wires up the editor: file upload/drag-drop, a live
preview (rendered with the same template used for the download, so what you see is
what you get), and the two download buttons.

The exported viewer `.html` inlines `marked.js` at export time so it works fully
offline afterwards; MathJax is still loaded from a CDN (needed only if the document
contains `$...$` / `$$...$$` math).

## Notes

- "Download PDF" opens a new tab and triggers the print dialog — choose **Save as
  PDF** as the destination. Allow pop-ups for this page if your browser blocks it.
- "Download Viewer" saves a single `.html` file you can open anywhere or host
  alongside this app.
