/**
 * Clipboard operations for pattern editing
 * Platform-independent - pure logic, no browser APIs
 */

export class Clipboard {
    constructor() {
        this.buffer = null;
        this.type = null; // 'row', 'pattern', 'channel', 'cell'
    }
    
    /**
     * Copy a single row (all channels)
     */
    copyRow(pattern, row) {
        this.buffer = [];
        for (let ch = 0; ch < 4; ch++) {
            const note = pattern.getNote(row, ch);
            this.buffer.push({
                note: note.note,
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
        for (let row = 0; row < 32; row++) {
            const rowData = [];
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                rowData.push({
                    note: note.note,
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
    copyChannel(pattern, row, channel, numRows = 32) {
        this.buffer = [];
        const endRow = Math.min(row + numRows, 32);
        for (let r = row; r < endRow; r++) {
            const note = pattern.getNote(r, channel);
            this.buffer.push({
                note: note.note,
                instrument: note.instrument,
                effect: note.effect,
                param: note.param
            });
        }
        this.type = 'channel';
    }
    
    /**
     * Copy a single cell (note + instrument)
     */
    copyCell(pattern, row, channel) {
        const note = pattern.getNote(row, channel);
        this.buffer = {
            note: note.note,
            instrument: note.instrument,
            effect: note.effect,
            param: note.param
        };
        this.type = 'cell';
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
                note.note = data.note;
                note.instrument = data.instrument;
                note.effect = data.effect;
                note.param = data.param;
            }
        } else if (this.type === 'pattern') {
            for (let r = 0; r < 32; r++) {
                for (let ch = 0; ch < 4; ch++) {
                    const note = pattern.getNote(r, ch);
                    const data = this.buffer[r][ch];
                    note.note = data.note;
                    note.instrument = data.instrument;
                    note.effect = data.effect;
                    note.param = data.param;
                }
            }
        } else if (this.type === 'channel') {
            for (let i = 0; i < this.buffer.length; i++) {
                const r = row + i;
                if (r >= 32) break;
                const note = pattern.getNote(r, channel);
                const data = this.buffer[i];
                note.note = data.note;
                note.instrument = data.instrument;
                note.effect = data.effect;
                note.param = data.param;
            }
        } else if (this.type === 'cell') {
            const note = pattern.getNote(row, channel);
            note.note = this.buffer.note;
            note.instrument = this.buffer.instrument;
            note.effect = this.buffer.effect;
            note.param = this.buffer.param;
        }
    }
    
    /**
     * Clear entire pattern
     */
    clearPattern(pattern) {
        for (let row = 0; row < 32; row++) {
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                note.note = 0;
                note.instrument = 0;
                note.effect = 0;
                note.param = 0;
            }
        }
    }
    
    /**
     * Clear a single row
     */
    clearRow(pattern, row) {
        for (let ch = 0; ch < 4; ch++) {
            const note = pattern.getNote(row, ch);
            note.note = 0;
            note.instrument = 0;
            note.effect = 0;
            note.param = 0;
        }
    }
    
    /**
     * Clear a single channel cell
     */
    clearCell(pattern, row, channel) {
        const note = pattern.getNote(row, channel);
        note.note = 0;
        note.instrument = 0;
        note.effect = 0;
        note.param = 0;
    }
    
    /**
     * Insert a blank row, shifting rows down
     */
    insertRow(pattern, row) {
        for (let r = 31; r > row; r--) {
            for (let ch = 0; ch < 4; ch++) {
                const src = pattern.getNote(r - 1, ch);
                const dst = pattern.getNote(r, ch);
                dst.note = src.note;
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
        for (let r = row; r < 31; r++) {
            for (let ch = 0; ch < 4; ch++) {
                const src = pattern.getNote(r + 1, ch);
                const dst = pattern.getNote(r, ch);
                dst.note = src.note;
                dst.instrument = src.instrument;
                dst.effect = src.effect;
                dst.param = src.param;
            }
        }
        this.clearRow(pattern, 31);
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
