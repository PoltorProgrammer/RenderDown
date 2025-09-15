// Markdown Parser - Universal Markdown to HTML Conversion
class MarkdownParser {
    constructor() {
        // Initialize any parser-specific settings if needed
    }

    // Main conversion method with clean output
    convertMarkdownToHTML(markdown) {
        let html = markdown;
        
        try {
            // Step 1: Normalize content and strip quotes
            html = this.normalizeContent(html);
            
            // Step 2: Protect code blocks and inline code from further processing
            const codeBlocks = [];
            const inlineCode = [];
            html = this.protectCodeBlocks(html, codeBlocks, inlineCode);
            
            // Step 3: Process headers (multiple formats)
            html = this.processHeaders(html);
            
            // Step 4: Process text formatting (bold, italic) - NOW WITH NESTED SUPPORT
            html = this.processTextFormatting(html);
            
            // Step 5: Process blockquotes
            html = this.processBlockquotes(html);
            
            // Step 6: Process lists (robust nesting) - this handles its own spacing
            html = this.processLists(html);
            
            // Step 7: Process horizontal rules
            html = this.processHorizontalRules(html);
            
            // Step 8: Process links and images
            html = this.processLinksAndImages(html);
            
            // Step 9: Restore protected code blocks
            html = this.restoreCodeBlocks(html, codeBlocks, inlineCode);
            
            // Step 10: Process paragraphs and line breaks (clean output)
            html = this.processParagraphs(html);
            
            // Step 11: Final cleanup - remove any remaining empty elements or extra spacing
            html = this.finalCleanup(html);
            
        } catch (error) {
            console.error('Error converting markdown to HTML:', error);
            html = `<p>Error rendering content. Raw content:</p><pre>${this.escapeHtml(markdown)}</pre>`;
        }
        
        return html;
    }

    // Final cleanup to remove any remaining spacing issues
    finalCleanup(html) {
        return html
            // NEW: Remove stray <br> right after headers like </h1><br>
            .replace(/<\/(h[1-6])>\s*<br\s*\/?>\s*/gi, '</$1>')

            // Remove empty paragraphs (strict) and paragraphs that contain only <br> or &nbsp;
            .replace(/<p>\s*<\/p>/g, '')
            .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

            // Remove unnecessary line breaks around block elements
            .replace(/<br>\s*<(ul|ol|li|\/ul|\/ol|\/li)>/g, '<$1>')
            .replace(/<(ul|ol|li|\/ul|\/ol|\/li)>\s*<br>/g, '<$1>')

            // Remove multiple consecutive line breaks
            .replace(/\n\s*\n\s*\n/g, '\n\n')

            // Clean up spacing around lists
            .replace(/>\s*\n\s*</g, '><')

            // Remove trailing/leading whitespace from lines
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .join('\n');
    }

