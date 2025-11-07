import { resolvePath, findFile, detectProjectType, findEntryPoint } from './utils.js';

describe('findEntryPoint', () => {
    test('should find src/index.js', () => {
        const files = new Map([['src/index.js', {}]]);
        expect(findEntryPoint(files)).toBe('src/index.js');
    });

    test('should find src/index.jsx', () => {
        const files = new Map([['src/index.jsx', {}]]);
        expect(findEntryPoint(files)).toBe('src/index.jsx');
    });

    test('should find index.js', () => {
        const files = new Map([['index.js', {}]]);
        expect(findEntryPoint(files)).toBe('index.js');
    });

    test('should find index.jsx', () => {
        const files = new Map([['index.jsx', {}]]);
        expect(findEntryPoint(files)).toBe('index.jsx');
    });

    test('should return undefined if no entry point is found', () => {
        const files = new Map([['index.html', {}]]);
        expect(findEntryPoint(files)).toBe(undefined);
    });
});

describe('detectProjectType', () => {
    test('should detect a react project from package.json', () => {
        const files = new Map([['package.json', {}]]);
        expect(detectProjectType(files)).toBe('react');
    });

    test('should detect a react project from a jsx file', () => {
        const files = new Map([['src/index.jsx', {}]]);
        expect(detectProjectType(files)).toBe('react');
    });

    test('should detect a static project', () => {
        const files = new Map([['index.html', {}]]);
        expect(detectProjectType(files)).toBe('static');
    });
});

describe('findFile', () => {
    const files = new Map([
        ['src/index.js', {}],
        ['index.html', {}],
        ['package.json', {}],
    ]);

    test('should find the first existing file', () => {
        expect(findFile(files, ['src/index.js', 'index.html'])).toBe('src/index.js');
    });

    test('should find a file that is not the first possibility', () => {
        expect(findFile(files, ['missing.js', 'package.json'])).toBe('package.json');
    });

    test('should return undefined if no file is found', () => {
        expect(findFile(files, ['missing.js', 'another-missing.js'])).toBe(undefined);
    });
});

describe('resolvePath', () => {
    test('should resolve a simple relative path', () => {
        expect(resolvePath('a/b/c', '../d')).toBe('a/d');
    });

    test('should handle multiple .. segments', () => {
        expect(resolvePath('a/b/c', '../../d')).toBe('d');
    });

    test('should handle paths with no .. segments', () => {
        expect(resolvePath('a/b/c', 'd/e')).toBe('a/b/d/e');
    });

    test('should handle paths starting with /', () => {
        // This is not how it's designed to work, but we should document the behavior
        expect(resolvePath('a/b/c', '/d')).toBe('a/b/d');
    });

    test('should handle empty relative path', () => {
        expect(resolvePath('a/b/c', '')).toBe('a/b');
    });
});
