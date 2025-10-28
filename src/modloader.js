/**
 * MOD File Loader for Paula Tracker
 * Loads classic Amiga ProTracker .MOD files
 */

import { Song, Pattern, Note, Instrument } from './data.js';

export class ModLoader {
    /**
     * Load a MOD file from ArrayBuffer
     */
    static load(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        const song = new Song();
        
        // Read song title (20 bytes at offset 0)
        song.title = this.readString(data, 0, 20);
        
        // Detect MOD format by checking signature at offset 1080
        const signature = this.readString(data, 1080, 4);
        let channelCount = 4;
        
        if (signature === 'M.K.' || signature === 'M!K!' || signature === 'FLT4') {
            channelCount = 4;
        } else if (signature === '6CHN') {
            channelCount = 6;
        } else if (signature === '8CHN') {
            channelCount = 8;
        } else {
            // Old 15-instrument MOD format (no signature)
        }
        
        // Read 31 instruments (offset 20)
        let offset = 20;
        for (let i = 1; i <= 31; i++) {
            const instr = song.instruments[i];
            
            // Instrument name (22 bytes)
            instr.name = this.readString(data, offset, 22);
            offset += 22;
            
            // Sample length in words (2 bytes)
            const lengthWords = (data[offset] << 8) | data[offset + 1];
            instr.length = lengthWords * 2;
            offset += 2;
            
            // Finetune (1 byte, signed 4-bit value)
            let finetune = data[offset];
            if (finetune > 7) finetune = finetune - 16;
            instr.finetune = finetune;
            offset += 1;
            
            // Volume (1 byte, 0-64)
            instr.volume = Math.min(64, data[offset]);
            offset += 1;
            
            // Repeat start in words (2 bytes)
            const repeatWords = (data[offset] << 8) | data[offset + 1];
            instr.repeatStart = repeatWords * 2;
            offset += 2;
            
            // Repeat length in words (2 bytes)
            const repeatLengthWords = (data[offset] << 8) | data[offset + 1];
            instr.repeatLength = repeatLengthWords * 2;
            offset += 2;
        }
        
        // Song length (1 byte at offset 950)
        song.songLength = data[950];
        
        // Restart position (1 byte at offset 951)
        song.restartPosition = data[951];
        
        // Pattern table (128 bytes at offset 952)
        let maxPattern = 0;
        for (let i = 0; i < 128; i++) {
            const patternNum = data[952 + i];
            song.patternOrder[i] = patternNum;
            if (patternNum > maxPattern) maxPattern = patternNum;
        }
        
        // Pattern data starts at offset 1084
        offset = 1084;
        
        // Read pattern data
        for (let p = 0; p <= maxPattern; p++) {
            const pattern = song.patterns[p];
            
            for (let row = 0; row < 64; row++) {
                for (let ch = 0; ch < channelCount && ch < 4; ch++) {
                    const note = pattern.getNote(row, ch);
                    
                    // Read 4 bytes per note
                    const b0 = data[offset++];
                    const b1 = data[offset++];
                    const b2 = data[offset++];
                    const b3 = data[offset++];
                    
                    // Decode note data:
                    // Byte 0: aaaaBBBB (a = instrument high bits, B = period high bits)
                    // Byte 1: PPPPPPPP (period low bits)
                    // Byte 2: iiiiEEEE (i = instrument low bits, E = effect)
                    // Byte 3: PPPPPPPP (effect parameter)
                    
                    const periodHi = (b0 & 0x0F);
                    const periodLo = b1;
                    const period = (periodHi << 8) | periodLo;
                    note.period = period;
                    
                    // Instrument is stored in upper 4 bits of b0 and b2
                    const instrHi = (b0 & 0xF0) >> 4;  // Upper 4 bits of byte 0
                    const instrLo = (b2 & 0xF0) >> 4;  // Upper 4 bits of byte 2
                    const instrument = (instrHi << 4) | instrLo;
                    note.instrument = instrument;
                    
                    const effect = b2 & 0x0F;
                    note.effect = effect;
                    
                    const param = b3;
                    note.param = param;
                }
            }
        }
        
        // Read sample data
        for (let i = 1; i <= 31; i++) {
            const instr = song.instruments[i];
            
            if (instr.length > 0) {
                // Allocate sample buffer
                instr.sampleData = new Float32Array(instr.length);
                
                // Read sample data (8-bit signed)
                for (let s = 0; s < instr.length; s++) {
                    // Convert from signed 8-bit to float -1.0 to 1.0
                    const byte = data[offset++];
                    const signed = byte > 127 ? byte - 256 : byte;
                    instr.sampleData[s] = signed / 128.0;
                }
            }
        }
        
        return song;
    }
    