    // Content normalization and quote stripping
    normalizeContent(text) {
        // Strip surrounding quotes (various formats)
        text = text.replace(/^["'`]([\s\S]*?)["'`]$/s, '$1');
        
        // Normalize line endings
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove excessive whitespace but preserve intentional spacing
        text = text.replace(/[ \t]+$/gm, ''); // Remove trailing spaces
        
        return text;
    }

    // Protect code blocks from markdown processing
    protectCodeBlocks(text, codeBlocks, inlineCode) {
        // Protect fenced code blocks
        text = text.replace(/```([\s\S]*?)```/g, (match, content) => {
            const index = codeBlocks.length;
            codeBlocks.push(`<pre><code>${this.escapeHtml(content)}</code></pre>`);
            return `__CODE_BLOCK_${index}__`;
        });
        
        // Protect inline code
        text = text.replace(/`([^`]+)`/g, (match, content) => {
            const index = inlineCode.length;
            inlineCode.push(`<code>${this.escapeHtml(content)}</code>`);
            return `__INLINE_CODE_${index}__`;
        });
        
        return text;
    }

    // Process various header formats
    processHeaders(text) {
        // Standard markdown headers (with optional leading/trailing spaces)
        text = text.replace(/^\s*(#{1,6})\s*(.+?)\s*#*\s*$/gm, (match, hashes, content) => {
            const level = hashes.length;
            return `<h${level}>${content.trim()}</h${level}>`;
        });
        
        // Alternative header formats like * ## Title
        text = text.replace(/^\s*[\*\-\+]\s*(#{1,6})\s*(.+?)\s*$/gm, (match, hashes, content) => {
            const level = hashes.length;
            return `<h${level}>${content.trim()}</h${level}>`;
        });
        
        // Underlined headers (setext-style)
        text = text.replace(/^(.+)\n\s*=+\s*$/gm, '<h1>$1</h1>');
        text = text.replace(/^(.+)\n\s*-+\s*$/gm, '<h2>$1</h2>');
        
        return text;
    }

    // UPDATED: Process text formatting with nested italic support
    processTextFormatting(text) {
        // Special handling for double quotes: ""content"" → "*content*" (italics with single quotes)
        text = text.replace(/""([^"]+)""/g, '"*$1*"');
        
        // Bold with nested italic support - Modified regex to allow * and _ within content
        text = text.replace(/(\*\*|__)([^\s][^\n]*?[^\s]|[^\s])(\1)/g, (match, delimiter, content, closingDelimiter) => {
            // Process italics within the bold content
            if (delimiter === '**') {
                // For ** bold, process both * and _ italics within the content
                content = content.replace(/(?<!\*)(\*)([^*\n]+)(\*)(?!\*)/g, '<em>$2</em>');
                content = content.replace(/(?<!\w)(_)([^_\n]+)(_)(?!\w)/g, '<em>$2</em>');
            } else if (delimiter === '__') {
                // For __ bold, process both * and _ italics within the content
                content = content.replace(/(?<!\w)(\*)([^*\n]+)(\*)(?!\w)/g, '<em>$2</em>');
                content = content.replace(/(?<!_)(_)([^_\n]+)(_)(?!_)/g, '<em>$2</em>');
            }
            return `<strong>${content}</strong>`;
        });
        
        // Italic (for remaining cases not within bold)
        text = text.replace(/(?<!\w)(\*|_)([^*_\s][^*_]*[^*_\s]|\S)\1(?!\w)/g, '<em>$2</em>');
        
        // Strikethrough
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        
        return text;
    }

    // Process blockquotes
    processBlockquotes(text) {
        text = text.replace(/^\s*>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Merge consecutive blockquotes
        text = text.replace(/(<\/blockquote>\s*<blockquote>)/g, '<br>');
        
        return text;
    }

    // Indentation-based list processing with proper hierarchy preservation
    processLists(text) {
        const lines = text.split('\n');
        const result = [];
        const listStack = [];
        
        // First pass: analyze indentation patterns across the document
        const indentLevels = this.analyzeIndentationLevels(lines);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Match various list formats including task lists
            const listMatch = line.match(/^(\s*)([-*+]|\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdm]+[\.\)]|[IVXLCDM]+[\.\)])\s+(\[[ x]\]\s+)?(.*)$/i);
            
            if (listMatch) {
                const indent = listMatch[1].length;
                const marker = listMatch[2];
                const taskCheckbox = listMatch[3] || '';
                const content = listMatch[4];
                
                // Smart list detection: Check if this is actually a list item
                const isActualListItem = this.isActualListItem(lines, i, marker, indent);
                
                if (!isActualListItem) {
                    // Not a real list item, treat as regular text
                    this.closeAllLists(listStack, result);
                    result.push(line);
                    continue;
                }
                
                // Determine list type based on marker
                const isOrdered = /^(\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdm]+[\.\)]|[IVXLCDM]+[\.\)])$/i.test(marker);
                const listType = isOrdered ? 'ol' : 'ul';
                
                // Calculate nesting level based on document-wide indentation analysis
                const level = this.calculateNestingLevel(indent, indentLevels);
                
                // Adjust list stack to match current nesting level
                this.adjustListStack(listStack, result, level, listType);
                
                // Format content with task checkbox if present
                const formattedContent = taskCheckbox ? 
                    `<input type="checkbox" ${taskCheckbox.includes('x') ? 'checked' : ''} disabled> ${content}` : 
                    content;
                
                result.push(`<li>${formattedContent}</li>`);
            } else {
                // Close all lists on non-list lines (unless it's just a blank line)
                if (line.trim() !== '') {
                    this.closeAllLists(listStack, result);
                }
                result.push(line);
            }
        }
        
        // Close any remaining open lists
        this.closeAllLists(listStack, result);
        
        return result.join('\n');
    }
    
    // Analyze indentation patterns across the entire document to establish hierarchy levels
    analyzeIndentationLevels(lines) {
        const indentCounts = new Map();
        
        // Collect all indentation levels used in the document
        for (const line of lines) {
            const listMatch = line.match(/^(\s*)([-*+]|\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdm]+[\.\)]|[IVXLCDM]+[\.\)])\s+/i);
            if (listMatch) {
                const indent = listMatch[1].length;
                indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
            }
        }
        
        // Sort indentation levels to establish hierarchy
        const sortedIndents = Array.from(indentCounts.keys()).sort((a, b) => a - b);
        
        // Create mapping from indentation to nesting level
        const levelMap = new Map();
        sortedIndents.forEach((indent, index) => {
            levelMap.set(indent, index);
        });
        
        return levelMap;
    }
    
    // Calculate nesting level based on indentation and document patterns
    calculateNestingLevel(indent, indentLevels) {
        // If we have analyzed levels, use them
        if (indentLevels.has(indent)) {
            return indentLevels.get(indent);
        }
        
        // Find closest indentation level
        let closestIndent = 0;
        let closestLevel = 0;
        
        for (const [levelIndent, level] of indentLevels) {
            if (levelIndent <= indent && levelIndent > closestIndent) {
                closestIndent = levelIndent;
                closestLevel = level;
            }
        }
        
        // If current indent is greater than any known level, it's a new deeper level
        if (indent > closestIndent) {
            return closestLevel + Math.floor((indent - closestIndent) / 4);
        }
        
        return closestLevel;
    }
    
    // Adjust the list stack to match the target nesting level
    adjustListStack(listStack, result, targetLevel, listType) {
        // Close lists that are deeper than target level
        while (listStack.length > targetLevel) {
            const closedList = listStack.pop();
            result.push(`</${closedList.type}>`);
        }
        
        // Open new lists to reach target level
        while (listStack.length < targetLevel) {
            // For intermediate levels, inherit type from context or default to ul
            const newType = (listStack.length === targetLevel - 1) ? listType : 'ul';
            result.push(`<${newType}>`);
            listStack.push({ type: newType, level: listStack.length });
        }
        
        // If we're at the target level but need to change list type
        if (listStack.length === targetLevel && targetLevel > 0) {
            const currentList = listStack[listStack.length - 1];
            if (currentList.type !== listType) {
                // Close current list and open new one with correct type
                const closedList = listStack.pop();
                result.push(`</${closedList.type}>`);
                result.push(`<${listType}>`);
                listStack.push({ type: listType, level: targetLevel - 1 });
            }
        }
        
        // If we're at level 0, open the first list
        if (listStack.length === 0) {
            result.push(`<${listType}>`);
            listStack.push({ type: listType, level: 0 });
        }
    }
    
    // Close all open lists
    closeAllLists(listStack, result) {
        while (listStack.length > 0) {
            const closedList = listStack.pop();
            result.push(`</${closedList.type}>`);
        }
    }

    // Smart detection to distinguish real lists from text with periods (like names)
    isActualListItem(lines, currentIndex, marker, indent) {
        // For unordered lists (-, *, +), always treat as list items
        if (/^[-*+]$/.test(marker)) {
            return true;
        }
        
        // For ordered lists and letters, we need more context
        const currentLine = lines[currentIndex];
        
        // Check if this looks like a name or abbreviation
        const content = currentLine.substring(currentLine.indexOf(marker) + marker.length).trim();
        
        // If content looks like a name (starts with capital letter and contains more capitals)
        // Example: "B. Spielberger" or "Dr. Smith"
        if (/^[A-Z][a-z]*\s+[A-Z]/.test(content) || /^[A-Z][a-z]*\.$/.test(content)) {
            return false;
        }
        
        // Look for list context - check previous and next lines for similar patterns
        const listContext = this.checkListContext(lines, currentIndex, marker, indent);
        
        // If we found list context, it's likely a real list
        if (listContext.hasContext) {
            return true;
        }
        
        // Special case: single letter followed by period might be a list if:
        // 1. It's at the beginning of a paragraph/section
        // 2. There are multiple similar items nearby
        // 3. The content doesn't look like a name
        
        // Check if marker is a single letter/number with period
        if (/^[a-zA-Z0-9][\.\)]$/.test(marker)) {
            // Look for sequential markers (A. B. C. or 1. 2. 3.)
            const hasSequentialContext = this.hasSequentialMarkers(lines, currentIndex, marker, indent);
            
            if (hasSequentialContext) {
                return true;
            }
            
            // If no sequential context and content looks like a name/title, don't treat as list
            if (/^[A-Z]/.test(content) && (content.includes(' ') || content.length < 20)) {
                return false;
            }
        }
        
        // Default: if we're not sure, check if there are multiple potential list items nearby
        return listContext.nearbyItems >= 2;
    }
    
    // Check for list context around the current line
    checkListContext(lines, currentIndex, marker, indent) {
        let nearbyItems = 0;
        let hasContext = false;
        
        // Check 3 lines before and after for similar list patterns
        const checkRange = 3;
        
        for (let i = Math.max(0, currentIndex - checkRange); 
             i <= Math.min(lines.length - 1, currentIndex + checkRange); 
             i++) {
            
            if (i === currentIndex) continue;
            
            const line = lines[i];
            const listMatch = line.match(/^(\s*)([-*+]|\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)])\s+(.*)$/);
            
            if (listMatch) {
                const otherIndent = listMatch[1].length;
                const otherMarker = listMatch[2];
                
                // Same indentation level
                if (Math.abs(otherIndent - indent) <= 2) {
                    nearbyItems++;
                    
                    // Check for sequential or similar markers
                    if (this.areRelatedMarkers(marker, otherMarker)) {
                        hasContext = true;
                    }
                }
            }
        }
        
        return { hasContext, nearbyItems };
    }
    
    // Check if markers are related (sequential or same type)
    areRelatedMarkers(marker1, marker2) {
        // Same type of unordered marker
        if (/^[-*+]$/.test(marker1) && /^[-*+]$/.test(marker2)) {
            return true;
        }
        
        // Both are numbers with same format
        if (/^\d+[\.\)]$/.test(marker1) && /^\d+[\.\)]$/.test(marker2)) {
            return true;
        }
        
        // Both are letters with same format
        if (/^[a-zA-Z][\.\)]$/.test(marker1) && /^[a-zA-Z][\.\)]$/.test(marker2)) {
            return true;
        }
        
        return false;
    }
    
    // Check for complete sequential markers - verify full alphabetical or numerical chain
    hasSequentialMarkers(lines, currentIndex, marker, indent) {
        const baseChar = marker.replace(/[\.\)]$/, '');
        
        // For alphabetical markers, verify complete sequence from A to current letter
        if (/^[a-zA-Z]$/.test(baseChar)) {
            return this.verifyAlphabeticalSequence(lines, currentIndex, baseChar, indent);
        }
        
        // For numerical markers, verify sequence from 1 to current number
        if (/^\d+$/.test(baseChar)) {
            return this.verifyNumericalSequence(lines, currentIndex, parseInt(baseChar), indent);
        }
        
        return false;
    }
    
    // Verify complete alphabetical sequence (A, B, C... up to current letter)
    verifyAlphabeticalSequence(lines, currentIndex, currentLetter, indent) {
        const currentCharCode = currentLetter.toLowerCase().charCodeAt(0);
        const startCharCode = 'a'.charCodeAt(0);
        
        // If it's just 'A' or 'a', no need to check previous - it's valid
        if (currentCharCode === startCharCode) {
            return true;
        }
        
        // Need to find all previous letters in sequence
        const requiredLetters = [];
        for (let i = startCharCode; i < currentCharCode; i++) {
            requiredLetters.push(String.fromCharCode(i));
        }
        
        // Track which required letters we've found
        const foundLetters = new Set();
        
        // Search backwards through all previous lines for the required sequence
        for (let i = currentIndex - 1; i >= 0; i--) {
            const line = lines[i];
            const listMatch = line.match(/^(\s*)([-*+]|\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)])\s+(.*)$/);
            
            if (listMatch) {
                const lineIndent = listMatch[1].length;
                const lineMarker = listMatch[2];
                
                // Check if this line is at the same indentation level (with small tolerance)
                if (Math.abs(lineIndent - indent) <= 2) {
                    const lineChar = lineMarker.replace(/[\.\)]$/, '');
                    
                    // If this is a letter we need, mark it as found
                    if (/^[a-zA-Z]$/.test(lineChar)) {
                        const normalizedChar = lineChar.toLowerCase();
                        if (requiredLetters.includes(normalizedChar)) {
                            foundLetters.add(normalizedChar);
                        }
                    }
                }
            }
            
            // If we found all required letters, this is a valid sequence
            if (foundLetters.size === requiredLetters.length) {
                return true;
            }
        }
        
        // If we didn't find all required letters, it's not a valid list sequence
        return false;
    }
    
    // Verify complete numerical sequence (1, 2, 3... up to current number)
    verifyNumericalSequence(lines, currentIndex, currentNumber, indent) {
        // If it's just 1, no need to check previous - it's valid
        if (currentNumber === 1) {
            return true;
        }
        
        // Need to find all previous numbers in sequence
        const requiredNumbers = [];
        for (let i = 1; i < currentNumber; i++) {
            requiredNumbers.push(i);
        }
        
        // Track which required numbers we've found
        const foundNumbers = new Set();
        
        // Search backwards through all previous lines for the required sequence
        for (let i = currentIndex - 1; i >= 0; i--) {
            const line = lines[i];
            const listMatch = line.match(/^(\s*)([-*+]|\d+[\.\)]|\([0-9]+\)|[a-zA-Z][\.\)])\s+(.*)$/);
            
            if (listMatch) {
                const lineIndent = listMatch[1].length;
                const lineMarker = listMatch[2];
                
                // Check if this line is at the same indentation level (with small tolerance)
                if (Math.abs(lineIndent - indent) <= 2) {
                    const lineNumber = lineMarker.replace(/[\.\)]$/, '');
                    
                    // If this is a number we need, mark it as found
                    if (/^\d+$/.test(lineNumber)) {
                        const num = parseInt(lineNumber);
                        if (requiredNumbers.includes(num)) {
                            foundNumbers.add(num);
                        }
                    }
                }
            }
            
            // If we found all required numbers, this is a valid sequence
            if (foundNumbers.size === requiredNumbers.length) {
                return true;
            }
        }
        
        // If we didn't find all required numbers, it's not a valid list sequence
        return false;
    }
    
    // Check if two markers are sequential
    isSequential(first, second) {
        // Numeric sequence
        if (/^\d+$/.test(first) && /^\d+$/.test(second)) {
            return parseInt(second) === parseInt(first) + 1;
        }
        
        // Alphabetic sequence
        if (/^[a-zA-Z]$/.test(first) && /^[a-zA-Z]$/.test(second)) {
            return second.charCodeAt(0) === first.charCodeAt(0) + 1;
        }
        
        return false;
    }

    // Process horizontal rules
    processHorizontalRules(text) {
        // Various horizontal rule formats
        text = text.replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>');
        return text;
    }

    // Process links and images
    processLinksAndImages(text) {
        // Images first (to avoid conflicts with links)
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Auto-links
        text = text.replace(/(?<!["'>])\bhttps?:\/\/[^\s<>]+/g, '<a href="$&">$&</a>');
        
        return text;
    }

    // Restore protected code blocks
    restoreCodeBlocks(text, codeBlocks, inlineCode) {
        // Restore code blocks
        for (let i = 0; i < codeBlocks.length; i++) {
            text = text.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
        }
        
        // Restore inline code
        for (let i = 0; i < inlineCode.length; i++) {
            text = text.replace(`__INLINE_CODE_${i}__`, inlineCode[i]);
        }
        
        return text;
    }

    // Process paragraphs and line breaks
    processParagraphs(text) {
        // Split into blocks
        const blocks = text.split(/\n\s*\n/);
        const processedBlocks = [];
        
        for (let block of blocks) {
            block = block.trim();
            if (!block) continue;

            // NEW: If a header is followed by inline text in the same block,
            // split them so the text becomes a real paragraph.
            const headerWithText = block.match(/^(\s*<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)\s*([\s\S]+)$/i);
            if (headerWithText) {
                processedBlocks.push(headerWithText[1]); // keep the <h1>…</h1> as-is
                let after = headerWithText[2].trim();
                if (after) {
                    // If what's after is already a block element, keep it;
                    // otherwise, wrap it as a paragraph (preserving manual line breaks).
                    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|div)/i.test(after) ||
                        /(<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>|<\/pre>|<hr>|<\/div>)$/i.test(after)) {
                        processedBlocks.push(after);
                    } else {
                        after = after.replace(/\n/g, '<br>');
                        processedBlocks.push(`<p>${after}</p>`);
                    }
                }
                continue; // done with this block
            }
            
            // Don't wrap block elements in paragraphs
            if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|div)/i.test(block) ||
                /(<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>|<\/pre>|<hr>|<\/div>)$/i.test(block)) {
                processedBlocks.push(block);
            } else {
                // Convert single line breaks to <br> within paragraphs
                block = block.replace(/\n/g, '<br>');
                processedBlocks.push(`<p>${block}</p>`);
            }
        }
        
        // Join blocks without introducing empty lines between paragraphs
        return processedBlocks.join('\n'); // (keeps your no-empty-lines guarantee)
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}