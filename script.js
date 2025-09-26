// --- TABS ---
        const emulatorTabBtn = document.getElementById('emulator-tab-btn');
        const coderTabBtn = document.getElementById('coder-tab-btn');
        const sourceControlTabBtn = document.getElementById('source-control-tab-btn');
        const emulatorView = document.getElementById('emulator-view');
        const coderView = document.getElementById('coder-view');
        const sourceControlView = document.getElementById('source-control-view');
        const emulatorControls = document.getElementById('emulator-controls');
        const coderControls = document.getElementById('coder-controls');

        function switchToEmulator() {
            emulatorTabBtn.classList.add('active');
            coderTabBtn.classList.remove('active');
            sourceControlTabBtn.classList.remove('active');
            emulatorView.classList.remove('hidden');
            coderView.classList.add('hidden');
            sourceControlView.classList.add('hidden');
            emulatorControls.classList.remove('hidden'); emulatorControls.classList.add('flex');
            coderControls.classList.add('hidden');
        }
        function switchToCoder() {
            coderTabBtn.classList.add('active');
            emulatorTabBtn.classList.remove('active');
            sourceControlTabBtn.classList.remove('active');
            coderView.classList.remove('hidden'); coderView.classList.add('flex');
            emulatorView.classList.add('hidden');
            sourceControlView.classList.add('hidden');
            coderControls.classList.remove('hidden'); coderControls.classList.add('flex');
            emulatorControls.classList.add('hidden'); emulatorControls.classList.remove('flex');
        }
        function switchToSourceControl() {
            sourceControlTabBtn.classList.add('active');
            emulatorTabBtn.classList.remove('active');
            coderTabBtn.classList.remove('active');
            sourceControlView.classList.remove('hidden'); sourceControlView.classList.add('flex');
            emulatorView.classList.add('hidden');
            coderView.classList.add('hidden');
            // Hide both sets of controls for this tab
            emulatorControls.classList.add('hidden'); emulatorControls.classList.remove('flex');
            coderControls.classList.add('hidden'); coderControls.classList.remove('flex');
        }
        emulatorTabBtn.addEventListener('click', switchToEmulator);
        coderTabBtn.addEventListener('click', switchToCoder);
        sourceControlTabBtn.addEventListener('click', switchToSourceControl);

        // --- DOM Elements ---
        const fileInput = document.getElementById('file-input');
        const appRoot = document.getElementById('app-root');
        const staticSiteFrame = document.getElementById('static-site-frame');
        const instructions = document.getElementById('instructions');
        const loadingState = document.getElementById('loading-state');
        const consoleOutput = document.getElementById('console-output');
        const clearConsoleBtn = document.getElementById('clear-console-btn');
        const selectProjectBtn = document.getElementById('select-project-btn');
        const viewConsoleBtn = document.getElementById('view-console-btn');
        const viewFilesBtn = document.getElementById('view-files-btn');
        const resetBtn = document.getElementById('reset-btn');
        const fileTreeModal = document.getElementById('file-tree-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const fileTreeContainer = document.getElementById('file-tree-container');
        const fileTreeTitle = document.getElementById('file-tree-title');
        const consoleModal = document.getElementById('console-modal');
        const closeConsoleModalBtn = document.getElementById('close-console-modal-btn');

        // --- SHARED STATE ---
        let fileMap = new Map();
        const transpiledCache = new Map();
        let currentProjectType = 'static';
        let currentCoderFile = null;
        let currentOnFileClickCallback = null;
        let openTabs = [];
        let editorStates = new Map();
        let fs = null;
        let pfs = null;

        // --- PAIR CODER DOM Elements ---
        const coderSidebar = document.getElementById('coder-sidebar');
        const mainCoderPanel = document.getElementById('main-coder-panel');
        const resizer = document.getElementById('resizer');
        const functionList = document.getElementById('function-list');
        const selectFileBtn = document.getElementById('select-file-btn');
        const saveFileBtn = document.getElementById('save-file-btn');
        const currentFileDisplay = document.getElementById('current-file-display');
        const auditModal = document.getElementById('audit-modal');
        const openAuditModalBtn = document.getElementById('open-audit-modal-btn');
        const closeAuditModalBtn = document.getElementById('close-audit-modal-btn');
        const auditButtons = document.querySelectorAll('#quick-audit-buttons .navigator-btn');
        const analysisPromptInput = document.getElementById('analysis-prompt-input');
        const runAuditBtn = document.getElementById('run-audit-btn');
        const settingsModal = document.getElementById('settings-modal');
        const analysisModal = document.getElementById('analysis-modal');

        // --- Logging & Status ---
        function log(message, type = 'info', details) {
            const now = new Date();
            const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const colors = { info: 'text-gray-400', success: 'text-green-400', error: 'text-red-400', warn: 'text-yellow-400' };
            const logEntry = document.createElement('div');
            logEntry.className = `flex items-start ${colors[type]}`;
            let messageHTML = `<span class="mr-2 text-gray-500">${timestamp}</span> <span class="flex-grow">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            if (details) {
                const detailsEl = document.createElement('div');
                detailsEl.className = 'mt-1 pl-6 text-xs text-gray-500 whitespace-pre-wrap';
                detailsEl.textContent = (details instanceof Error) ? (details.stack || details.message) : (typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
                messageHTML += detailsEl.outerHTML;
            }
            logEntry.innerHTML = messageHTML;
            consoleOutput.appendChild(logEntry);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
        clearConsoleBtn.addEventListener('click', () => { consoleOutput.innerHTML = `<div class="text-gray-400">Console cleared.</div>`; });

        const statusMessage = document.getElementById('status-message');
        function showStatusMessage(message, duration = 4000) {
            statusMessage.textContent = message;
            setTimeout(() => { statusMessage.textContent = ''; }, duration);
        }

        // --- Modal UI Logic ---
        const allModals = [fileTreeModal, consoleModal, settingsModal, analysisModal, auditModal];

        function closeModal(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex', 'items-center', 'justify-center');
        }

        function openModal(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex', 'items-center', 'justify-center');
        }

        allModals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });

        viewConsoleBtn.addEventListener('click', () => openModal(consoleModal));
        closeConsoleModalBtn.addEventListener('click', () => closeModal(consoleModal));

        const openFileTreeModal = (title, onFileClick) => {
            fileTreeTitle.textContent = title;
            currentOnFileClickCallback = onFileClick; // Store the callback
            buildAndRenderFileTree(fileMap, onFileClick);
            openModal(fileTreeModal);
        };
        viewFilesBtn.addEventListener('click', () => openFileTreeModal('Project Files'));
        closeModalBtn.addEventListener('click', () => closeModal(fileTreeModal));
        document.getElementById('new-file-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            newFile();
        });
        document.getElementById('new-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            newFolder();
        });

        document.getElementById('download-zip-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadProjectZip();
        });

        resetBtn.addEventListener('click', () => { location.reload(); });

        // --- Core Emulation & Project Logic ---
        fileInput.addEventListener('change', handleFileSelect);

        async function handleFileSelect(event) {
            if (event.target.files.length === 0) return;
            instructions.style.display = 'none';
            loadingState.style.display = 'flex';
            fileMap.clear();
            transpiledCache.clear();
            consoleOutput.innerHTML = '';

            const files = event.target.files;
            const rootDir = files[0].webkitRelativePath.split('/')[0];

            for (const file of files) {
                const path = file.webkitRelativePath.substring(rootDir.length + 1);
                fileMap.set(path, file);
            }
            log(`${fileMap.size} files loaded from '${rootDir}'.`, 'success');

            log('Writing local files to virtual file system...');
            const dir = '/project';
            try {
                try { await pfs.rm(dir, { recursive: true }); } catch (e) { /* ignore */ }
                await pfs.mkdir(dir);

                for (const [path, file] of fileMap.entries()) {
                    const virtualPath = `${dir}/${path}`;
                    const parentDir = virtualPath.substring(0, virtualPath.lastIndexOf('/'));
                    if (parentDir && parentDir !== dir) {
                        await pfs.mkdir(parentDir, { recursive: true });
                    }
                    await pfs.writeFile(virtualPath, new Uint8Array(await file.arrayBuffer()));
                }
                log('Virtual file system populated.', 'success');

            } catch (e) {
                log('Error writing to virtual file system', 'error', e);
            }

            try {
                log('Initializing new Git repository...');
                await git.init({ fs, dir: '/project' });
                for (const [path, file] of fileMap.entries()) {
                    await git.add({ fs, dir: '/project', filepath: path });
                }
                await git.commit({
                    fs,
                    dir: '/project',
                    message: 'Initial commit',
                    author: { name: 'SP1D3R User', email: 'user@sp1d3r.dev' }
                });
                log('Initial commit created.', 'success');
                refreshGitStatus();
                refreshGitLog();
            } catch(e) {
                 log('Error initializing git repository', 'error', e);
            }

            selectProjectBtn.classList.add('hidden');
            viewFilesBtn.classList.remove('hidden');
            resetBtn.classList.remove('hidden');
            document.getElementById('download-zip-btn').classList.remove('hidden');
            selectFileBtn.disabled = false;
            runAuditBtn.disabled = false;
            openAuditModalBtn.disabled = false;

            currentProjectType = detectProjectType(fileMap);
            log(`Auto-detected project type: ${currentProjectType.toUpperCase()}`);
            await refreshEmulator();
        }

        async function refreshEmulator() {
            loadingState.style.display = 'flex';
            appRoot.style.display = 'none';
            staticSiteFrame.style.display = 'none';
            appRoot.innerHTML = '';
            transpiledCache.clear();
            document.head.querySelectorAll('style[data-dynamic-style]').forEach(s => s.remove());
            log('Refreshing emulator...');
            try {
                if (currentProjectType === 'react') await emulateReactApp(fileMap);
                else await emulateStaticSite(fileMap);
            } catch (e) {
                log(`A critical error occurred during refresh: ${e.message}`, 'error', e);
            } finally {
                 loadingState.style.display = 'none';
            }
        }

        function detectProjectType(files) {
            const filePaths = Array.from(files.keys());
            if (filePaths.some(p => p.endsWith('.jsx')) || findEntryPoint(files)) return 'react';
            return 'static';
        }

        async function emulateStaticSite(files) {
            log('Starting static site emulation...');
            staticSiteFrame.style.display = 'block';
            const indexPath = findFile(files, ['index.html', 'src/index.html']);
            if (!indexPath) throw new Error('Could not find index.html');
            const indexFile = files.get(indexPath);
            const base = indexPath.includes('/') ? indexPath.substring(0, indexPath.lastIndexOf('/')) : '';
            const htmlContent = await indexFile.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const elementsToUpdate = doc.querySelectorAll('link[href], script[src], img[src], a[href]');
            for (const el of elementsToUpdate) {
                const attr = el.hasAttribute('href') ? 'href' : 'src';
                let path = el.getAttribute(attr);
                if (path && !/^(https?|blob|data|#):/.test(path)) {
                    const resolvedPath = resolvePath(base, path);
                    const file = files.get(resolvedPath);
                    if (file) {
                        const blobUrl = URL.createObjectURL(new Blob([await file.text()], {type: file.type}));
                        el.setAttribute(attr, blobUrl);
                    } else {
                        log(`Asset not found: ${resolvedPath}`, 'warn');
                    }
                }
            }
            const finalHtml = new XMLSerializer().serializeToString(doc);
            staticSiteFrame.src = URL.createObjectURL(new Blob([finalHtml], { type: 'text/html' }));
            log('Static site rendered.', 'success');
        }

        let cdnModules = {};

        async function loadDependenciesFromCDN(files) {
            cdnModules = {}; // Reset
            const packageJsonFile = findFile(files, ['package.json']);
            if (!packageJsonFile) {
                log('No package.json found. React projects may not work without dependencies.', 'warn');
                // Manually add React as a fallback for projects without package.json
                try {
                    cdnModules['react'] = await import('https://esm.sh/react');
                    cdnModules['react-dom'] = await import('https://esm.sh/react-dom');
                    log('Loaded default React dependencies as a fallback.', 'info');
                } catch(e) {
                    log('Failed to load fallback React dependencies.', 'error', e);
                }
                return;
            }
            try {
                const content = await files.get(packageJsonFile).text();
                const packageJson = JSON.parse(content);
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                log(`Found ${Object.keys(dependencies).length} dependencies in package.json.`, 'info');

                const importPromises = Object.entries(dependencies).map(async ([name, version]) => {
                    try {
                        const moduleUrl = `https://esm.sh/${name}@${version}`;
                        log(`Loading ${name}@${version} from ${moduleUrl}...`);
                        cdnModules[name] = await import(moduleUrl);
                        log(`Successfully loaded ${name}.`, 'success');
                    } catch (e) {
                        log(`Failed to load dependency ${name}@${version} from CDN. Trying without version.`, 'warn');
                        try {
                             const moduleUrl = `https://esm.sh/${name}`;
                             log(`Loading ${name} from ${moduleUrl}...`);
                             cdnModules[name] = await import(moduleUrl);
                             log(`Successfully loaded ${name}.`, 'success');
                        } catch (e2) {
                             log(`Failed to load dependency ${name} from CDN.`, 'error', e2);
                        }
                    }
                });

                await Promise.all(importPromises);
                log('Finished loading all CDN dependencies.', 'success');

            } catch (e) {
                log('Error processing package.json or loading dependencies.', 'error', e);
            }
        }

        async function emulateReactApp(files) {
            log('Starting React app emulation...');
            appRoot.style.display = 'block';
            appRoot.innerHTML = '<div id="root"></div>';

            await loadDependenciesFromCDN(files);

            const entryPointPath = findEntryPoint(files);
            if (!entryPointPath) throw new Error('Could not find a suitable entry point (e.g., src/index.js).');
            await executeModule(entryPointPath, files);
            log('React app emulation finished.', 'success');
        }

        const findEntryPoint = (files) => findFile(files, ['src/index.js', 'src/index.jsx', 'index.js', 'index.jsx']);

        const executeModule = async (path, files, visited = new Set()) => {
            const normalizedPath = path.replace(/\\/g, '/');
            if (visited.has(normalizedPath)) return transpiledCache.get(normalizedPath)?.exports;
            visited.add(normalizedPath);
            if (transpiledCache.has(normalizedPath)) return transpiledCache.get(normalizedPath).exports;

            const file = files.get(normalizedPath);
            if (!file) throw new Error(`Module not found: ${normalizedPath}`);
            const code = await file.text();
            let transformedCode;
            try {
                if (normalizedPath.endsWith('.css')) {
                    const style = document.createElement('style');
                    style.textContent = code; style.setAttribute('data-dynamic-style', 'true');
                    document.head.appendChild(style);
                    transpiledCache.set(normalizedPath, { exports: {} });
                    return {};
                }
                if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(normalizedPath)) {
                    transformedCode = `export default "${URL.createObjectURL(file)}";`;
                } else {
                    transformedCode = Babel.transform(code, { presets: ['react', 'es2015'], filename: normalizedPath }).code;
                }
            } catch (e) {
                log(`Error transforming module ${normalizedPath}`, 'error', e); throw e;
            }
            const dependencies = Array.from(new Set(Array.from(code.matchAll(/require\(['"]([^'"]+)['"]\)/g), m => m[1])));
            const dependencyExports = {};
            for (const dep of dependencies) {
                 if (cdnModules[dep]) continue; // Skip if it's a CDN module
                const resolvedFile = findFile(files, [`${resolvePath(normalizedPath, `../${dep}`)}.js`, `${resolvePath(normalizedPath, `../${dep}`)}.jsx`, `${resolvePath(normalizedPath, `../${dep}`)}/index.js`]);
                if (!resolvedFile) throw new Error(`Could not resolve dependency '${dep}' from '${normalizedPath}'`);
                dependencyExports[dep] = await executeModule(resolvedFile, files, visited);
            }
            const exports = {}; const module = { exports };
             const require = (dep) => {
                if (cdnModules[dep]) return cdnModules[dep];
                if (dep === 'react-dom/client') return { createRoot: (el) => ({ render: (app) => cdnModules['react-dom'].render(app, el) }) };
                return dependencyExports[dep];
            };
            try {
                new Function('module', 'exports', 'require', transformedCode)(module, exports, require);
            } catch(e) {
                log(`Error executing module ${normalizedPath}`, 'error', e); throw e;
            }
            transpiledCache.set(normalizedPath, { exports: module.exports });
            return module.exports;
        };

        const resolvePath = (base, relative) => {
            const stack = base.split('/').filter(i => i && i !== '.');
            stack.pop();
            relative.split('/').forEach(part => {
                if (part === '..') stack.pop(); else if (part && part !== '.') stack.push(part);
            });
            return stack.join('/');
        };

        const findFile = (files, possibilities) => {
            for (const p of possibilities) if (files.has(p)) return p;
            return undefined;
        };

        function downloadFile(filePath) {
            const file = fileMap.get(filePath);
            if (!file) {
                log(`Could not find file to download: ${filePath}`, 'error');
                return;
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(file);
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showStatusMessage(`Downloading '${file.name}'...`, 2000);
        }

        function clearEditor() {
            currentCoderFile = null;
            openTabs = [];
            editorStates.clear();
            if (monacoEditor) {
                monacoEditor.setValue('// No file open');
            }
            currentFileDisplay.textContent = 'No file selected.';
            functionList.innerHTML = '<p class="text-xs text-gray-500">Select a file to see its functions.</p>';
            saveFileBtn.disabled = true;
            undoBtn.disabled = true;
            redoBtn.disabled = true;
            openAuditModalBtn.disabled = true;
            document.getElementById('generate-tests-btn').disabled = true;
            auditButtons.forEach(btn => btn.disabled = true);
            renderTabs();
        }

        function closeTab(filePathToClose) {
            const index = openTabs.indexOf(filePathToClose);
            if (index === -1) return;

            openTabs.splice(index, 1);
            editorStates.delete(filePathToClose);

            if (currentCoderFile === filePathToClose) {
                if (openTabs.length > 0) {
                    const newIndex = Math.max(0, index - 1);
                    switchToTab(openTabs[newIndex]);
                } else {
                    clearEditor();
                }
            } else {
                renderTabs();
            }
        }

        function deleteItem(path, isFolder) {
            const itemType = isFolder ? 'folder' : 'file';
            const shortPath = path.split('/').pop();
            const confirmation = confirm(`Are you sure you want to delete the ${itemType} "${shortPath}"?\n\nThis cannot be undone.`);

            if (!confirmation) return;

            if (isFolder) {
                const keysToDelete = Array.from(fileMap.keys()).filter(key => key.startsWith(path + '/'));
                if (fileMap.has(path)) keysToDelete.push(path);

                keysToDelete.forEach(key => {
                    if (currentCoderFile === key) clearEditorState();
                    fileMap.delete(key);
                });
            } else {
                if (currentCoderFile === path) clearEditorState();
                fileMap.delete(path);
            }

            log(`Deleted ${itemType}: ${path}`, 'warn');
            showStatusMessage(`Deleted '${shortPath}'`);

            buildAndRenderFileTree(fileMap, currentOnFileClickCallback);
        }

        function renameItem(path, isFolder) {
            const itemType = isFolder ? 'folder' : 'file';
            const oldName = path.split('/').pop();
            const newName = prompt(`Enter the new name for the ${itemType} "${oldName}":`, oldName);

            if (!newName || newName.trim() === '' || newName === oldName) {
                return;
            }

            if (newName.includes('/')) {
                alert('Error: New name cannot contain a forward slash (/).');
                return;
            }

            const parentPath = path.substring(0, path.lastIndexOf('/'));
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;

            if (Array.from(fileMap.keys()).some(key => key === newPath || key.startsWith(newPath + '/'))) {
                alert(`Error: A file or folder named "${newName}" already exists in this location.`);
                return;
            }

            if (isFolder) {
                const filesToMove = Array.from(fileMap.entries()).filter(([key]) => key.startsWith(path + '/'));
                if(fileMap.has(path)) filesToMove.push([path, fileMap.get(path)]);

                filesToMove.forEach(([oldKey, file]) => {
                    const newKey = oldKey.replace(path, newPath);
                    fileMap.set(newKey, file);
                    fileMap.delete(oldKey);
                    if (currentCoderFile === oldKey) {
                        currentCoderFile = newKey;
                        currentFileDisplay.textContent = `Editing: ${newKey}`;
                    }
                });
            } else {
                const file = fileMap.get(path);
                fileMap.set(newPath, file);
                fileMap.delete(path);
                if (currentCoderFile === path) {
                    currentCoderFile = newPath;
                    currentFileDisplay.textContent = `Editing: ${newPath}`;
                }
            }

            log(`Renamed ${itemType}: ${path} to ${newPath}`, 'info');
            showStatusMessage(`Renamed to '${newName}'`);

            buildAndRenderFileTree(fileMap, currentOnFileClickCallback);
        }

        function newFile() {
            const path = prompt("Enter the full path for the new file (e.g., 'src/components/Button.js'):", "new-file.js");
            if (!path || path.trim() === '') return;

            if (fileMap.has(path) || Array.from(fileMap.keys()).some(key => key.startsWith(path + '/'))) {
                alert(`Error: A file or folder at "${path}" already exists.`);
                return;
            }

            const newFile = new File([""], path.split('/').pop(), { type: "text/plain" });
            fileMap.set(path, newFile);

            log(`Created new file: ${path}`, 'info');
            showStatusMessage(`Created file '${path}'`);
            buildAndRenderFileTree(fileMap, currentOnFileClickCallback);
        }

        function newFolder() {
            const path = prompt("Enter the full path for the new folder (e.g., 'src/assets'):", "new-folder");
            if (!path || path.trim() === '') return;

            const placeholderPath = path.endsWith('/') ? `${path}.keep` : `${path}/.keep`;

            if (fileMap.has(path) || fileMap.has(placeholderPath) || Array.from(fileMap.keys()).some(key => key.startsWith(path + '/'))) {
                alert(`Error: A folder at "${path}" already exists.`);
                return;
            }

            const newFile = new File([""], ".keep", { type: "text/plain" });
            fileMap.set(placeholderPath, newFile);

            log(`Created new folder: ${path}`, 'info');
            showStatusMessage(`Created folder '${path}'`);
            buildAndRenderFileTree(fileMap, currentOnFileClickCallback);
        }

        async function downloadProjectZip() {
            if (fileMap.size === 0) {
                showStatusMessage('No project loaded to download.');
                return;
            }

            showStatusMessage('Zipping project files...', 5000);
            log('Starting project zip export...');

            const zip = new JSZip();
            for (const [path, file] of fileMap.entries()) {
                // Don't include placeholder files in the download
                if (file.name === '.keep') continue;
                zip.file(path, file);
            }

            try {
                const content = await zip.generateAsync({type:"blob"});
                const rootDir = fileInput.files[0]?.webkitRelativePath.split('/')[0] || 'project';

                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${rootDir}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                log('Project downloaded as zip.', 'success');
                showStatusMessage('Download complete!');
            } catch (err) {
                log(`Error creating zip file: ${err.message}`, 'error', err);
                showStatusMessage('Failed to create zip file.');
            }
        }

        function buildAndRenderFileTree(files, onFileClick) {
            const tree = {};
            for (const path of files.keys()) {
                let currentLevel = tree;
                path.split('/').forEach((part, i, arr) => {
                    if (!currentLevel[part]) currentLevel[part] = {};
                    if (i < arr.length - 1) currentLevel = currentLevel[part];
                });
            }
            fileTreeContainer.innerHTML = '';
            renderTree(tree, fileTreeContainer, '', onFileClick);
        }

        function renderTree(node, container, basePath, onFileClick) {
            Object.keys(node).sort().forEach(key => {
                const isFolder = Object.keys(node[key]).length > 0;
                const currentPath = basePath ? `${basePath}/${key}` : key;

                const itemEl = document.createElement('div');
                itemEl.className = 'file-tree-item';

                const itemIcon = document.createElement('span');
                itemIcon.className = 'mr-2';
                itemIcon.textContent = isFolder ? '📁' : '📄';

                const itemName = document.createElement('span');
                itemName.className = 'flex-grow truncate';
                itemName.textContent = key;
                itemName.title = key;

                const itemContent = document.createElement('div');
                itemContent.className = 'flex-grow flex items-center cursor-pointer';
                itemContent.appendChild(itemIcon);
                itemContent.appendChild(itemName);

                if (isFolder) {
                    itemContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // The childrenContainer is the next sibling of itemEl
                        if (itemEl.nextElementSibling) {
                            itemEl.nextElementSibling.classList.toggle('hidden');
                        }
                    });
                } else if (onFileClick) {
                    itemContent.addEventListener('click', (e) => { e.stopPropagation(); onFileClick(currentPath); });
                }

                itemEl.appendChild(itemContent);

                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'file-actions flex items-center space-x-1 flex-shrink-0';

                const renameBtn = document.createElement('button');
                renameBtn.className = 'action-btn';
                renameBtn.title = `Rename ${key}`;
                renameBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
                renameBtn.addEventListener('click', (e) => { e.stopPropagation(); renameItem(currentPath, isFolder); });
                actionsContainer.appendChild(renameBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn';
                deleteBtn.title = `Delete ${key}`;
                deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
                deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteItem(currentPath, isFolder); });
                actionsContainer.appendChild(deleteBtn);

                if (!isFolder) {
                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'action-btn';
                    downloadBtn.title = `Download ${key}`;
                    downloadBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                    downloadBtn.addEventListener('click', (e) => { e.stopPropagation(); downloadFile(currentPath); });
                    actionsContainer.appendChild(downloadBtn);
                }

                itemEl.appendChild(actionsContainer);
                container.appendChild(itemEl);

                if (isFolder) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'file-tree-children hidden';
                    renderTree(node[key], childrenContainer, currentPath, onFileClick);
                    container.appendChild(childrenContainer);
                }
            });
        }

        // --- PAIR CODER SCRIPT ---
        let monacoEditor = null;

        const setupPairCoder = () => {
            const chatHistoryContainer = document.getElementById('chat-history');
            const chatForm = document.getElementById('chat-form');
            const chatInput = document.getElementById('chat-input');
            const codeEditorContainer = document.getElementById('code-editor');
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            const copyCodeBtn = document.getElementById('copy-code-btn');

            let chatHistory = [];

            const autoResizeChatInput = () => {
                chatInput.style.height = 'auto';
                const scrollHeight = chatInput.scrollHeight;
                const maxHeight = 24 * 6;
                chatInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
            };
            chatInput.addEventListener('input', autoResizeChatInput);

            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            });

            const addMessageToChat = (text, sender, addToApiHistory = true) => {
                const messageEl = document.createElement('div');
                messageEl.className = `chat-message ${sender} p-3 rounded-lg max-w-xl text-sm`;
                messageEl.textContent = text;
                chatHistoryContainer.appendChild(messageEl);
                chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
                if (addToApiHistory) {
                    chatHistory.push({ role: (sender === 'user' ? 'user' : 'model'), parts: [{ text }] });
                }
            };

            const handleChatSubmit = async (event) => {
                event.preventDefault();
                const userInput = chatInput.value.trim();
                if (!userInput) return;

                const projectKeywords = ['project', 'architecture', 'entire', 'whole', 'overall', 'full project', 'complete app'];
                const refactorKeywords = ['refactor', 'rename all', 'update all', 'apply to all', 'across the project'];

                const isRefactorQuery = fileMap.size > 0 && refactorKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
                const isProjectQuery = fileMap.size > 0 && !isRefactorQuery && projectKeywords.some(keyword => userInput.toLowerCase().includes(keyword));

                if (!currentCoderFile && !isProjectQuery && !isRefactorQuery) {
                    showStatusMessage('Please select a file before making a code request.');
                    return;
                }

                addMessageToChat(userInput, 'user');
                chatInput.value = '';
                autoResizeChatInput();

                const thinkingEl = document.createElement('div');
                thinkingEl.className = 'chat-message ai p-3 rounded-lg max-w-xl text-sm';
                thinkingEl.innerHTML = '<div class="spinner w-5 h-5"></div>';
                chatHistoryContainer.appendChild(thinkingEl);
                chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

                try {
                    let systemPrompt;
                    let fullContext = '';

                    if (isRefactorQuery || isProjectQuery) {
                        showStatusMessage('Analyzing project...');
                        const fileContents = [];
                        for (const [path, file] of fileMap.entries()) {
                            if (file.name === '.keep') continue;
                            const content = await file.text();
                            fileContents.push(`--- FILE: ${path} ---\n\n${content}`);
                        }
                        fullContext = fileContents.join('\n\n');
                    }

                    if (isRefactorQuery) {
                        systemPrompt = `You are an expert AI programmer performing a project-wide refactor. Analyze the user's request and the provided source code. Your task is to determine which files need to be changed and generate the complete, new content for each of those files.
Your response MUST be ONLY a valid JSON array of objects. Each object must have two keys: "filePath" (a string) and "newContent" (a string with the full new file content).
Do NOT include any other text, explanations, or markdown.
Example format: [{"filePath": "src/App.js", "newContent": "..."}]
Full Project Source Code:\n${fullContext}`;
                    } else if (isProjectQuery) {
                        systemPrompt = `You are SP1D3R, an expert software architect. The user wants to discuss the entire project. Analyze the provided source code from all project files to answer their question. Do not suggest code modifications unless explicitly asked.\n\nFull Project Source Code:\n${fullContext}`;
                    } else {
                        const currentCode = monacoEditor ? monacoEditor.getValue() : '';
                        systemPrompt = `You are SP1D3R, an expert AI pair programmer with two primary capabilities:
                            1. CODE MODIFICATION: If the user provides an instruction to create, modify, or refactor code for the currently selected file ('${currentCoderFile || 'none'}'), your ENTIRE response MUST be ONLY the complete, updated, raw source code for that file. Do not include explanations or markdown.
                            2. CONVERSATIONAL Q&A: If the user asks a question, requests information, or has a general conversation, you must respond as a helpful AI assistant. For up-to-date or specific programming information, you MUST use the provided Google Search tool. Your answer should be in a clear, conversational format.
                            Current Code Context:\n\`\`\`\n${currentCode}\n\`\`\``;
                    }

                    const aiResponse = await callGeminiAPI(systemPrompt, chatHistory, true);

                    try {
                        const parsedResponse = JSON.parse(aiResponse);
                        if (Array.isArray(parsedResponse) && parsedResponse.every(item => item.filePath && item.newContent)) {
                            showRefactorReview(parsedResponse);
                        } else {
                           throw new Error("Invalid JSON format for refactoring.");
                        }
                    } catch (e) {
                        // Not a JSON response, treat as normal chat or code update
                        const codeBlockRegex = /^(<!DOCTYPE html>|import |const |let |var |function |class |\/\*|@|public |private |if \()/im;
                        if (codeBlockRegex.test(aiResponse) && !isProjectQuery && !isRefactorQuery) {
                            if (monacoEditor) monacoEditor.setValue(aiResponse);
                            addMessageToChat("I've updated the code in the Main Canvas based on your request.", 'ai', false);
                        } else {
                            addMessageToChat(aiResponse, 'ai');
                        }
                    }
                } catch (error) {
                    addMessageToChat(`Error: ${error.message}`, 'ai', false);
                } finally {
                    chatHistoryContainer.removeChild(thinkingEl);
                }
            };

            const handleCopyClick = (buttonElement) => {
                const textToCopy = monacoEditor ? monacoEditor.getValue() : '';
                if (!textToCopy || textToCopy.trim() === '') { showStatusMessage('Nothing to copy.'); return; }
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = 'Copied!';
                    setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
                }).catch(err => { showStatusMessage('Failed to copy.'); });
            };

            const getLanguageForFile = (filename) => {
                const extension = "." + filename.split('.').pop();
                if (!monaco.languages.getLanguages) return 'plaintext';
                const languages = monaco.languages.getLanguages();
                const lang = languages.find(l => l.extensions && l.extensions.includes(extension));
                return lang ? lang.id : 'plaintext';
            };

            // --- MONACO INITIALIZATION ---
            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.53.0/min/vs' }});
            window.MonacoEnvironment = { getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = { baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.53.0/min/' };
                importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.53.0/min/vs/base/worker/workerMain.js');`
            )}` };

            require(['vs/editor/editor.main'], function() {
                monacoEditor = monaco.editor.create(codeEditorContainer, {
                    value: '// Load a project, then select a file to begin coding.',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontFamily: "'Source Code Pro', monospace",
                    backgroundColor: '#161b22',
                    scrollBeyondLastLine: false,
                    minimap: { enabled: false }
                });

                // --- Re-bind event listeners that depend on the editor ---
                chatForm.addEventListener('submit', handleChatSubmit);
                copyCodeBtn.addEventListener('click', () => handleCopyClick(copyCodeBtn));

                undoBtn.addEventListener('click', () => { if(monacoEditor) monacoEditor.trigger('source', 'undo'); });
                redoBtn.addEventListener('click', () => { if(monacoEditor) monacoEditor.trigger('source', 'redo'); });

                selectFileBtn.addEventListener('click', () => {
                    openFileTreeModal('Select a File to Edit', (filePath) => {
                        openFileInTab(filePath);
                        closeModal(fileTreeModal);
                    });
                });

                saveFileBtn.addEventListener('click', async () => {
                    if (currentCoderFile && monacoEditor) {
                        const newContent = monacoEditor.getValue();
                        const originalFile = fileMap.get(currentCoderFile);
                        fileMap.set(currentCoderFile, new File([newContent], originalFile.name, { type: originalFile.type }));
                        showStatusMessage(`'${currentCoderFile}' saved.`);
                        await refreshEmulator();
                        refreshGitStatus();
                    }
                });
            });
        };

        // --- Refactor Review Modal Logic ---
        const refactorReviewModal = document.getElementById('refactor-review-modal');
        const closeRefactorModalBtn = document.getElementById('close-refactor-modal-btn');
        const refactorFileList = document.getElementById('refactor-file-list');
        const refactorDiffView = document.getElementById('refactor-diff-view');
        const refactorSummary = document.getElementById('refactor-summary');
        const cancelRefactorBtn = document.getElementById('cancel-refactor-btn');
        const approveRefactorBtn = document.getElementById('approve-refactor-btn');

        let currentChanges = [];

        async function showRefactorReview(changes) {
            currentChanges = changes;
            refactorFileList.innerHTML = '';
            refactorDiffView.innerHTML = '<p class="text-gray-500">Select a file to see the changes.</p>';
            refactorSummary.textContent = `${changes.length} file(s) will be changed.`;

            changes.forEach((change, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'p-2 rounded-md cursor-pointer hover:bg-gray-700 text-sm truncate';
                fileItem.textContent = change.filePath;
                fileItem.title = change.filePath;
                fileItem.onclick = async () => {
                    Array.from(refactorFileList.children).forEach(child => child.classList.remove('bg-blue-600'));
                    fileItem.classList.add('bg-blue-600');

                    const originalFile = fileMap.get(change.filePath);
                    const originalContent = originalFile ? await originalFile.text() : '';
                    const diff = Diff.diffLines(originalContent, change.newContent);

                    const fragment = document.createDocumentFragment();
                    diff.forEach((part) => {
                        const span = document.createElement('span');
                        const className = part.added ? 'diff-added' : part.removed ? 'diff-removed' : '';
                        span.className = `diff-line ${className}`;
                        span.appendChild(document.createTextNode(part.value));
                        fragment.appendChild(span);
                    });

                    refactorDiffView.innerHTML = '';
                    refactorDiffView.appendChild(fragment);
                };
                refactorFileList.appendChild(fileItem);
            });

            // Automatically click the first file
            if (refactorFileList.firstChild) {
                refactorFileList.firstChild.click();
            }

            openModal(refactorReviewModal);
        }

        closeRefactorModalBtn.addEventListener('click', () => closeModal(refactorReviewModal));
        cancelRefactorBtn.addEventListener('click', () => {
            closeModal(refactorReviewModal);
            currentChanges = [];
        });

        approveRefactorBtn.addEventListener('click', async () => {
            if (currentChanges.length === 0) return;

            log(`Applying ${currentChanges.length} refactoring changes...`, 'info');

            for (const change of currentChanges) {
                const originalFile = fileMap.get(change.filePath);
                const newFile = new File([change.newContent], originalFile ? originalFile.name : change.filePath.split('/').pop(), { type: originalFile?.type || 'text/plain' });
                fileMap.set(change.filePath, newFile);

                if (currentCoderFile === change.filePath && monacoEditor) {
                    monacoEditor.setValue(change.newContent);
                }
            }

            showStatusMessage('Refactoring complete! Refreshing emulator...');
            await refreshEmulator();

            closeModal(refactorReviewModal);
            currentChanges = [];
        });

        // --- Unit Test Generation Logic ---
        const generateTestsBtn = document.getElementById('generate-tests-btn');

        async function generateUnitTests() {
            if (!currentCoderFile || !monacoEditor) {
                showStatusMessage('Please open a file to generate tests for.', 3000);
                return;
            }

            const filePath = currentCoderFile;
            const fileContent = monacoEditor.getValue();

            showStatusMessage('Generating unit tests with AI...', 5000);
            log(`Generating tests for ${filePath}...`);

            const systemPrompt = `You are a software testing expert specializing in JavaScript. Your task is to write a complete unit test file for the provided source code using the Jest testing framework.
