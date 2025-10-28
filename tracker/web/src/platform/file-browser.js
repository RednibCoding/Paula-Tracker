/**
 * Browser File I/O Adapter
 * Handles loading and saving MOD files using browser APIs
 */

import { loadMOD, saveMOD } from '../../../../paulalib/modloader.js';

/**
 * Load MOD file from URL (fetch)
 * @param {string} url - URL to MOD file
 * @returns {Promise<Song>}
 */
export async function loadFromURL(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return loadMOD(arrayBuffer);
}

/**
 * Load MOD file from user file input
 * @param {File} file - File object from input element
 * @returns {Promise<Song>}
 */
export function loadFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const song = loadMOD(e.target.result);
                resolve(song);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Save MOD file to user's computer
 * @param {Song} song - Song to save
 * @param {string} filename - Suggested filename
 */
export async function saveToFile(song, filename = 'song.mod') {
    const data = saveMOD(song);
    
    // Try modern File System Access API first
    if ('showSaveFilePicker' in window) {
        try {
            const options = {
                suggestedName: filename,
                types: [{
                    description: 'ProTracker MOD File',
                    accept: { 'application/octet-stream': ['.mod'] }
                }]
            };
            
            const handle = await window.showSaveFilePicker(options);
            
            // Update song title from chosen filename
            const savedFilename = handle.name;
            const titleWithoutExt = savedFilename.replace(/\.mod$/i, '');
            song.title = titleWithoutExt.substring(0, 20);
            
            // Re-save with updated title
            const updatedData = saveMOD(song);
            
            const writable = await handle.createWritable();
            await writable.write(updatedData);
            await writable.close();
            
            console.log('File saved:', savedFilename);
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Save failed:', err);
            }
            return;
        }
    }
    
    // Fallback: automatic download
    const titleWithoutExt = filename.replace(/\.mod$/i, '');
    song.title = titleWithoutExt.substring(0, 20);
    const updatedData = saveMOD(song);
    
    const blob = new Blob([updatedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Create file input element for loading MOD files
 * @param {Function} onLoad - Callback with loaded Song
 */
export function createFileInput(onLoad) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mod';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const song = await loadFromFile(file);
                onLoad(song, file.name);
            } catch (err) {
                console.error('Failed to load MOD:', err);
            }
        }
    });
    
    document.body.appendChild(input);
    return input;
}
