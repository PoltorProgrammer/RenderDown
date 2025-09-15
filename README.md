# RenderDown

**RenderDown** is a lightweight HTML/JS tool for testing how Markdown files render in a browser.
It uses a custom-built parser (`markdown-parser.js`) to convert Markdown into clean, predictable HTML with support for:

* Headers (`#`, underline style, and mixed formats)
* Text formatting (bold, italic, strikethrough, with nested support)
* Lists (ordered, unordered, nested, task lists)
* Blockquotes
* Code blocks and inline code (protected from mis-formatting)
* Links, images, and auto-linking of URLs
* Horizontal rules
* Automatic cleanup of extra spacing and empty elements

## Features

* Upload and preview `.md` or `.txt` files directly in the browser.
* Displays how Markdown is rendered with consistent, clean HTML.
* Useful for testing critical formatting before integration in other apps.
* Robust parser with smart detection to avoid false positives (e.g., initials mistaken for lists).

## Usage

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/renderdown.git
   cd renderdown
   ```

2. Open the `index.html` file in your browser.

3. Click **Select Markdown File** and choose any `.md` or `.txt` file.

4. The file will render in the preview panel using the custom Markdown parser.

## File Structure

* `index.html` – Main interface for file selection and preview.
* `style.css` – Styles for the UI and preview panel.
* `app.js` – Handles file input, reading, and rendering with the parser.
* `markdown-parser.js` – Custom parser that converts Markdown to HTML.

## Example

If you upload a file with:

```markdown
# Project Notes

- Task 1: Refactor parser
- Task 2: Add unit tests

> Reminder: Release candidate due next week.
```

It will render in the preview panel as styled headers, bullet lists, and blockquotes.
