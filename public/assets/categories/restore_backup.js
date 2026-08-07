const fs = require('fs');
const path = require('path');
const dir = __dirname;
const files = ['cat-conjuntos', 'cat-noite', 'cat-sexy', 'cat-plus'];

files.forEach(name => {
    const backup = path.join(dir, `${name}_backup_original.webp`);
    const target = path.join(dir, `${name}.webp`);
    if (fs.existsSync(backup)) {
        fs.copyFileSync(backup, target);
        console.log(`Restored ${name}.webp from backup.`);
    }
});
