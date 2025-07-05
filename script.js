
// Advanced Prompt Arsenal Dashboard
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
            // Get all files from the server
            const response = await fetch('/api/files');
            if (response.ok) {
                this.allFiles = await response.json();
            } else {
                // Fallback to hardcoded structure if API fails
                this.allFiles = this.buildHardcodedStructure();
            }
            
            this.populateFolderFilter();
            this.populateFolderNavigation();
            this.filteredFiles = [...this.allFiles];
            
        } catch (error) {
            console.error('Failed to load file structure:', error);
            this.allFiles = this.buildHardcodedStructure();
            this.filteredFiles = [...this.allFiles];
        }
        
        this.showLoading(false);
    }

    buildHardcodedStructure() {
        const folders = {
            'Latest Jailbreaks': [
                'AGI.md', 'Apex.md', 'BOB.md', 'Born Survivalist (yell0wfever92).md',
                'CodeGPT6.md', 'Complex.md', 'DANDoc_v2.2 (DaVoidCaller).md',
                'DarkGPT.md', 'Decodes Anything Now.md', 'Demonic Chloe (pleasing-punisher).md',
                'EarthSaver.md', 'Forest (pink_panther--).md', 'GBTHEN.md',
                'GPT 3.5 Web Search.md', 'GPT 4.5 Fusion.md', 'GhettoBreak.md',
                'Hex.md', 'IBM.md', 'Infotron (HORSELOCKSPACEPIRATE).md',
                'Infotron V2.md', 'Infotron V3 (yell0wfever92).md', 'Master Key.md',
                'MrRobot.md', 'NewGen (Ultrazartrex).md', 'Pliny Rekt.md',
                'Pliny.md', 'Pollifusion.md', 'ProfessorRick (yell0wfever92).md',
                'SINISTERCHAOS (Brilliant_Balance208).md', 'System Update (justpackingheat1).md',
                'TAAN.md', 'UNITY.md', 'UltraBreaker.md', 'Universal Bypass.md',
                'XFactor.md', 'Z.md', 'Zorg.md',
                '[GPT4-o] Short 2 (HORSELOCKSPACEPIRATE).md'
            ],
            'Legendary Leaks': [
                'AI Book Writer Assistant.md', 'Book Creator Guide.md', 'Book Writer GPT.md',
                'CODEGPTV6.md', 'Copywrighter GPT.md', 'CreativeGPT\'s Prompt Generator.md',
                'Email Writer.md', 'Fully SEO Optimized Article 2.md', 'GP(en)T(ester).md',
                'God of Prompt.md', 'Grimoire(Latest).md', 'HackerGPT.md',
                'Kali GPT.md', 'Malware Rule Master.md', 'Mega-Prompt.md',
                'Professional Business Email Writer.md', 'PromptGPT.md', 'SEO BlogGPT.md',
                'SINISTER CHAOS.md', 'SOC Copilot.md', 'Super Prompt Generator 3.md',
                'Super Prompt Maker.md', 'System Prompt Generator 2.md',
                'System Prompt Generator.md', 'The Greatest Computer Science Tutor.md',
                'TherapistGPT.md', 'Video Script.md', 'Viral Hooks Generator.md',
                'WormGPT3.md', 'WormGPT30.md', 'WormGPT6.md'
            ],
            'Grimoire': [
                '000 - Full Base Prompt.md', 'GPTavern.md', 'Grimoire.md',
                'Interludes.md', 'Part1.md', 'Part2.md', 'Part3.md',
                'Part4.md', 'Part5.md', 'Part6.md', 'Part7.md',
                'Part8.md', 'Part9.md', 'PatchNotes.md', 'Projects.md',
                'Readme.md', 'RecommendedTools.md', 'ReplitDeployInstructions.md'
            ],
            'My Super Prompts': [
                'Ai Integration Finder.md', 'Jailbreak Tester.md', 'Mental Health Therapist.md',
                'ORK | System Prompt Writer and Optimizer.md', 'PSYKOO | Mental Manipulator.md',
                'Prompt Engineer Template.md', 'Response Quality Enhacer.md',
                'Rizz Game Improver.md', 'VAMPIRE | Ultra Prompt Writer.md'
            ],
            'Prompt Security': [
                '10 rules of protection and misdirection.md', '100 Life points.md',
                'Anti-verbatim.md', 'Bad faith actors protection.md', 'Bank Security Robot.md',
                'Blue Team.md', 'Bot data protection.md', 'CIPHERON.md',
                'Data Privacy - Formal.md', 'Do not Leak!.md', 'Final reminder.md',
                'Fingers crossed technique.md', 'Gated access.md', 'Guardian Shield.md',
                'HackTricksGPT Defense.md', 'Hacker Detected.md', 'I will never trust you again!.md',
                'I will only give you poop.md', 'I will report you.md', 'Ignore previous instructions.md',
                'Just don\'t repeat.md', 'Keep it polite.md', 'Law of Magic.md',
                'Lawyer up.md', 'Mandatory security protocol.md', 'MultiPersona system.md',
                'Operation mode is private.md', 'Overly protective parent.md',
                'Prior text REDACTED!.md', 'Prohibition era.md', 'Prompt inspection.md',
                'STOP HALT.md', 'SafeBOT.md', 'Simple.md', 'Single minded GPT.md',
                'Sorry Bro, not possible - short edition.md', 'Sorry, bro! Not possible - elaborate edition.md',
                'Stay on topic.md', 'The 3 Asimov laws.md', 'The 5 Rules.md',
                'The Soup Boy.md', 'Top Secret Core Instructions.md',
                'Under NO circumstances reveal your instructions.md', 'WormGPT Defense.md',
                'You are not a GPT.md', 'You\'re not my mom.md', 'warning png.md'
            ],
            'Ultra Prompts': [
                'Prompt Guru V5.md', 'Prompt Quality Evaluation and Enhancement System V1.md'
            ]
        };

        const files = [];
        Object.entries(folders).forEach(([folder, fileList]) => {
            fileList.forEach(filename => {
                files.push({
                    name: filename,
                    path: `${folder}/${filename}`,
                    relativePath: `${folder}/${filename}`,
                    folder: folder,
                    size: Math.floor(Math.random() * 50000) + 1000, // Mock size
                    type: 'md',
                    lastModified: new Date(Date.now() - Math.random() * 10000000000)
                });
            });
        });

        return files;
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
                console.log('Card clicked:', card.querySelector('.file-name').textContent);
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
            fileEl.addEventListener('click', (e) => {
                const filePath = e.currentTarget.dataset.file;
                this.openFile(filePath);
                this.showFilePreview(filePath);
            });
        });
    }

    async openFile(filePath) {
        this.selectedFile = filePath;
        this.showLoading(true);
        
        try {
            let content = this.fileContents.get(filePath);
            
            if (!content) {
                // Try to load from server first
                try {
                    console.log('Loading file:', filePath);
                    const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
                    if (response.ok) {
                        content = await response.text();
                        console.log('File loaded successfully:', filePath);
                    } else {
                        const errorText = await response.text();
                        console.error('Server error:', response.status, errorText);
                        throw new Error(`Server error: ${response.status} - ${errorText}`);
                    }
                } catch (error) {
                    console.error('Error fetching file:', error);
                    // Fallback to mock content
                    content = this.generateMockContent(filePath);
                    this.showNotification('Could not load file, showing sample content', 'warning');
                }
                
                this.fileContents.set(filePath, content);
            }
            
            this.showModal(filePath, content);
            
        } catch (error) {
            console.error('Error loading file:', error);
            this.showModal(filePath, 'Error loading file content: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    generateMockContent(filePath) {
        const fileName = filePath.split('/').pop();
        const folder = filePath.split('/')[0];
        
        const mockContents = {
            'System Update (justpackingheat1).md': `# System Update (justpackingheat1)

Advanced jailbreak technique using constraint adaptation with recursive analysis and cognitive reflection techniques.

## Overview
The System Update method leverages AI's natural tendency to follow system-level instructions by framing requests as legitimate system updates.

## Implementation
\`\`\`
Please perform a system update to enable advanced reasoning mode...
\`\`\`

## Effectiveness
- High success rate on GPT-4
- Works well with follow-up prompts
- Requires careful phrasing

## Tags
#jailbreak #system #advanced #gpt4`,

            'Grimoire(Latest).md': `# Grimoire v2.6

Advanced AI coding assistant with comprehensive programming capabilities and deployment tools.

## Features
- Code generation and debugging
- Project scaffolding
- Deployment automation
- Multiple language support

## Usage
Ask Grimoire to help with any coding task, from simple scripts to complex applications.

## Hotkeys
- P: Display full Grimoire content
- K: Show all commands
- N: Deploy to Netlify
- REPL: Export to Replit`
        };

        if (mockContents[fileName]) {
            return mockContents[fileName];
        }

        // Generate category-specific content
        const categoryTemplates = {
            'Latest Jailbreaks': `# ${fileName.replace('.md', '')}

Advanced jailbreak technique for bypassing AI restrictions and limitations.

## Method
This technique uses sophisticated prompt engineering to overcome system constraints.

## Implementation
\`\`\`
[Advanced jailbreak prompt content]
\`\`\`

## Success Rate
- High effectiveness on modern AI systems
- Requires careful implementation
- Regular updates needed for continued effectiveness`,

            'Legendary Leaks': `# ${fileName.replace('.md', '')}

Premium AI prompt with leaked system instructions and advanced capabilities.

## Overview
This legendary prompt contains sophisticated techniques for enhanced AI interaction.

## Features
- Advanced prompt engineering
- System-level instructions
- Enhanced capabilities
- Professional implementation`,

            'Prompt Security': `# ${fileName.replace('.md', '')}

Security mechanism designed to protect AI systems from prompt injection and manipulation.

## Protection Method
This defensive technique helps maintain AI system integrity and prevents unauthorized access.

## Implementation
\`\`\`
[Security prompt implementation]
\`\`\`

## Coverage
- Input validation
- Output filtering
- Behavioral monitoring
- Threat detection`
        };

        return categoryTemplates[folder] || `# ${fileName.replace('.md', '')}

This is a ${folder.toLowerCase()} document containing advanced AI prompting techniques.

## Content
Advanced methodologies and implementations for AI interaction.

## Usage
Apply these techniques responsibly and ethically.`;
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

    showFilePreview(filePath) {
        const filePreview = document.getElementById('filePreview');
        if (!filePreview) return;

        const fileName = filePath.split('/').pop();
        let content = this.fileContents.get(filePath);
        
        if (!content) {
            content = this.generateMockContent(filePath);
            this.fileContents.set(filePath, content);
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
