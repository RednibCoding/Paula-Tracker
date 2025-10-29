/**
 * TinyTracker Data I/O
 * Save and load .tny files (JSON format)
 */

import { TinySong, TinyPattern, TinyNote, TinyInstrument } from '../engine/audio-engine.js';

/**
 * Serialize a TinySong to JSON-compatible object
 * @param {TinySong} song
 * @returns {Object}
 */
export function serializeSong(song) {
    const data = {
        version: '1.0',
        title: song.title,
        tempo: song.tempo,
        bpm: song.bpm,
        songLength: song.songLength,
        patternOrder: song.patternOrder.slice(0, song.songLength),
        instruments: [],
        patterns: []
    };
    
    // Serialize instruments (only non-default ones to save space)
    for (let i = 0; i < song.instruments.length; i++) {
        const inst = song.instruments[i];
        data.instruments.push({
            attack: inst.attack,
            decay: inst.decay,
            sustain: inst.sustain,
            release: inst.release,
            dutyCycle: inst.dutyCycle,
            noiseType: inst.noiseType,
            pitchSlide: inst.pitchSlide,
            pitchSlideDuration: inst.pitchSlideDuration
        });
    }
    
    // Serialize patterns (only used ones)
    const maxPattern = Math.max(...song.patternOrder.slice(0, song.songLength));
    for (let p = 0; p <= maxPattern; p++) {
        const pattern = song.patterns[p];
        const patternData = {
            rows: []
        };
        
        for (let row = 0; row < 32; row++) {
            const rowData = [];
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                // Only store non-empty notes to save space
                if (note.note > 0 || note.effect > 0) {
                    rowData.push({
                        note: note.note,
                        instrument: note.instrument,
                        effect: note.effect,
                        param: note.param
                    });
                } else {
                    rowData.push(null);
                }
            }
            patternData.rows.push(rowData);
        }
        
        data.patterns.push(patternData);
    }
    
    return data;
}

/**
 * Deserialize JSON object to TinySong
 * @param {Object} data
 * @returns {TinySong}
 */
export function deserializeSong(data) {
    const song = new TinySong();
    
    song.title = data.title || 'Untitled';
    song.tempo = data.tempo || 6;
    song.bpm = data.bpm || 120;
    song.songLength = data.songLength || 1;
    song.patternOrder = [...data.patternOrder];
    
    // Restore instruments
    if (data.instruments) {
        for (let i = 0; i < data.instruments.length && i < 16; i++) {
            const instData = data.instruments[i];
            const inst = song.instruments[i];
            inst.attack = instData.attack;
            inst.decay = instData.decay;
            inst.sustain = instData.sustain;
            inst.release = instData.release;
            inst.dutyCycle = instData.dutyCycle || 0.5;
            inst.noiseType = instData.noiseType || 0;
            inst.pitchSlide = instData.pitchSlide || 0;
            inst.pitchSlideDuration = instData.pitchSlideDuration || 0;
        }
    }
    
    // Restore patterns
    song.patterns = [];
    if (data.patterns) {
        for (let p = 0; p < data.patterns.length; p++) {
            const patternData = data.patterns[p];
            const pattern = new TinyPattern();
            
            for (let row = 0; row < 32 && row < patternData.rows.length; row++) {
                const rowData = patternData.rows[row];
                for (let ch = 0; ch < 4 && ch < rowData.length; ch++) {
                    const noteData = rowData[ch];
                    if (noteData) {
                        const note = pattern.getNote(row, ch);
                        note.note = noteData.note || 0;
                        note.instrument = noteData.instrument || 0;
                        note.effect = noteData.effect || 0;
                        note.param = noteData.param || 0;
                    }
                }
            }
            
            song.patterns.push(pattern);
        }
    }
    
    // Ensure we have at least one pattern
    if (song.patterns.length === 0) {
        song.patterns.push(new TinyPattern());
    }
    
    return song;
}

/**
 * Save song to .tny file (browser save-as dialog)
 * @param {TinySong} song
 * @param {string} filename - Optional filename (defaults to song title)
 */
export async function saveTNY(song, filename = null) {
    const data = serializeSong(song);
    const json = JSON.stringify(data, null, 2);
    
    // Try to use File System Access API first
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: (filename || song.title || 'song') + '.tny',
                types: [{
                    description: 'TinyTracker Song',
                    accept: { 'application/json': ['.tny'] }
                }]
            });
            
            const writable = await handle.createWritable();
            await writable.write(json);
            await writable.close();
            return;
        } catch (err) {
            // User cancelled or error occurred
            if (err.name !== 'AbortError') {
                console.error('Error saving file:', err);
            }
            return;
        }
    }
    
    // Fallback to download link for older browsers
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || song.title || 'song') + '.tny';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load song from .tny file (browser file picker)
 * @returns {Promise<TinySong>}
 */
export function loadTNY() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.tny,application/json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                const song = deserializeSong(data);
                resolve(song);
            } catch (error) {
                reject(error);
            }
        };
        
        input.click();
    });
}
