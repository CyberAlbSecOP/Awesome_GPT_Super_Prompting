// Advanced Prompt Arsenal Dashboard - Static Version
class PromptArsenal {
    constructor() {
        this.currentView = 'dashboard';
        this.currentFolder = null;
        this.selectedFile = null;
        this.isMobile = window.innerWidth <= 768;
        this.sidebarOpen = false;
        this.searchQuery = '';
        this.sortBy = 'name';
        this.folderFilter = '';
        this.allFiles = [];
        this.filteredFiles = [];
        this.fileContents = new Map();

        this.init();
    }

    async init() {
        this.bindEvents();
        this.handleResize();
        await this.loadFileStructure();
        this.updateStats();
        this.renderCurrentView();
    }

    bindEvents() {
        // Navigation events
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // View control buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileOverlay = document.getElementById('mobileOverlay');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => this.closeMobileSidebar());
        }

        // Search functionality
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterAndRenderFiles();
            }, 300));
        }

        // Filter controls
        const folderFilter = document.getElementById('folderFilter');
        const sortBy = document.getElementById('sortBy');

        if (folderFilter) {
            folderFilter.addEventListener('change', (e) => {
                this.folderFilter = e.target.value;
                this.filterAndRenderFiles();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndRenderFiles();
            });
        }

        // Quick action buttons
        const quickBtns = document.querySelectorAll('.quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Action buttons
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Modal events
        const fileModal = document.getElementById('fileModal');
        const modalClose = document.getElementById('modalClose');
        const copyContent = document.getElementById('copyContent');
        const downloadFile = document.getElementById('downloadFile');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (copyContent) {
            copyContent.addEventListener('click', () => this.copyFileContent());
        }

        if (downloadFile) {
            downloadFile.addEventListener('click', () => this.downloadCurrentFile());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeMobileSidebar();
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') {
                    e.preventDefault();
                    document.getElementById('globalSearch')?.focus();
                }
                if (e.key === 'r') {
                    e.preventDefault();
                    this.refresh();
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    async loadFileStructure() {
        this.showLoading(true);

        try {
            console.log('Loading file structure from static files...');
            const response = await fetch('./files.json');

            if (response.ok) {
                const data = await response.json();
                this.allFiles = Array.isArray(data) ? data : [];
                console.log(`Loaded ${this.allFiles.length} files from static data`);

                if (this.allFiles.length === 0) {
                    console.warn('No files found in static data');
                    this.showNotification('No markdown files found', 'warning');
                }
            } else {
                console.error('Failed to load static file data:', response.status);
                this.allFiles = [];
                this.showNotification(`Error loading file data: ${response.status}`, 'error');
            }

            this.populateFolderFilter();
            this.populateFolderNavigation();
            this.filteredFiles = [...this.allFiles];

        } catch (error) {
            console.error('Error loading file structure:', error);
            this.allFiles = [];
            this.filteredFiles = [];
            this.showNotification('Error loading file data', 'error');
        }

        this.showLoading(false);
    }

    populateFolderFilter() {
        const folderFilter = document.getElementById('folderFilter');
        if (!folderFilter) return;

        const folders = [...new Set(this.allFiles.map(file => file.folder))];
        folderFilter.innerHTML = '<option value="">All Folders</option>';

        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            folderFilter.appendChild(option);
        });
    }

    populateFolderNavigation() {
        const folderNav = document.getElementById('folderNav');
        if (!folderNav) return;

        const folders = [...new Set(this.allFiles.map(file => file.folder))];
        folderNav.innerHTML = '';

        folders.forEach(folder => {
            const fileCount = this.allFiles.filter(file => file.folder === folder).length;
            const li = document.createElement('li');
            li.className = 'nav-item folder-nav-item';
            li.dataset.folder = folder;
            li.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${folder}</span>
                <span class="file-count">${fileCount}</span>
            `;

            li.addEventListener('click', () => {
                this.currentFolder = folder;
                this.folderFilter = folder;
                document.getElementById('folderFilter').value = folder;
                this.switchView('grid');
                this.filterAndRenderFiles();
            });

            folderNav.appendChild(li);
        });
    }

    switchView(view) {
        // Update active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update active view sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${view}View`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentView = view;
        this.updatePageTitle(view);
        this.renderCurrentView();
        this.closeMobileSidebar();
    }

    updatePageTitle(view) {
        const titles = {
            dashboard: 'Dashboard',
            grid: 'Grid View',
            list: 'List View',
            tree: 'Tree View'
        };

        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');

        if (pageTitle) pageTitle.textContent = titles[view] || 'Dashboard';
        if (pageSubtitle) {
            if (this.currentFolder) {
                pageSubtitle.textContent = `Viewing ${this.currentFolder} folder`;
            } else {
                pageSubtitle.textContent = 'Advanced file browser and prompt manager';
            }
        }
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'grid':
                this.renderGridView();
                break;
            case 'list':
                this.renderListView();
                break;
            case 'tree':
                this.renderTreeView();
                break;
        }
    }

    renderDashboard() {
        this.updateStats();
        this.renderFolderChart();
    }

    updateStats() {
        const folders = [...new Set(this.allFiles.map(file => file.folder))];

        document.getElementById('totalFiles').textContent = this.allFiles.length;
        document.getElementById('totalFolders').textContent = folders.length;

        // Update category counts
        document.getElementById('jailbreaksCount').textContent = 
            this.allFiles.filter(f => f.folder === 'Latest Jailbreaks').length;
        document.getElementById('legendaryCount').textContent = 
            this.allFiles.filter(f => f.folder === 'Legendary Leaks').length;
        document.getElementById('securityCount').textContent = 
            this.allFiles.filter(f => f.folder === 'Prompt Security').length;
        document.getElementById('ultraCount').textContent = 
            this.allFiles.filter(f => f.folder === 'Ultra Prompts').length;
    }

    renderFolderChart() {
        const folderChart = document.getElementById('folderChart');
        if (!folderChart) return;

        const folders = [...new Set(this.allFiles.map(file => file.folder))];
        folderChart.innerHTML = '';

        folders.forEach(folder => {
            const count = this.allFiles.filter(f => f.folder === folder).length;
            const percentage = (count / this.allFiles.length * 100).toFixed(1);

            const item = document.createElement('div');
            item.className = 'chart-item';
            item.innerHTML = `
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-label">
                    <span>${folder}</span>
                    <span>${count} files (${percentage}%)</span>
                </div>
            `;

            folderChart.appendChild(item);
        });
    }

    filterAndRenderFiles() {
        this.filteredFiles = this.allFiles.filter(file => {
            const matchesSearch = !this.searchQuery || 
                file.name.toLowerCase().includes(this.searchQuery) ||
                file.folder.toLowerCase().includes(this.searchQuery);

            const matchesFolder = !this.folderFilter || file.folder === this.folderFilter;

            return matchesSearch && matchesFolder;
        });

        // Sort files
        this.filteredFiles.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'folder':
                    return a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });

        this.renderCurrentView();
    }

    renderGridView() {
        const filesGrid = document.getElementById('filesGrid');
        if (!filesGrid) return;

        if (this.filteredFiles.length === 0) {
            filesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No files found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        filesGrid.innerHTML = this.filteredFiles.map(file => `
            <div class="file-card" data-file="${file.relativePath}">
                <div class="file-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="file-info">
                    <h3 class="file-name">${file.name.replace('.md', '')}</h3>
                    <p class="file-folder">${file.folder}</p>
                    <div class="file-meta">
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <span class="file-date">${this.formatDate(file.lastModified)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click events
        filesGrid.querySelectorAll('.file-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const filePath = e.currentTarget.dataset.file;
                this.openFile(filePath);
            });
        });
    }

    renderListView() {
        const filesList = document.getElementById('filesList');
        if (!filesList) return;

        if (this.filteredFiles.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No files found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        filesList.innerHTML = this.filteredFiles.map(file => `
            <div class="list-row" data-file="${file.relativePath}">
                <div class="col-name">
                    <i class="fas fa-file-alt"></i>
                    <span>${file.name}</span>
                </div>
                <div class="col-folder">${file.folder}</div>
                <div class="col-size">${this.formatFileSize(file.size)}</div>
                <div class="col-actions">
                    <button class="action-btn" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click events
        filesList.querySelectorAll('.list-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const filePath = e.currentTarget.dataset.file;
                this.openFile(filePath);
            });
        });
    }

    renderTreeView() {
        const treeStructure = document.getElementById('treeStructure');
        if (!treeStructure) return;

        const folders = [...new Set(this.filteredFiles.map(file => file.folder))];

        treeStructure.innerHTML = folders.map(folder => {
            const folderFiles = this.filteredFiles.filter(f => f.folder === folder);
            return `
                <div class="tree-folder">
                    <div class="folder-header" onclick="toggleTreeFolder('${folder}')">
                        <i class="fas fa-chevron-down"></i>
                        <i class="fas fa-folder"></i>
                        <span>${folder}</span>
                        <span class="file-count">(${folderFiles.length})</span>
                    </div>
                    <div class="folder-files" id="tree-${folder}">
                        ${folderFiles.map(file => `
                            <div class="tree-file" data-file="${file.relativePath}">
                                <i class="fas fa-file-alt"></i>
                                <span>${file.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Add click events to files
        treeStructure.querySelectorAll('.tree-file').forEach(fileEl => {
            fileEl.addEventListener('click', async (e) => {
                const filePath = e.currentTarget.dataset.file;
                await this.showFilePreview(filePath);
            });
        });
    }

    async openFile(filePath) {
        this.selectedFile = filePath;
        this.showLoading(true);

        try {
            let content = this.fileContents.get(filePath);

            if (!content) {
                try {
                    console.log('Loading file:', filePath);
                    const safePath = filePath
                        .replace(/[\/\\]/g, '__')
                        .replace(/[\[\]()]/g, '_')  // Replace brackets and parentheses
                        .replace(/[<>:"|?*]/g, '_') // Replace other problematic characters
                        .replace(/\s+/g, '_')       // Replace spaces with underscores
                        .replace(/_+/g, '_')        // Replace multiple underscores with single
                        .replace('.md', '.txt');
                    console.log('Fetching from:', `./content/${safePath}`);
                    const response = await fetch(`./content/${safePath}`);

                    if (response.ok) {
                        content = await response.text();
                        console.log('File loaded successfully:', filePath);
                        this.fileContents.set(filePath, content);
                    } else {
                        console.error('Error loading file:', response.status, 'Path:', `./content/${safePath}`);
                        content = `Error loading file: ${response.status}\nTried to load: ./content/${safePath}`;
                        this.showNotification(`Failed to load file: ${response.status}`, 'error');
                    }
                } catch (error) {
                    console.error('Error fetching file:', error);
                    content = `Network error loading file: ${error.message}`;
                    this.showNotification('Network error loading file', 'error');
                }
            }

            this.showModal(filePath, content);

        } catch (error) {
            console.error('Error loading file:', error);
            this.showModal(filePath, 'Error loading file content: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showModal(filePath, content) {
        const modal = document.getElementById('fileModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalFilePath = document.getElementById('modalFilePath');
        const modalContentArea = document.getElementById('modalContentArea');

        const fileName = filePath.split('/').pop();
        modalTitle.textContent = fileName.replace('.md', '');
        modalFilePath.textContent = filePath;
        modalContentArea.innerHTML = this.markdownToHtml(content);

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('fileModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async showFilePreview(filePath) {
        const filePreview = document.getElementById('filePreview');
        if (!filePreview) return;

        const fileName = filePath.split('/').pop();
        let content = this.fileContents.get(filePath);

        if (!content) {
            try {
                const safePath = filePath
                    .replace(/[\/\\]/g, '__')
                    .replace(/[\[\]()]/g, '_')  // Replace brackets and parentheses
                    .replace(/[<>:"|?*]/g, '_') // Replace other problematic characters
                    .replace(/\s+/g, '_')       // Replace spaces with underscores
                    .replace(/_+/g, '_')        // Replace multiple underscores with single
                    .replace('.md', '.txt');
                console.log('Loading preview for:', filePath, 'Safe path:', safePath);
                const response = await fetch(`./content/${safePath}`);
                if (response.ok) {
                    content = await response.text();
                    this.fileContents.set(filePath, content);
                } else {
                    console.error('Preview load error:', response.status, 'for path:', safePath);
                    content = `Error loading file preview (${response.status})`;
                }
            } catch (error) {
                console.error('Preview network error:', error);
                content = 'Network error loading file preview';
            }
        }

        filePreview.innerHTML = `
            <div class="preview-header">
                <h3>${fileName.replace('.md', '')}</h3>
                <p>${filePath}</p>
            </div>
            <div class="preview-content">
                ${this.markdownToHtml(content)}
            </div>
        `;
    }

    handleQuickAction(action) {
        const folderMap = {
            'latest': 'Latest Jailbreaks',
            'legendary': 'Legendary Leaks',
            'grimoire': 'Grimoire',
            'security': 'Prompt Security'
        };

        const folder = folderMap[action];
        if (folder) {
            this.currentFolder = folder;
            this.folderFilter = folder;
            document.getElementById('folderFilter').value = folder;
            this.switchView('grid');
            this.filterAndRenderFiles();
        }
    }

    async copyFileContent() {
        if (!this.selectedFile) return;

        try {
            const content = this.fileContents.get(this.selectedFile);
            if (content) {
                await navigator.clipboard.writeText(content);
                this.showNotification('Content copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to copy content:', error);
            this.showNotification('Failed to copy content', 'error');
        }
    }

    downloadCurrentFile() {
        if (!this.selectedFile) return;

        const content = this.fileContents.get(this.selectedFile);
        if (!content) return;

        const fileName = this.selectedFile.split('/').pop();
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('File downloaded!');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async refresh() {
        this.showLoading(true);
        this.fileContents.clear();

        await this.loadFileStructure();
        this.filterAndRenderFiles();
        this.updateStats();
        this.showNotification('Data refreshed!');
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (this.sidebarOpen) {
            this.closeMobileSidebar();
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            this.sidebarOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');

        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        this.sidebarOpen = false;
        document.body.style.overflow = '';
    }

    handleResize() {
        this.isMobile = window.innerWidth <= 768;
        if (!this.isMobile && this.sidebarOpen) {
            this.closeMobileSidebar();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(date) {
        if (!date) return 'Unknown';
        const now = new Date();
        const diff = now - new Date(date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return new Date(date).toLocaleDateString();
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';

        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(?!<[h1-6|li|pre])(.+)$/gm, '<p>$1</p>')
            .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for tree view
function toggleTreeFolder(folderName) {
    const folderFiles = document.getElementById(`tree-${folderName}`);
    const icon = folderFiles.previousElementSibling.querySelector('.fa-chevron-down');

    if (folderFiles.style.display === 'none') {
        folderFiles.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        folderFiles.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.promptArsenal = new PromptArsenal();
});

// Add smooth scrolling
document.documentElement.style.scrollBehavior = 'smooth';
