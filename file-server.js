
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class FileServer {
    constructor() {
        this.markdownFiles = [];
        this.loadFiles();
    }

    loadFiles() {
        console.log('Scanning for markdown files...');
        this.markdownFiles = this.getAllMarkdownFiles('.');
        console.log(`Found ${this.markdownFiles.length} markdown files`);
        
        // Debug: show first few files
        if (this.markdownFiles.length > 0) {
            console.log('Sample files:');
            this.markdownFiles.slice(0, 5).forEach(file => {
                console.log(`- ${file.relativePath} (${file.folder})`);
            });
        }
    }

    getAllMarkdownFiles(dirPath, arrayOfFiles = []) {
        try {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const fullPath = path.join(dirPath, file);
                
                try {
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        // Skip hidden directories and node_modules
                        if (!file.startsWith('.') && file !== 'node_modules') {
                            this.getAllMarkdownFiles(fullPath, arrayOfFiles);
                        }
                    } else if (file.endsWith('.md')) {
                        const relativePath = path.relative('.', fullPath).replace(/\\/g, '/');
                        let folderName = path.dirname(relativePath);
                        
                        // Clean up folder name
                        if (folderName === '.') {
                            folderName = 'Root';
                        } else {
                            folderName = folderName.replace(/\\/g, '/');
                        }
                        
                        arrayOfFiles.push({
                            name: file,
                            path: fullPath,
                            relativePath: relativePath,
                            folder: folderName,
                            size: stat.size,
                            type: 'md',
                            lastModified: stat.mtime.toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Error processing ${fullPath}:`, error.message);
                }
            });
        } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error.message);
        }
        
        return arrayOfFiles;
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        console.log(`${req.method} ${pathname}`);

        try {
            // API endpoint to get all files
            if (pathname === '/api/files') {
                console.log(`Returning ${this.markdownFiles.length} files`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.markdownFiles));
                return;
            }

            // API endpoint to get specific file content
            if (pathname === '/api/file') {
                const filePath = parsedUrl.query.path;
                
                if (!filePath) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing file path parameter' }));
                    return;
                }

                console.log(`Requested file: ${filePath}`);
                
                // Find the file in our list
                const fileInfo = this.markdownFiles.find(f => 
                    f.relativePath === filePath || f.path === filePath
                );
                
                if (!fileInfo) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'File not found in index' }));
                    return;
                }

                try {
                    const content = fs.readFileSync(fileInfo.path, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(content);
                } catch (error) {
                    console.error(`Error reading file ${fileInfo.path}:`, error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Error reading file: ${error.message}` }));
                }
                return;
            }

            // Refresh endpoint
            if (pathname === '/api/refresh') {
                this.loadFiles();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Files refreshed', 
                    count: this.markdownFiles.length 
                }));
                return;
            }

            // Serve static files
            this.serveStaticFile(req, res, pathname);
            
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }

    serveStaticFile(req, res, pathname) {
        let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
        
        // Security check
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        const extname = path.extname(filePath).toLowerCase();
        const contentTypeMap = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.ico': 'image/x-icon',
            '.svg': 'image/svg+xml',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        };
        
        const contentType = contentTypeMap[extname] || 'text/plain';
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    }
}

// Create and start server
const fileServer = new FileServer();
const server = http.createServer((req, res) => fileServer.handleRequest(req, res));

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Prompt Arsenal server running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/files`);
    console.log(`Total markdown files indexed: ${fileServer.markdownFiles.length}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