- Use the modern \`expect\` syntax (e.g., \`expect(result).toBe(true);\`).
- Mock any imported dependencies where necessary.
- Generate comprehensive test cases that cover the main functionality, edge cases, and potential error conditions.
- The response should be ONLY the raw JavaScript code for the test file. Do not include any explanations, markdown formatting, or any text other than the code itself.

File to be tested: ${filePath}
---
Source Code:
\`\`\`javascript
${fileContent}
\`\`\`
`;
            try {
                const testCode = await callGeminiAPI(systemPrompt, [], false);

                const originalPath = filePath;
                const extensionIndex = originalPath.lastIndexOf('.');
                const basePath = extensionIndex === -1 ? originalPath : originalPath.substring(0, extensionIndex);
                const extension = extensionIndex === -1 ? '' : originalPath.substring(extensionIndex);
                const testFilePath = `${basePath}.test${extension}`;

                const testFile = new File([testCode], testFilePath.split('/').pop(), { type: 'text/javascript' });
                fileMap.set(testFilePath, testFile);

                log(`Created new test file: ${testFilePath}`, 'success');
                showStatusMessage('Test file created! Opening in new tab...', 4000);

                openFileInTab(testFilePath);

            } catch (error) {
                addMessageToChat(`Error generating tests: ${error.message}`, 'ai', false);
                log(`Error generating tests for ${filePath}`, 'error', error);
            }
        }

        generateTestsBtn.addEventListener('click', generateUnitTests);

        // --- Editor Tab Logic ---
        function renderTabs() {
            const tabsContainer = document.getElementById('editor-tabs');
            tabsContainer.innerHTML = '';

            openTabs.forEach(filePath => {
                const tabEl = document.createElement('div');
                tabEl.className = 'editor-tab';
                if (filePath === currentCoderFile) {
                    tabEl.classList.add('active');
                }
                tabEl.textContent = filePath.split('/').pop();
                tabEl.title = filePath;

                const closeBtn = document.createElement('span');
                closeBtn.className = 'tab-close-btn';
                closeBtn.innerHTML = '&times;';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    closeTab(filePath);
                };

                tabEl.appendChild(closeBtn);
                tabEl.onclick = () => {
                    switchToTab(filePath);
                };

                tabsContainer.appendChild(tabEl);
            });
        }

        function switchToTab(filePath) {
            if (!monacoEditor || currentCoderFile === filePath) return;

            // Save view state of the outgoing file
            if (currentCoderFile && monacoEditor.getModel()) {
                editorStates.set(currentCoderFile, monacoEditor.saveViewState());
            }

            const file = fileMap.get(filePath);
            if (file) {
                file.text().then(content => {
                    currentCoderFile = filePath;

                    // Create a new model to have a separate undo/redo stack
                    const newModel = monaco.editor.createModel(content, getLanguageForFile(filePath));
                    monacoEditor.setModel(newModel);

                    // Restore the view state for the incoming file
                    const savedState = editorStates.get(filePath);
                    if (savedState) {
                        monacoEditor.restoreViewState(savedState);
                    }
                    monacoEditor.focus();

                    // Update the rest of the UI
                    parseAndDisplayFunctions(content, filePath.split('.').pop());
                    chatHistory = [];
                    currentFileDisplay.textContent = `Editing: ${filePath}`;
                    saveFileBtn.disabled = false;
                    auditButtons.forEach(btn => btn.disabled = false);
                    document.getElementById('generate-tests-btn').disabled = false;
                    undoBtn.disabled = false;
                    redoBtn.disabled = false;

                    renderTabs();
                });
            }
        }

        function openFileInTab(filePath) {
            if (!openTabs.includes(filePath)) {
                openTabs.push(filePath);
            }
            switchToTab(filePath);
        }

        // --- Git Logic ---
        const cloneRepoBtn = document.getElementById('clone-repo-btn');
        const gitStatusList = document.getElementById('git-status-list');
        const commitMessageInput = document.getElementById('commit-message-input');
        const commitBtn = document.getElementById('commit-btn');
        const pushBtn = document.getElementById('push-btn');
        const gitLogList = document.getElementById('git-log-list');
        const gitRefreshBtn = document.getElementById('git-refresh-btn');

        async function updateFilesInVS() {
            for (const [path, file] of fileMap.entries()) {
                await pfs.writeFile(`/project/${path}`, await file.text());
            }
        }

        async function refreshGitStatus() {
            await updateFilesInVS();
            const status = await git.statusMatrix({ fs, dir: '/project' });
            gitStatusList.innerHTML = '';
            const changedFiles = status.filter(row => row[1] !== row[2] || row[1] !== row[3]);

            if (changedFiles.length === 0) {
                gitStatusList.innerHTML = '<p class="text-gray-500">No changes detected.</p>';
                commitBtn.disabled = true;
                return;
            }

            changedFiles.forEach(([filepath, head, workdir, stage]) => {
                const statusText = workdir === 0 ? 'new' : workdir === 2 ? 'modified' : 'deleted';
                const isStaged = stage === 2;
                const fileItem = document.createElement('div');
                fileItem.className = 'flex justify-between items-center p-1 rounded-md';
                fileItem.innerHTML = `
                    <span class="truncate" title="${filepath}">${filepath} (${isStaged ? 'staged' : statusText})</span>
                    <button class="navigator-btn text-xs px-2 py-1">${isStaged ? 'Unstage' : 'Stage'}</button>
                `;
                fileItem.querySelector('button').onclick = async () => {
                    if (isStaged) {
                        await git.remove({ fs, dir: '/project', filepath });
                    } else {
                        await git.add({ fs, dir: '/project', filepath });
                    }
                    refreshGitStatus();
                };
                gitStatusList.appendChild(fileItem);
            });
            commitBtn.disabled = !status.some(row => row[3] === 2);
        }

        async function refreshGitLog() {
            try {
                const commits = await git.log({ fs, dir: '/project', depth: 15 });
                gitLogList.innerHTML = commits.map(commit => `
                    <div class="p-1 border-b border-gray-800">
                        <p class="font-semibold text-blue-400">${commit.oid.slice(0, 7)}</p>
                        <p class="text-sm">${commit.commit.message.trim()}</p>
                        <p class="text-xs text-gray-500">${commit.commit.author.name} on ${new Date(commit.commit.author.timestamp * 1000).toLocaleDateString()}</p>
                    </div>
                `).join('');
            } catch (e) {
                gitLogList.innerHTML = '<p class="text-gray-500">No commit history yet.</p>';
            }
        }

        commitBtn.addEventListener('click', async () => {
            const message = commitMessageInput.value;
            if (!message) {
                alert('Please enter a commit message.');
                return;
            }
            await git.commit({
                fs,
                dir: '/project',
                message,
                author: { name: 'SP1D3R User', email: 'user@sp1d3r.dev' }
            });
            commitMessageInput.value = '';
            refreshGitStatus();
            refreshGitLog();
            pushBtn.disabled = false;
        });

        async function pushToGitHub() {
            log('Pushing to remote repository...');
            pushBtn.disabled = true;
            pushBtn.textContent = 'Pushing...';

            try {
                const result = await git.push({
                    fs,
                    dir: '/project',
                    onAuth: () => ({ username: localStorage.getItem('githubPat') || '' }),
                });

                if (result.ok) {
                    log('Push successful.', 'success');
                    showStatusMessage('Changes pushed successfully!');
                    pushBtn.disabled = true; // Disable after successful push
                } else {
                    throw new Error(result.error);
                }
            } catch (e) {
                log(`Error pushing to repository: ${e.message}`, 'error', e);
                alert(`Failed to push to repository. Check your Personal Access Token permissions. Error: ${e.message}`);
                pushBtn.disabled = false;
            } finally {
                pushBtn.textContent = 'Push';
                refreshGitLog();
            }
        }

        pushBtn.addEventListener('click', pushToGitHub);
        gitRefreshBtn.addEventListener('click', refreshGitStatus);

        async function loadFilesFromFS(dir) {
            fileMap.clear();
            const walk = async (currentDir) => {
                const entries = await pfs.readdir(currentDir);
                for (const entry of entries) {
                    const path = `${currentDir}/${entry}`;
                    const stat = await pfs.stat(path);
                    if (stat.isDirectory()) {
                        await walk(path);
                    } else {
                        const content = await pfs.readFile(path);
                        const relativePath = path.substring(dir.length + 1);
                        const file = new File([content], entry, { type: 'text/plain' });
                        fileMap.set(relativePath, file);
                    }
                }
            };
            await walk(dir);
            log(`Loaded ${fileMap.size} files into the editor.`, 'success');
        }

        async function cloneRepository() {
            const url = prompt("Enter the GitHub repository URL to clone (e.g., https://github.com/user/repo):");
            if (!url) return;

            clearEditor();
            fileMap.clear();

            loadingState.style.display = 'flex';
            instructions.style.display = 'none';
            log(`Cloning repository from ${url}...`);

            const dir = '/project';
            try {
                try { await pfs.rm(dir, { recursive: true }); } catch (e) { /* ignore */ }
                await pfs.mkdir(dir);

                await git.clone({
                    fs,
                    dir,
                    url,
                    corsProxy: 'https://cors.isomorphic-git.org',
                    singleBranch: true,
                    depth: 1,
                    onAuth: () => ({ username: localStorage.getItem('githubPat') || '' }),
                });

                log('Clone successful. Reading files...', 'success');
                await loadFilesFromFS(dir);

                selectProjectBtn.classList.add('hidden');
                document.getElementById('file-input').style.display = 'none';
                viewFilesBtn.classList.remove('hidden');
                resetBtn.classList.remove('hidden');
                document.getElementById('download-zip-btn').classList.remove('hidden');
                selectFileBtn.disabled = false;
                runAuditBtn.disabled = false;
                openAuditModalBtn.disabled = false;

                if (fileMap.has('README.md')) {
                    openFileInTab('README.md');
                }

                refreshGitStatus();
                refreshGitLog();

            } catch (e) {
                log(`Error cloning repository: ${e.message}`, 'error', e);
                alert(`Failed to clone repository. Check the URL and your Personal Access Token. Error: ${e.message}`);
            } finally {
                loadingState.style.display = 'none';
            }
        }

        cloneRepoBtn.addEventListener('click', cloneRepository);

        // --- Audit & Analysis Logic ---
        const analysisModalContent = document.getElementById('analysis-modal-content');
        const closeAnalysisModalBtn = document.getElementById('close-analysis-modal-btn');

        openAuditModalBtn.addEventListener('click', () => openModal(auditModal));
        closeAuditModalBtn.addEventListener('click', () => closeModal(auditModal));

        const simpleMarkdownToHtml = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>').replace(/<\/ul>\n<ul>/g, '').replace(/^(#+) (.*$)/gm, (m, h, c) => `<h${h.length+2}>${c}</h${h.length+2}>`).replace(/\n/g, '<br>');

        const showAnalysis = (content) => {
            analysisModalContent.innerHTML = simpleMarkdownToHtml(content);
            openModal(analysisModal);
        };

        runAuditBtn.addEventListener('click', async () => {
            const userPrompt = analysisPromptInput.value.trim();
            if (fileMap.size === 0) { showStatusMessage('Please load a project first.'); return; }
            if (!userPrompt) { showStatusMessage('Please describe what to audit.'); return; }

            closeModal(auditModal);
            analysisModalContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full"><div class="spinner"></div><p class="mt-4">Running custom audit...</p></div>`;
            openModal(analysisModal);

            try {
                let systemPrompt, content, historyForApi = [];
                if (currentCoderFile) {
                     content = await fileMap.get(currentCoderFile)?.text() || '';
                     systemPrompt = `You are an expert code reviewer. Analyze the following code from '${currentCoderFile}' for the following user request: "${userPrompt}". Provide a concise report in Markdown format.`;
                } else {
                    content = '';
                    for (const [path, file] of fileMap.entries()) content += `--- FILE: ${path} ---\n\n${await file.text()}\n\n`;
                    systemPrompt = `You are a Principal Software Architect. Conduct a comprehensive review of the provided project source code. The user's specific analysis request is: "${userPrompt}". Evaluate based on: Architectural Soundness, Code Quality, Functionality, and Usability/UX. Provide a detailed analysis in Markdown format.`;
                }
                historyForApi.push({role: 'user', parts: [{text: content}]})
                const report = await callGeminiAPI(systemPrompt, historyForApi, false);
                showAnalysis(report);
            } catch (error) {
                showAnalysis(`<h3>Error during audit</h3><p>${error.message}</p>`);
            }
        });

        auditButtons.forEach(button => button.addEventListener('click', async (e) => {
            const analysisType = e.currentTarget.dataset.analysis;
            if (!currentCoderFile) { showStatusMessage('Please select a file first.'); return; }

            closeModal(auditModal);
            analysisModalContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full"><div class="spinner"></div><p class="mt-4">Analyzing ${analysisType}...</p></div>`;
            openModal(analysisModal);
            try {
                const code = await fileMap.get(currentCoderFile)?.text() || '';
                const systemPrompt = `You are an expert code reviewer. Analyze the code from '${currentCoderFile}' specifically for ${analysisType}. Provide a concise report in Markdown format.`;
                const report = await callGeminiAPI(systemPrompt, [{role: 'user', parts: [{text: code}]}], false);
                showAnalysis(report);
            } catch(error) {
                showAnalysis(`<h3>Error during analysis</h3><p>${error.message}</p>`);
            }
        }));

        closeAnalysisModalBtn.addEventListener('click', () => closeModal(analysisModal));

            // --- Settings Modal ---
            const settingsBtn = document.getElementById('settings-btn');
            const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
            const saveSettingsBtn = document.getElementById('save-settings-btn');
            const apiKeyInput = document.getElementById('api-key-input');
            const githubPatInput = document.getElementById('github-pat-input');
            settingsBtn.addEventListener('click', () => {
                apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
                githubPatInput.value = localStorage.getItem('githubPat') || '';
                openModal(settingsModal);
            });
            cancelSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
            saveSettingsBtn.addEventListener('click', () => {
                localStorage.setItem('geminiApiKey', apiKeyInput.value);
                localStorage.setItem('githubPat', githubPatInput.value);
                closeModal(settingsModal);
            });

            // --- Resizable Columns Logic ---
            let isResizing = false;
            resizer.addEventListener('mousedown', () => { isResizing = true; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', () => { isResizing = false; document.removeEventListener('mousemove', handleMouseMove); }); });
            function handleMouseMove(e) {
                if (!isResizing) return;
                const containerRect = coderView.getBoundingClientRect();
                const newSidebarWidth = e.clientX - containerRect.left;
                const newSidebarWidthPercent = (newSidebarWidth / containerRect.width) * 100;
                if (newSidebarWidthPercent > 20 && newSidebarWidthPercent < 80) {
                    coderSidebar.style.width = `${newSidebarWidthPercent}%`;
                    mainCoderPanel.style.width = `${100 - newSidebarWidthPercent}%`;
                }
            }

            // --- Function Parsing Logic ---
            function parseAndDisplayFunctions(code, lang) {
                functionList.innerHTML = '';
                const functionRegex = /(?:function\s+([a-zA-Z0-9_]+)\s*\(|const\s+([a-zA-Z0-9_]+)\s*=\s*\(?\s*async\s*\)?\s*=>|const\s+([a-zA-Z0-9_]+)\s*=\s*\(.*\)\s*=>)/g;
                const funcs = [...code.matchAll(functionRegex)].map(m => m[1] || m[2] || m[3]).filter(Boolean);
                if (funcs.length > 0) {
                    funcs.forEach(name => {
                        const item = document.createElement('a');
                        item.href = '#'; item.textContent = name; item.className = 'block text-sm p-1 rounded hover:bg-gray-700 code-font';
                        item.onclick = (e) => { e.preventDefault(); scrollToFunction(name); };
                        functionList.appendChild(item);
                    });
                } else {
                    functionList.innerHTML = '<p class="text-xs text-gray-500">No functions found.</p>';
                }
            }
            function scrollToFunction(functionName) { /* ... implementation omitted for brevity ... */ }


        // --- Central API Caller ---
        async function callGeminiAPI(systemPrompt, conversationHistory, enableSearch) {
            const apiKey = localStorage.getItem('geminiApiKey');
            if (!apiKey) throw new Error('API Key not set in Settings.');

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

            const payload = {
                contents: conversationHistory,
                systemInstruction: { parts: [{ text: systemPrompt }] }
            };

            if (enableSearch) {
                payload.tools = [{ "google_search": {} }];
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
            }

            const result = await response.json();
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) throw new Error('API returned an empty response.');
            return generatedText.replace(/```[\w\s-]*\n/g, '').replace(/```/g, '').trim();
        }

        // --- INITIALIZER ---
        async function main() {
            const loadScript = (src) => new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src; script.crossOrigin = 'anonymous';
                script.onload = resolve; script.onerror = () => reject(new Error(`Failed to load: ${src}`));
                document.head.appendChild(script);
            });

            try {
                log('Initializing virtual file system...');
                fs = new LightningFS('fs');
                pfs = fs.promises;
                git.plugins.set('fs', fs);
                log('Virtual file system ready.', 'success');

                setupPairCoder();
                log('Pair Coder initialized.', 'success');
                log('Please select a project to begin.');
            } catch (err) {
                log(err.message, 'error', err);
            }
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                allModals.forEach(modal => closeModal(modal));
            }
        });

        window.addEventListener('error', (event) => log(`Unhandled error: ${event.message}`, 'error', { filename: event.filename, lineno: event.lineno, error: event.error?.stack }));
        window.addEventListener('unhandledrejection', (event) => log(`Unhandled promise rejection`, 'error', event.reason?.stack || event.reason));

        main();
