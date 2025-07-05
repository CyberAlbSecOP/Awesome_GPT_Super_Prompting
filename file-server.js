
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Function to recursively read all .md files from directories
function getAllMarkdownFiles(dirPath, arrayOfFiles = []) {
    try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    getAllMarkdownFiles(fullPath, arrayOfFiles);
                } else if (file.endsWith('.md')) {
                    const stats = fs.statSync(fullPath);
                    arrayOfFiles.push({
                        name: file,
                        path: fullPath,
                        relativePath: path.relative('.', fullPath),
                        folder: path.dirname(path.relative('.', fullPath)),
                        size: stats.size,
                        type: 'md',
                        lastModified: stats.mtime
                    });
                }
            } catch (error) {
                // Skip files that can't be accessed
            }
        });
    } catch (error) {
        // Skip directories that can't be accessed
    }
    
    return arrayOfFiles;
}

// Get all markdown files
const markdownFiles = getAllMarkdownFiles('./');

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle API routes
    if (pathname.startsWith('/api/file')) {
        const filePath = parsedUrl.query.path;
        if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing file path');
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(content);
        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
        return;
    }
    
    // Handle API to get all markdown files
    if (pathname === '/api/files') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(markdownFiles));
        return;
    }
    
    // Handle static files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    // Security check to prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    const extname = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    
    switch (extname) {
        case '.css': 
            contentType = 'text/css'; 
            break;
        case '.js': 
            contentType = 'text/javascript'; 
            break;
        case '.json': 
            contentType = 'application/json'; 
            break;
        case '.png': 
            contentType = 'image/png'; 
            break;
        case '.jpg': 
        case '.jpeg': 
            contentType = 'image/jpeg'; 
            break;
        case '.ico': 
            contentType = 'image/x-icon'; 
            break;
        case '.svg': 
            contentType = 'image/svg+xml'; 
            break;
        case '.woff': 
            contentType = 'font/woff'; 
            break;
        case '.woff2': 
            contentType = 'font/woff2'; 
            break;
        case '.ttf': 
            contentType = 'font/ttf'; 
            break;
        case '.eot': 
            contentType = 'application/vnd.ms-fontobject'; 
            break;
    }
    
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
});

server.listen(5000, '0.0.0.0', () => {
    console.log('Prompt Arsenal server running on port 5000');
    console.log(`Found ${markdownFiles.length} markdown files`);
});
