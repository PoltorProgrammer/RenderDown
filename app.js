// Markdown Display Tester - Main Application Logic
class MarkdownTester {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.fileName = document.getElementById('fileName');
        this.renderedContent = document.getElementById('renderedContent');
        this.markdownParser = new MarkdownParser();
        
        this.initializeEventListeners();
        this.tryAutoLoad();
    }

    initializeEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        
        // Optional: Add drag and drop support
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const dropZone = this.renderedContent;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    }

    async tryAutoLoad() {
        // Try to automatically load the critical fields file if it's in the same directory
        const possibleFileNames = [
            '[document_to_display_name].txt',  // Fixed filename
            'example.txt',
            'critical.txt',
            'sample.txt'
        ];

        for (const fileName of possibleFileNames) {
            try {
                console.log(`Trying to load: ${fileName}`);
                const response = await fetch(fileName);
                
                if (response.ok) {
                    const content = await response.text();
                    console.log(`Successfully loaded: ${fileName}`);
                    
                    // Update display
                    this.fileName.textContent = `${fileName} (auto-loaded)`;
                    const htmlContent = this.markdownParser.convertMarkdownToHTML(content);
                    this.renderedContent.innerHTML = htmlContent;
                    return; // Success, stop trying other files
                }
            } catch (error) {
                // File not found or not accessible, continue to next file
                console.log(`Could not load ${fileName}:`, error.message);
            }
        }
        
        // If no files could be auto-loaded, show instruction
        this.showAutoLoadInstructions();
    }

    showAutoLoadInstructions() {
        this.renderedContent.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-info-circle"></i>
                <h4>Auto-Load Instructions</h4>
                <p><strong>To automatically load your file:</strong></p>
                <ol style="text-align: left; margin-top: 15px;">
                    <li>Copy your <code>[document_to_display_name].txt</code> file</li>
                    <li>Paste it in the same folder as this HTML file</li>
                    <li>Refresh this page</li>
                </ol>
                <p style="margin-top: 15px;"><strong>Or:</strong> Use the file selector below to manually choose any file.</p>
                <p style="margin-top: 10px; font-size: 0.8rem; color: #9CA3AF;">You can also drag and drop files directly here!</p>
            </div>
        `;
    }

    async handleFileSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.fileName.textContent = 'No file selected';
            this.showPlaceholder();
            return;
        }

        await this.processFile(file);
    }

    async processFile(file) {
        // Validate file type
        if (!this.isValidFileType(file)) {
            this.showError('Invalid file type. Please select a .txt or .md file.');
            return;
        }

        // Update file name display
        this.fileName.textContent = file.name;

        try {
            // Show loading state
            this.showLoading();
            
            // Read file content
            const content = await this.readFile(file);
            
            // Convert and display using markdown parser
            const htmlContent = this.markdownParser.convertMarkdownToHTML(content);
            this.renderedContent.innerHTML = htmlContent;
            
        } catch (error) {
            console.error('Error reading file:', error);
            this.showError(`Could not read the selected file: ${error.message}`);
        }
    }

    isValidFileType(file) {
        const validTypes = ['.txt', '.md', '.markdown'];
        const fileName = file.name.toLowerCase();
        return validTypes.some(type => fileName.endsWith(type)) || 
               file.type === 'text/plain' || 
               file.type === 'text/markdown';
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file, 'UTF-8');
        });
    }

    showLoading() {
        this.renderedContent.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-spinner"></i>
                <h4>Loading File...</h4>
                <p>Processing markdown content...</p>
            </div>
        `;
    }

    showError(message) {
        this.renderedContent.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }

    showPlaceholder() {
        this.renderedContent.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-file-text"></i>
                <h4>No File Selected</h4>
                <p>Select a markdown file to see how it's rendered..</p>
                <p style="margin-top: 10px; font-size: 0.8rem; color: #9CA3AF;">Drag and drop files here or use the file selector above.</p>
            </div>
        `;
    }

    // Public method to manually load content (useful for testing)
    loadContent(markdownContent) {
        const htmlContent = this.markdownParser.convertMarkdownToHTML(markdownContent);
        this.renderedContent.innerHTML = htmlContent;
        this.fileName.textContent = 'Manual content';
    }

    // Public method to get current HTML content
    getCurrentHTML() {
        return this.renderedContent.innerHTML;
    }

    // Public method to export current content
    exportHTML() {
        const html = this.getCurrentHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported-content.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the tester when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance for easy access in console
    window.markdownTester = new MarkdownTester();
    
    // Optional: Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + O to open file dialog
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('fileInput').click();
        }
        
        // Ctrl/Cmd + S to export HTML
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            window.markdownTester.exportHTML();
        }
    });
});