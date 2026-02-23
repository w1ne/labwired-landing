const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const components = {};

if (fs.existsSync(componentsDir)) {
    fs.readdirSync(componentsDir).forEach(file => {
        if (file.endsWith('.html')) {
            const name = file.replace('.html', '');
            let content = fs.readFileSync(path.join(componentsDir, file), 'utf-8').trim();
            // Optional padding wrapper for formatting if needed, but doing exactly the text is fine.
            components[name] = content;
        }
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Use regex to find <!-- COMPONENT: name --> ... <!-- END COMPONENT: name -->
    const regex = /<!--\s*COMPONENT:\s*([a-zA-Z0-9_-]+)\s*-->[\s\S]*?<!--\s*END COMPONENT:\s*\1\s*-->/g;

    content = content.replace(regex, (match, name) => {
        if (components[name]) {
            modified = true;
            let compContent = components[name];

            // Calculate depth
            const relPath = path.relative(__dirname, filePath);
            const depth = relPath ? relPath.split(path.sep).length - 1 : 0;
            const prefix = depth === 0 ? '' : '../'.repeat(depth);

            compContent = compContent.replace(/\{\{ROOT\}\}/g, prefix);

            // Special case for index.html intra-page links
            if (depth === 0 && filePath.endsWith('index.html')) {
                compContent = compContent.replace(/href="index\.html#/g, 'href="#');
            }

            return `<!-- COMPONENT: ${name} -->\n${compContent}\n<!-- END COMPONENT: ${name} -->`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'components' && file !== '.git' && file !== '.github' && file !== 'test-results') {
                walkDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            // Ignore temporary playwright view files
            if (!fullPath.includes('playwright')) {
                processFile(fullPath);
            }
        }
    });
}

walkDir(__dirname);
console.log('Build complete.');
