module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./jest.setup.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!(jsdom|whatwg-url|isomorphic-git|@isomorphic-git/lightning-fs|parse5)/)',
    ],
};