    /**
     * Read a string from data
     */
    static readString(data, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            const char = data[offset + i];
            if (char === 0) break;
            // Only add printable ASCII characters
            if (char >= 32 && char <= 126) {
                str += String.fromCharCode(char);
            }
        }
        return str.trim();
    }
    
    /**
     * Count non-empty instruments
     */
    static countInstruments(song) {
        let count = 0;
        for (let i = 1; i <= 31; i++) {
            if (!song.instruments[i].isEmpty()) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Load MOD from URL
     */
    static async loadFromUrl(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return this.load(arrayBuffer);
    }
    
    /**
     * Load MOD from file input
     */
    static loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const song = this.load(e.target.result);
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
     * Save a song as a MOD file
     */
    static save(song) {
        // Calculate how many patterns are actually used
        let maxPattern = 0;
        for (let i = 0; i < song.songLength; i++) {
            if (song.patternOrder[i] > maxPattern) {
                maxPattern = song.patternOrder[i];
            }
        }
        
        // Calculate total size needed
        const headerSize = 1084;
        const patternDataSize = (maxPattern + 1) * 64 * 4 * 4; // patterns * rows * channels * bytes
        
        // Calculate sample data size
        let sampleDataSize = 0;
        for (let i = 1; i <= 31; i++) {
            const instr = song.instruments[i];
            if (!instr.isEmpty()) {
                sampleDataSize += instr.length;
            }
        }
        
        const totalSize = headerSize + patternDataSize + sampleDataSize;
        const data = new Uint8Array(totalSize);
        
        // Write song title (20 bytes)
        this.writeString(data, 0, song.title || 'Untitled', 20);
        
        // Write 31 instruments
        let offset = 20;
        for (let i = 1; i <= 31; i++) {
            const instr = song.instruments[i];
            
            // Instrument name (22 bytes)
            this.writeString(data, offset, instr.name || '', 22);
            offset += 22;
            
            // Sample length in words
            const lengthWords = Math.floor(instr.length / 2);
            data[offset++] = (lengthWords >> 8) & 0xFF;
            data[offset++] = lengthWords & 0xFF;
            
            // Finetune (signed 4-bit)
            let finetune = instr.finetune || 0;
            if (finetune < 0) finetune = 16 + finetune;
            data[offset++] = finetune & 0x0F;
            
            // Volume (0-64)
            data[offset++] = Math.min(64, instr.volume || 0);
            
            // Repeat start in words
            const repeatWords = Math.floor((instr.repeatStart || 0) / 2);
            data[offset++] = (repeatWords >> 8) & 0xFF;
            data[offset++] = repeatWords & 0xFF;
            
            // Repeat length in words
            const repeatLengthWords = Math.floor((instr.repeatLength || 2) / 2);
            data[offset++] = (repeatLengthWords >> 8) & 0xFF;
            data[offset++] = repeatLengthWords & 0xFF;
        }
        
        // Song length (offset 950)
        data[950] = song.songLength || 1;
        
        // Restart position (offset 951)
        data[951] = song.restartPosition || 0;
        
        // Pattern order table (128 bytes at offset 952)
        for (let i = 0; i < 128; i++) {
            data[952 + i] = song.patternOrder[i] || 0;
        }
        
        // MOD signature 'M.K.' (offset 1080)
        this.writeString(data, 1080, 'M.K.', 4);
        
        // Write pattern data (offset 1084)
        offset = 1084;
        for (let p = 0; p <= maxPattern; p++) {
            const pattern = song.patterns[p];
            
            for (let row = 0; row < 64; row++) {
                for (let ch = 0; ch < 4; ch++) {
                    const note = pattern.getNote(row, ch);
                    
                    // Encode note data to 4 bytes
                    const period = note.period || 0;
                    const instrument = note.instrument || 0;
                    const effect = note.effect || 0;
                    const param = note.param || 0;
                    
                    // Byte 0: upper 4 bits of instrument + upper 4 bits of period
                    const instrHi = (instrument >> 4) & 0x0F;
                    const periodHi = (period >> 8) & 0x0F;
                    data[offset++] = (instrHi << 4) | periodHi;
                    
                    // Byte 1: lower 8 bits of period
                    data[offset++] = period & 0xFF;
                    
                    // Byte 2: lower 4 bits of instrument + effect
                    const instrLo = instrument & 0x0F;
                    data[offset++] = (instrLo << 4) | (effect & 0x0F);
                    
                    // Byte 3: effect parameter
                    data[offset++] = param & 0xFF;
                }
            }
        }
        
        // Write sample data
        for (let i = 1; i <= 31; i++) {
            const instr = song.instruments[i];
            
            if (!instr.isEmpty() && instr.sampleData) {
                // Convert float samples (-1.0 to 1.0) to signed 8-bit (-128 to 127)
                for (let j = 0; j < instr.length; j++) {
                    const sample = instr.sampleData[j] || 0;
                    const signed8bit = Math.round(sample * 127);
                    data[offset++] = signed8bit & 0xFF;
                }
            }
        }
        
        return data;
    }
    
    /**
     * Download a MOD file
     */
    static async saveToFile(song, filename = 'song.mod') {
        const data = this.save(song);
        
        // Use File System Access API if available (Chrome, Edge, etc.)
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
                
                // Update song title based on chosen filename (without .mod extension)
                const savedFilename = handle.name;
                const titleWithoutExt = savedFilename.replace(/\.mod$/i, '');
                song.title = titleWithoutExt.substring(0, 20); // MOD format: 20 chars max
                
                // Re-save with updated title
                const updatedData = this.save(song);
                
                const writable = await handle.createWritable();
                await writable.write(updatedData);
                await writable.close();
                
                console.log('File saved successfully as:', savedFilename);
                console.log('Song title updated to:', song.title);
                return;
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('Save failed:', err);
                }
                return;
            }
        }
        
        // Fallback: automatic download (older browsers)
        // Update song title from filename
        const titleWithoutExt = filename.replace(/\.mod$/i, '');
        song.title = titleWithoutExt.substring(0, 20);
        
        // Re-save with updated title
        const updatedData = this.save(song);
        
        const blob = new Blob([updatedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Write a string to buffer
     */
    static writeString(data, offset, str, maxLength) {
        for (let i = 0; i < maxLength; i++) {
            data[offset + i] = i < str.length ? str.charCodeAt(i) : 0;
        }
    }
}
