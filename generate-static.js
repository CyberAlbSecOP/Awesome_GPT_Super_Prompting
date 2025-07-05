
const fs = require('fs');
const path = require('path');

function getAllMarkdownFiles(dirPath, arrayOfFiles = []) {
    try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip hidden directories and node_modules
                    if (!file.startsWith('.') && file !== 'node_modules') {
                        getAllMarkdownFiles(fullPath, arrayOfFiles);
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

// Generate files.json
const markdownFiles = getAllMarkdownFiles('.');
fs.writeFileSync('files.json', JSON.stringify(markdownFiles, null, 2));

// Generate content files
const contentDir = 'content';
if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
}

markdownFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file.path, 'utf8');
        // Replace more characters that might cause issues in filenames
        const safePath = file.relativePath
            .replace(/[\/\\]/g, '__')
            .replace(/[\[\]()]/g, '_')  // Replace brackets and parentheses
            .replace(/[<>:"|?*]/g, '_') // Replace other problematic characters
            .replace(/\s+/g, '_')       // Replace spaces with underscores
            .replace(/_+/g, '_')        // Replace multiple underscores with single
            .replace('.md', '.txt');
        
        console.log(`Converting: ${file.relativePath} -> ${safePath}`);
        fs.writeFileSync(path.join(contentDir, safePath), content);
    } catch (error) {
        console.error(`Error reading ${file.path}:`, error.message);
    }
});

console.log(`Generated static data for ${markdownFiles.length} files`);
