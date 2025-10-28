/**
 * Clipboard module for pattern editing operations
 * Handles copy/paste/cut of rows and pattern data
 */

import { Note } from './data.js';

export class Clipboard {
    constructor() {
        this.buffer = null;
        this.type = null; // 'row', 'pattern', 'channel'
    }
    
    /**
     * Copy a single row (all channels)
     * @param {Pattern} pattern - Pattern to copy from
     * @param {number} row - Row number
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
     * @param {Pattern} pattern - Pattern to copy
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
     * @param {Pattern} pattern - Pattern to copy from
     * @param {number} row - Row number
     * @param {number} channel - Channel number
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
     * @param {Pattern} pattern - Pattern to paste into
     * @param {number} row - Starting row
     * @param {number} channel - Starting channel (for single channel paste)
     */
    paste(pattern, row, channel = 0) {
        if (!this.buffer) return;
        
        if (this.type === 'row') {
            // Paste single row
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                const data = this.buffer[ch];
                note.period = data.period;
                note.instrument = data.instrument;
                note.effect = data.effect;
                note.param = data.param;
            }
        } else if (this.type === 'pattern') {
            // Paste entire pattern
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
            // Paste single channel
            const note = pattern.getNote(row, channel);
            note.period = this.buffer.period;
            note.instrument = this.buffer.instrument;
            note.effect = this.buffer.effect;
            note.param = this.buffer.param;
        }
    }
    
    /**
     * Clear entire pattern
     * @param {Pattern} pattern - Pattern to clear
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
     * @param {Pattern} pattern - Pattern containing the row
     * @param {number} row - Row number to clear
     */
    clearRow(pattern, row) {
        for (let ch = 0; ch < 4; ch++) {
            pattern.getNote(row, ch).clear();
        }
    }
    
    /**
     * Insert a blank row, shifting rows down
     * @param {Pattern} pattern - Pattern to modify
     * @param {number} row - Row to insert at
     */
    insertRow(pattern, row) {
        // Move rows down from bottom to insertion point
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
        // Clear the inserted row
        this.clearRow(pattern, row);
    }
    
    /**
     * Delete a row, shifting rows up
     * @param {Pattern} pattern - Pattern to modify
     * @param {number} row - Row to delete
     */
    deleteRow(pattern, row) {
        // Move rows up from deletion point to end
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
        // Clear the last row
        this.clearRow(pattern, 63);
    }
    
    /**
     * Check if clipboard has data
     * @returns {boolean}
     */
    hasData() {
        return this.buffer !== null;
    }
    
    /**
     * Get clipboard type
     * @returns {string|null}
     */
    getType() {
        return this.type;
    }
}
