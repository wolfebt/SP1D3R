export const resolvePath = (base, relative) => {
    const stack = base.split('/').filter(i => i && i !== '.');
    stack.pop();
    relative.split('/').forEach(part => {
        if (part === '..') stack.pop(); else if (part && part !== '.') stack.push(part);
    });
    return stack.join('/');
};

export const findFile = (files, possibilities) => {
    for (const p of possibilities) if (files.has(p)) return p;
    return undefined;
};

export const detectProjectType = (files) => {
    const filePaths = Array.from(files.keys());
    if (filePaths.some(p => p.endsWith('.jsx')) || filePaths.some(p => p.includes('package.json'))) return 'react';
    return 'static';
};

export const findEntryPoint = (files) => {
    const possibilities = ['src/index.js', 'src/index.jsx', 'index.js', 'index.jsx'];
    for (const p of possibilities) {
        if (files.has(p)) return p;
    }
    return undefined;
};
