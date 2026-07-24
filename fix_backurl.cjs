const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('resources/js/Pages/Admin');
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    if (content.includes('backUrl=') && content.includes('PageHeader')) {
        const backUrlRegex = /backUrl=\{([^}]+)\}/;
        const match = content.match(backUrlRegex);
        if (match) {
            const backUrlProp = match[0];
            content = content.replace(backUrlRegex, '');
            const authLayoutRegex = /(<AuthenticatedLayout\b[^>]*)/;
            content = content.replace(authLayoutRegex, '$1\n            ' + backUrlProp);
            fs.writeFileSync(file, content);
            changed++;
            console.log('Updated', file);
        }
    }
});
console.log('Total files changed:', changed);
