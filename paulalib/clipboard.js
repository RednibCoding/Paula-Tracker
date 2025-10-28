/**
 * Clipboard operations for pattern editing
 * Platform-independent - pure logic, no browser APIs
 */

import { Note } from './data.js';

export class Clipboard {
    constructor() {
        this.buffer = null;
        this.type = null; // 'row', 'pattern', 'channel'
    }
    
    /**
     * Copy a single row (all channels)
     */
    copyRow(pattern, row) {
        this.buffer = [];
        for (let ch = 0; ch < 4; ch++) {
            const note = pattern.getNote(row, ch);
            this.buffer.push({
                period: note.period,
                instrument: note.instrument,
                effect: note.effect,
                param: note.param
            });
        }
        this.type = 'row';
    }
    
    /**
     * Copy entire pattern
     */
    copyPattern(pattern) {
        this.buffer = [];
        for (let row = 0; row < 64; row++) {
            const rowData = [];
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                rowData.push({
                    period: note.period,
                    instrument: note.instrument,
                    effect: note.effect,
                    param: note.param
                });
            }
            this.buffer.push(rowData);
        }
        this.type = 'pattern';
    }
    
    /**
     * Copy a single channel column
     */
    copyChannel(pattern, row, channel) {
        const note = pattern.getNote(row, channel);
        this.buffer = {
            period: note.period,
            instrument: note.instrument,
            effect: note.effect,
            param: note.param
        };
        this.type = 'channel';
    }
    
    /**
     * Paste data at current position
     */
    paste(pattern, row, channel = 0) {
        if (!this.buffer) return;
        
        if (this.type === 'row') {
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                const data = this.buffer[ch];
                note.period = data.period;
                note.instrument = data.instrument;
                note.effect = data.effect;
                note.param = data.param;
            }
        } else if (this.type === 'pattern') {
            for (let r = 0; r < 64; r++) {
                for (let ch = 0; ch < 4; ch++) {
                    const note = pattern.getNote(r, ch);
                    const data = this.buffer[r][ch];
                    note.period = data.period;
                    note.instrument = data.instrument;
                    note.effect = data.effect;
                    note.param = data.param;
                }
            }
        } else if (this.type === 'channel') {
            const note = pattern.getNote(row, channel);
            note.period = this.buffer.period;
            note.instrument = this.buffer.instrument;
            note.effect = this.buffer.effect;
            note.param = this.buffer.param;
        }
    }
    
    /**
     * Clear entire pattern
     */
    clearPattern(pattern) {
        for (let row = 0; row < 64; row++) {
            for (let ch = 0; ch < 4; ch++) {
                pattern.getNote(row, ch).clear();
            }
        }
    }
    
    /**
     * Clear a single row
     */
    clearRow(pattern, row) {
        for (let ch = 0; ch < 4; ch++) {
            pattern.getNote(row, ch).clear();
        }
    }
    
    /**
     * Insert a blank row, shifting rows down
     */
    insertRow(pattern, row) {
        for (let r = 63; r > row; r--) {
            for (let ch = 0; ch < 4; ch++) {
                const src = pattern.getNote(r - 1, ch);
                const dst = pattern.getNote(r, ch);
                dst.period = src.period;
                dst.instrument = src.instrument;
                dst.effect = src.effect;
                dst.param = src.param;
            }
        }
        this.clearRow(pattern, row);
    }
    
    /**
     * Delete a row, shifting rows up
     */
    deleteRow(pattern, row) {
        for (let r = row; r < 63; r++) {
            for (let ch = 0; ch < 4; ch++) {
                const src = pattern.getNote(r + 1, ch);
                const dst = pattern.getNote(r, ch);
                dst.period = src.period;
                dst.instrument = src.instrument;
                dst.effect = src.effect;
                dst.param = src.param;
            }
        }
        this.clearRow(pattern, 63);
    }
    
    /**
     * Check if clipboard has data
     */
    hasData() {
        return this.buffer !== null;
    }
    
    /**
     * Get clipboard type
     */
    getType() {
        return this.type;
    }
}
