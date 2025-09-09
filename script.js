class JSONLVisualizer {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.allKeys = new Set();
        this.currentView = 'table';
        this.currentTheme = 'light';
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTheme();
        
        // Set initial view mode
        this.viewMode.value = 'table';
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.textInputArea = document.getElementById('textInputArea');
        this.textInput = document.getElementById('textInput');
        this.fileTab = document.getElementById('fileTab');
        this.textTab = document.getElementById('textTab');
        this.processTextBtn = document.getElementById('processTextBtn');
        this.clearTextBtn = document.getElementById('clearTextBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        
        this.controls = document.getElementById('controls');
        this.stats = document.getElementById('stats');
        this.content = document.getElementById('content');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        this.viewMode = document.getElementById('viewMode');
        this.searchInput = document.getElementById('searchInput');
        this.filterKey = document.getElementById('filterKey');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.tableView = document.getElementById('tableView');
        this.treeView = document.getElementById('treeView');
        this.jsonView = document.getElementById('jsonView');
        this.rawView = document.getElementById('rawView');
        
        this.totalRecords = document.getElementById('totalRecords');
        this.fileSize = document.getElementById('fileSize');
        this.filteredRecords = document.getElementById('filteredRecords');
    }

    attachEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Tab switching events
        this.fileTab.addEventListener('click', () => this.switchTab('file'));
        this.textTab.addEventListener('click', () => this.switchTab('text'));
        
        // Text input events
        this.processTextBtn.addEventListener('click', this.handleTextProcess.bind(this));
        this.clearTextBtn.addEventListener('click', this.handleTextClear.bind(this));
        this.textInput.addEventListener('keydown', this.handleTextKeydown.bind(this));
        
        // Theme toggle event
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        
        // Control events
        this.viewMode.addEventListener('change', this.handleViewModeChange.bind(this));
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.filterKey.addEventListener('change', this.handleFilterChange.bind(this));
        this.exportBtn.addEventListener('click', this.exportData.bind(this));
        this.clearBtn.addEventListener('click', this.clearData.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    switchTab(tab) {
        if (tab === 'file') {
            this.fileTab.classList.add('active');
            this.textTab.classList.remove('active');
            this.uploadArea.style.display = 'block';
            this.textInputArea.style.display = 'none';
        } else {
            this.textTab.classList.add('active');
            this.fileTab.classList.remove('active');
            this.uploadArea.style.display = 'none';
            this.textInputArea.style.display = 'block';
        }
    }

    handleTextProcess() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('Please enter some JSONL content');
            return;
        }
        
        try {
            this.hideError();
            this.parseJSONL(text);
            this.updateStats(text.length);
            this.showControls();
            this.showStats();
            this.showContent();
            this.renderData();
        } catch (error) {
            this.showError(`Error processing text: ${error.message}`);
        }
    }

    handleTextClear() {
        this.textInput.value = '';
        this.textInput.focus();
    }

    handleTextKeydown(e) {
        // Ctrl+Enter or Cmd+Enter to process text
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.handleTextProcess();
        }
    }

    initializeTheme() {
        // Get saved theme from localStorage or default to light
        const savedTheme = localStorage.getItem('jsonl-visualizer-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
        this.saveTheme();
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme icon
        if (theme === 'dark') {
            this.themeIcon.className = 'fas fa-sun';
            this.themeToggle.title = 'Switch to light theme';
        } else {
            this.themeIcon.className = 'fas fa-moon';
            this.themeToggle.title = 'Switch to dark theme';
        }
    }

    saveTheme() {
        localStorage.setItem('jsonl-visualizer-theme', this.currentTheme);
    }

    async processFile(file) {
        try {
            this.hideError();
            this.showLoading();
            
            const text = await this.readFileAsText(file);
            this.parseJSONL(text);
            this.updateStats(file.size);
            this.showControls();
            this.showStats();
            this.showContent();
            this.renderData();
            
            // Reset upload area after successful processing
            this.resetUploadArea();
            
        } catch (error) {
            this.showError(`Error processing file: ${error.message}`);
            this.resetUploadArea();
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseJSONL(text) {
        this.data = [];
        this.allKeys.clear();
        
        const lines = text.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length; i++) {
            try {
                const jsonObj = JSON.parse(lines[i]);
                this.data.push(jsonObj);
                this.extractKeys(jsonObj);
            } catch (error) {
                console.warn(`Error parsing line ${i + 1}:`, error.message);
            }
        }
        
        this.filteredData = [...this.data];
        this.updateFilterOptions();
    }

    extractKeys(obj, prefix = '') {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                this.allKeys.add(fullKey);
                
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    this.extractKeys(obj[key], fullKey);
                }
            }
        }
    }

    updateFilterOptions() {
        this.filterKey.innerHTML = '<option value="">All keys</option>';
        Array.from(this.allKeys).sort().forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            this.filterKey.appendChild(option);
        });
    }

    handleViewModeChange() {
        this.currentView = this.viewMode.value;
        this.renderData();
    }

    handleSearch() {
        const query = this.searchInput.value.toLowerCase();
        this.filteredData = this.data.filter(item => 
            this.searchInObject(item, query)
        );
        this.renderData();
        this.updateFilteredStats();
    }

    searchInObject(obj, query) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string' && value.toLowerCase().includes(query)) {
                    return true;
                } else if (typeof value === 'object' && value !== null) {
                    if (this.searchInObject(value, query)) {
                        return true;
                    }
                } else if (String(value).toLowerCase().includes(query)) {
                    return true;
                }
            }
        }
        return false;
    }

    handleFilterChange() {
        const selectedKey = this.filterKey.value;
        if (!selectedKey) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(item => 
                this.hasKey(item, selectedKey)
            );
        }
        this.renderData();
        this.updateFilteredStats();
    }

    hasKey(obj, keyPath) {
        const keys = keyPath.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
                current = current[key];
            } else {
                return false;
            }
        }
        return true;
    }

    renderData() {
        // Hide all views first
        this.tableView.style.display = 'none';
        this.treeView.style.display = 'none';
        this.jsonView.style.display = 'none';
        this.rawView.style.display = 'none';
        
        switch (this.currentView) {
            case 'table':
                this.tableView.style.display = 'block';
                this.renderTableView();
                break;
            case 'tree':
                this.treeView.style.display = 'block';
                this.renderTreeView();
                break;
            case 'json':
                this.jsonView.style.display = 'block';
                this.renderJsonView();
                break;
            case 'raw':
                this.rawView.style.display = 'block';
                this.renderRawView();
                break;
        }
    }

    renderTableView() {
        if (this.filteredData.length === 0) {
            this.tableView.innerHTML = '<p>No data to display</p>';
            return;
        }

        const allKeys = this.getAllKeysFromData(this.filteredData);
        let html = '<div class="table-container"><table><thead><tr>';
        
        allKeys.forEach(key => {
            html += `<th>${this.escapeHtml(key)}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        this.filteredData.forEach((item, index) => {
            html += `<tr>`;
            allKeys.forEach(key => {
                const value = this.getNestedValue(item, key);
                html += `<td>${this.formatCellValue(value)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        this.tableView.innerHTML = html;
    }

    renderTreeView() {
        if (this.filteredData.length === 0) {
            this.treeView.innerHTML = '<p>No data to display</p>';
            return;
        }

        let html = '<div class="tree-container">';
        this.filteredData.forEach((item, index) => {
            html += `<div class="tree-item"><h4>Record ${index + 1}</h4>`;
            html += this.renderObjectAsTree(item);
            html += '</div><hr>';
        });
        html += '</div>';
        
        this.treeView.innerHTML = html;
    }

    renderJsonView() {
        if (this.filteredData.length === 0) {
            this.jsonView.innerHTML = '<p>No data to display</p>';
            return;
        }

        let html = '<div class="json-container">';
        this.filteredData.forEach((item, index) => {
            html += `<div class="json-item">`;
            html += `<div class="json-item-header">Record ${index + 1}</div>`;
            html += this.highlightJson(JSON.stringify(item, null, 2));
            html += `</div>`;
            if (index < this.filteredData.length - 1) {
                html += '<hr style="margin: 20px 0; border: none; border-top: 1px solid #e1e5e9;">';
            }
        });
        html += '</div>';
        
        this.jsonView.innerHTML = html;
    }

    highlightJson(jsonString) {
        return jsonString
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + this.escapeHtml(match) + '</span>';
            })
            .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>')
            .replace(/(,)/g, '<span class="json-comma">$1</span>')
            .replace(/(:)/g, '<span class="json-colon">$1</span>');
    }

    renderRawView() {
        if (this.filteredData.length === 0) {
            this.rawView.innerHTML = '<p>No data to display</p>';
            return;
        }

        const jsonString = JSON.stringify(this.filteredData, null, 2);
        this.rawView.innerHTML = `<div class="raw-container">${this.escapeHtml(jsonString)}</div>`;
    }

    renderObjectAsTree(obj, level = 0) {
        let html = '';
        const indent = '  '.repeat(level);
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                html += `<div class="tree-node" style="margin-left: ${level * 20}px">`;
                html += `<span class="tree-key">${this.escapeHtml(key)}</span>: `;
                html += this.renderValueAsTree(value, level + 1);
                html += '</div>';
            }
        }
        
        return html;
    }

    renderValueAsTree(value, level) {
        if (value === null) {
            return '<span class="tree-null">null</span>';
        } else if (typeof value === 'boolean') {
            return `<span class="tree-boolean">${value}</span>`;
        } else if (typeof value === 'number') {
            return `<span class="tree-number">${value}</span>`;
        } else if (typeof value === 'string') {
            return `<span class="tree-string">"${this.escapeHtml(value)}"</span>`;
        } else if (Array.isArray(value)) {
            let html = '<span class="tree-array">[</span><br>';
            value.forEach((item, index) => {
                html += `<div style="margin-left: ${level * 20}px">`;
                html += this.renderValueAsTree(item, level + 1);
                if (index < value.length - 1) html += ',';
                html += '</div>';
            });
            html += `<div style="margin-left: ${(level - 1) * 20}px">]</div>`;
            return html;
        } else if (typeof value === 'object') {
            let html = '<span class="tree-object">{</span><br>';
            html += this.renderObjectAsTree(value, level);
            html += `<div style="margin-left: ${(level - 1) * 20}px">}</div>`;
            return html;
        }
        return this.escapeHtml(String(value));
    }

    getAllKeysFromData(data) {
        // Use the already extracted keys from this.allKeys
        return Array.from(this.allKeys).sort();
    }

    getNestedValue(obj, keyPath) {
        const keys = keyPath.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
                current = current[key];
            } else {
                return null;
            }
        }
        return current;
    }

    formatCellValue(value) {
        if (value === null || value === undefined) {
            return '<span style="color: #6c757d; font-style: italic;">null</span>';
        } else if (typeof value === 'object') {
            return `<span style="color: #667eea;">${this.escapeHtml(JSON.stringify(value))}</span>`;
        } else if (typeof value === 'string') {
            return `<span style="color: #28a745;">"${this.escapeHtml(value)}"</span>`;
        } else if (typeof value === 'number') {
            return `<span style="color: #fd7e14;">${value}</span>`;
        } else if (typeof value === 'boolean') {
            return `<span style="color: #dc3545;">${value}</span>`;
        }
        return this.escapeHtml(String(value));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats(fileSize) {
        this.totalRecords.textContent = this.data.length;
        this.fileSize.textContent = this.formatFileSize(fileSize);
        this.updateFilteredStats();
    }

    updateFilteredStats() {
        this.filteredRecords.textContent = this.filteredData.length;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    exportData() {
        if (this.filteredData.length === 0) {
            this.showError('No data to export');
            return;
        }

        const dataStr = JSON.stringify(this.filteredData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'exported_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    clearData() {
        this.data = [];
        this.filteredData = [];
        this.allKeys.clear();
        
        this.fileInput.value = '';
        this.textInput.value = '';
        this.searchInput.value = '';
        this.filterKey.innerHTML = '<option value="">All keys</option>';
        this.viewMode.value = 'table';
        
        this.hideControls();
        this.hideStats();
        this.hideContent();
        this.hideError();
    }

    showLoading() {
        this.uploadArea.innerHTML = '<div class="loading"></div><p>Processing file...</p>';
    }

    resetUploadArea() {
        this.uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Drop your JSONL file here</h3>
            <p>or click to browse</p>
        `;
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showControls() {
        this.controls.style.display = 'flex';
    }

    hideControls() {
        this.controls.style.display = 'none';
    }

    showStats() {
        this.stats.style.display = 'flex';
    }

    hideStats() {
        this.stats.style.display = 'none';
    }

    showContent() {
        this.content.style.display = 'block';
    }

    hideContent() {
        this.content.style.display = 'none';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONLVisualizer();
});
