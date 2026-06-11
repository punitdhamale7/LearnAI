import fs from 'fs';
import path from 'path';

const distDir = '../react-assets';

if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(path.join(distDir, 'assets'));
    
    files.forEach(file => {
        if (file.endsWith('.js') && file.startsWith('index-')) {
            fs.copyFileSync(path.join(distDir, 'assets', file), path.join(distDir, 'index.js'));
            console.log(`Copied ${file} to index.js`);
        }
        if (file.endsWith('.css') && file.startsWith('index-')) {
            fs.copyFileSync(path.join(distDir, 'assets', file), path.join(distDir, 'index.css'));
            console.log(`Copied ${file} to index.css`);
        }
    });
}
