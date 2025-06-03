const fs = require('fs');
const path = require('path');

// Create dist directory
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
}

// Files and directories to copy
const itemsToCopy = [
    'index.html',
    'campaigns',
    'src',
    'Campaign Images',
    'public',
    'favicon.svg'
];

// Copy function
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy each item
itemsToCopy.forEach(item => {
    if (fs.existsSync(item)) {
        const destPath = path.join('dist', item);
        console.log(`Copying ${item} to ${destPath}`);
        copyRecursiveSync(item, destPath);
    } else {
        console.log(`Warning: ${item} not found, skipping`);
    }
});

// Copy public files to root of dist
if (fs.existsSync('public')) {
    console.log('Copying public files to dist root...');
    fs.readdirSync('public').forEach(file => {
        const srcPath = path.join('public', file);
        const destPath = path.join('dist', file);
        copyRecursiveSync(srcPath, destPath);
        console.log(`Copied ${file} from public to dist root`);
    });
}

console.log('Build completed successfully!');
console.log('Static files copied to dist directory for Vercel deployment.'); 