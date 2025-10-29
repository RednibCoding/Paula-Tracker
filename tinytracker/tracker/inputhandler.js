/**
 * TinyTracker Input Handler
 * Keyboard controls for pattern editing and navigation
 */

export class InputHandler {
    constructor(state, clipboard) {
        this.state = state;
        this.clipboard = clipboard;
        this.keys = {};
        
        // Note keys (piano layout)
        this.noteKeys = {
            'z': 0,  's': 1,  'x': 2,  'd': 3,  'c': 4,  'v': 5,  'g': 6,  'b': 7,  'h': 8,  'n': 9,  'j': 10, 'm': 11,  // C3-B3
            'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17, '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23,  // C4-B4
            'i': 24, '9': 25, 'o': 26, '0': 27, 'p': 28                                                                    // C5-E5
        };
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Allow navigation keys to repeat, but prevent repeat for note/data entry
        const isNavigationKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'pageup', 'pagedown', 'home', 'end'].includes(key);
        const isAltSequencerKey = e.altKey && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'insert', 'delete', 'd'].includes(key);
        
        if (!isNavigationKey && !isAltSequencerKey) {
            // Prevent repeat for note entry and other keys
            if (this.keys[key]) return;
        }
        this.keys[key] = true;
        
        // Special keys that should prevent default
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab', ' ', 'insert', 'delete'].includes(key)) {
            e.preventDefault();
        }
        
        // ALT + Arrow keys: Sequencer navigation and editing
        if (e.altKey) {
            if (key === 'arrowup') {
                // Move selection up in sequencer
                this.state.currentPosition = Math.max(0, this.state.currentPosition - 1);
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowdown') {
                // Move selection down in sequencer
                this.state.currentPosition = Math.min(this.state.song.songLength - 1, this.state.currentPosition + 1);
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowleft') {
                // Decrease pattern number at current position
                const currentPat = this.state.song.patternOrder[this.state.currentPosition];
                this.state.song.patternOrder[this.state.currentPosition] = Math.max(0, currentPat - 1);
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowright') {
                // Increase pattern number at current position
                const currentPat = this.state.song.patternOrder[this.state.currentPosition];
                this.state.song.patternOrder[this.state.currentPosition] = Math.min(63, currentPat + 1);
                e.preventDefault();
                return;
            }
            
            if (key === 'insert') {
                // Insert new position after current
                if (this.state.song.songLength < 256) {
                    this.state.song.patternOrder.splice(this.state.currentPosition + 1, 0, 0);
                    this.state.song.songLength++;
                    this.state.currentPosition++;
                }
                e.preventDefault();
                return;
            }
            
            if (key === 'delete') {
                // Delete current position
                if (this.state.song.songLength > 1) {
                    this.state.song.patternOrder.splice(this.state.currentPosition, 1);
                    this.state.song.songLength--;
                    this.state.currentPosition = Math.min(this.state.currentPosition, this.state.song.songLength - 1);
                }
                e.preventDefault();
                return;
            }
            
            if (key === 'd') {
                // Duplicate current position
                if (this.state.song.songLength < 256) {
                    const patToDuplicate = this.state.song.patternOrder[this.state.currentPosition];
                    this.state.song.patternOrder.splice(this.state.currentPosition + 1, 0, patToDuplicate);
                    this.state.song.songLength++;
                    this.state.currentPosition++;
                }
                e.preventDefault();
                return;
            }
        }
        
        // CTRL + Arrow keys: Fast navigation
        if (e.ctrlKey && !e.altKey) {
            if (key === 'arrowup') {
                // Jump 5 rows up
                this.state.currentRow = Math.max(0, this.state.currentRow - 5);
                this.state.effectInputPos = 0;
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowdown') {
                // Jump 5 rows down
                this.state.currentRow = Math.min(31, this.state.currentRow + 5);
                this.state.effectInputPos = 0;
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowleft') {
                // Move to previous channel
                if (this.state.currentChannel > 0) {
                    this.state.currentChannel--;
                }
                this.state.effectInputPos = 0;
                e.preventDefault();
                return;
            }
            
            if (key === 'arrowright') {
                // Move to next channel
                if (this.state.currentChannel < 3) {
                    this.state.currentChannel++;
                }
                this.state.effectInputPos = 0;
                e.preventDefault();
                return;
            }
        }
        
        // Navigation
        if (key === 'arrowup') {
            this.state.currentRow = Math.max(0, this.state.currentRow - 1);
            this.state.effectInputPos = 0; // Reset effect input position
            return;
        }
        
        if (key === 'arrowdown') {
            this.state.currentRow = Math.min(31, this.state.currentRow + 1);
            this.state.effectInputPos = 0; // Reset effect input position
            return;
        }
        
        if (key === 'arrowleft') {
            if (this.state.cursorColumn > 0) {
                this.state.cursorColumn--;
            } else if (this.state.currentChannel > 0) {
                this.state.currentChannel--;
                this.state.cursorColumn = 2;
            }
            this.state.effectInputPos = 0; // Reset effect input position
            return;
        }
        
        if (key === 'arrowright') {
            if (this.state.cursorColumn < 2) {
                this.state.cursorColumn++;
            } else if (this.state.currentChannel < 3) {
                this.state.currentChannel++;
                this.state.cursorColumn = 0;
            }
            this.state.effectInputPos = 0; // Reset effect input position
            return;
        }
        
        // Page up/down - cycle through instruments
        if (key === 'pageup') {
            this.state.currentInstrument = Math.max(0, this.state.currentInstrument - 1);
            return;
        }
        
        if (key === 'pagedown') {
            this.state.currentInstrument = Math.min(7, this.state.currentInstrument + 1);
            return;
        }
        
        // Home/End - jump to first/last row
        if (key === 'home') {
            this.state.currentRow = 0;
            return;
        }
        
        if (key === 'end') {
            this.state.currentRow = 31;
            return;
        }
        
        // Tab - toggle edit mode
        if (key === 'tab') {
            this.state.editMode = !this.state.editMode;
            return;
        }
        
        // F1 - toggle help overlay
        if (key === 'f1') {
            e.preventDefault();
            this.state.showHelp = !this.state.showHelp;
            return;
        }
        
        // L key - toggle pattern loop mode
        if (key === 'l') {
            this.state.patternLoopMode = !this.state.patternLoopMode;
            return;
        }
        
        // F key - toggle follow playback
        if (key === 'f') {
            this.state.followPlayback = !this.state.followPlayback;
            return;
        }
        
        // Space - toggle playback
        if (key === ' ') {
            if (this.state.playing) {
                this.state.audio.stop();
                this.state.playing = false;
            } else {
                this.state.audio.play(this.state.currentPosition, this.state.currentRow);
                this.state.playing = true;
            }
            return;
        }
        
        // Mute channels (prevent default for F-keys)
        if (key === 'f5') {
            e.preventDefault();
            this.state.audio.toggleMute(0);
            this.state.mutedChannels[0] = !this.state.mutedChannels[0];
            return;
        }
        if (key === 'f6') {
            e.preventDefault();
            this.state.audio.toggleMute(1);
            this.state.mutedChannels[1] = !this.state.mutedChannels[1];
            return;
        }
        if (key === 'f7') {
            e.preventDefault();
            this.state.audio.toggleMute(2);
            this.state.mutedChannels[2] = !this.state.mutedChannels[2];
            return;
        }
        if (key === 'f8') {
            e.preventDefault();
            this.state.audio.toggleMute(3);
            this.state.mutedChannels[3] = !this.state.mutedChannels[3];
            return;
        }
        
        // Delete - clear cell
        if (key === 'delete' && this.state.editMode) {
            const patternNum = this.state.song.patternOrder[this.state.currentPosition];
            const pattern = this.state.song.patterns[patternNum];
            const note = pattern.getNote(this.state.currentRow, this.state.currentChannel);
            
            if (this.state.cursorColumn === 0) {
                note.note = 0;
            } else if (this.state.cursorColumn === 1) {
                note.instrument = 0;
            } else if (this.state.cursorColumn === 2) {
                note.effect = 0;
                note.param = 0;
            }
            return;
        }
        
        // Clipboard operations
        const patternNum = this.state.song.patternOrder[this.state.currentPosition];
        const pattern = this.state.song.patterns[patternNum];
        
        // Ctrl+C - Copy
        if (key === 'c' && e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
                // Ctrl+Shift+C - Copy entire pattern
                this.clipboard.copyPattern(pattern);
            } else if (e.altKey) {
                // Ctrl+Alt+C - Copy channel (from current row to end)
                this.clipboard.copyChannel(pattern, this.state.currentRow, this.state.currentChannel);
            } else {
                // Ctrl+C - Copy current row
                this.clipboard.copyRow(pattern, this.state.currentRow);
            }
            return;
        }
        
        // Ctrl+X - Cut (copy + clear)
        if (key === 'x' && e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
                // Ctrl+Shift+X - Cut entire pattern
                this.clipboard.copyPattern(pattern);
                this.clipboard.clearPattern(pattern);
            } else if (e.altKey) {
                // Ctrl+Alt+X - Cut channel
                this.clipboard.copyChannel(pattern, this.state.currentRow, this.state.currentChannel);
                for (let r = this.state.currentRow; r < 32; r++) {
                    this.clipboard.clearCell(pattern, r, this.state.currentChannel);
                }
            } else {
                // Ctrl+X - Cut current row
                this.clipboard.copyRow(pattern, this.state.currentRow);
                this.clipboard.clearRow(pattern, this.state.currentRow);
            }
            return;
        }
        
        // Ctrl+V - Paste
        if (key === 'v' && e.ctrlKey) {
            e.preventDefault();
            this.clipboard.paste(pattern, this.state.currentRow, this.state.currentChannel);
            return;
        }
        
        // Backspace - Clear current cell
        if (key === 'backspace' && this.state.editMode) {
            e.preventDefault();
            this.clipboard.clearCell(pattern, this.state.currentRow, this.state.currentChannel);
            return;
        }
        
        // Ctrl+Insert - Insert row
        if (key === 'insert' && e.ctrlKey) {
            e.preventDefault();
            this.clipboard.insertRow(pattern, this.state.currentRow);
            return;
        }
        
        // Ctrl+Delete - Delete row (shift up)
        if (key === 'delete' && e.ctrlKey) {
            e.preventDefault();
            this.clipboard.deleteRow(pattern, this.state.currentRow);
            return;
        }
        
        // Instrument selection (1-8)
        if (key >= '1' && key <= '8' && e.ctrlKey) {
            this.state.currentInstrument = parseInt(key) - 1;
            return;
        }
        
        // Instrument parameter editing (with Shift key)
        if (e.shiftKey) {
            const inst = this.state.song.instruments[this.state.currentInstrument];
            const step = e.ctrlKey ? 0.001 : 0.01; // Fine/coarse adjustment
            
            if (key === 'a') {
                // Attack
                inst.attack = Math.max(0.001, Math.min(1.0, inst.attack + step));
                return;
            }
            if (key === 'shift+a' || (e.shiftKey && key === 'a' && e.ctrlKey)) {
                inst.attack = Math.max(0.001, Math.min(1.0, inst.attack - step));
                return;
            }
            if (key === 'd') {
                // Decay
                inst.decay = Math.max(0.001, Math.min(1.0, inst.decay + step));
                return;
            }
            if (key === 's') {
                // Sustain
                inst.sustain = Math.max(0.0, Math.min(1.0, inst.sustain + 0.05));
                return;
            }
            if (key === 'r') {
                // Release
                inst.release = Math.max(0.001, Math.min(1.0, inst.release + step));
                return;
            }
            if (key === 'w') {
                // Duty cycle (square wave only)
                if (this.state.currentChannel === 0) {
                    inst.dutyCycle = Math.max(0.1, Math.min(0.9, inst.dutyCycle + 0.05));
                }
                return;
            }
        }
        
        // Note entry in edit mode
        if (this.state.editMode && this.state.cursorColumn === 0) {
            if (this.noteKeys.hasOwnProperty(key)) {
                const baseNote = 36; // C3
                const noteNum = baseNote + this.noteKeys[key];
                
                const patternNum = this.state.song.patternOrder[this.state.currentPosition];
                const pattern = this.state.song.patterns[patternNum];
                const note = pattern.getNote(this.state.currentRow, this.state.currentChannel);
                
                note.note = noteNum;
                note.instrument = this.state.currentInstrument;
                
                // Trigger sound
                this.state.audio.getEngine().triggerNote(
                    this.state.currentChannel,
                    noteNum,
                    this.state.currentInstrument
                );
                
                // Advance cursor
                this.state.currentRow = Math.min(31, this.state.currentRow + 1);
                return;
            }
        }
        
        // Hex entry for instrument/effect
        if (this.state.editMode && this.state.cursorColumn > 0) {
            const hexChar = key.match(/^[0-9a-f]$/);
            if (hexChar) {
                const patternNum = this.state.song.patternOrder[this.state.currentPosition];
                const pattern = this.state.song.patterns[patternNum];
                const note = pattern.getNote(this.state.currentRow, this.state.currentChannel);
                
                const hexValue = parseInt(key, 16);
                
                if (this.state.cursorColumn === 1) {
                    // Instrument entry (single digit)
                    note.instrument = hexValue;
                    this.state.currentRow = Math.min(31, this.state.currentRow + 1);
                } else if (this.state.cursorColumn === 2) {
                    // Effect entry (3 digits: effect type + 2 param digits)
                    // Initialize effectInputPos if not set or invalid
                    if (this.state.effectInputPos === undefined || this.state.effectInputPos < 0 || this.state.effectInputPos > 2) {
                        this.state.effectInputPos = 0;
                    }
                    
                    if (this.state.effectInputPos === 0) {
                        // First digit - effect type
                        note.effect = hexValue;
                        note.param = 0; // Reset param when starting new effect
                        this.state.effectInputPos = 1;
                    } else if (this.state.effectInputPos === 1) {
                        // Second digit - high nibble of param
                        note.param = (hexValue << 4) | (note.param & 0x0F);
                        this.state.effectInputPos = 2;
                    } else if (this.state.effectInputPos === 2) {
                        // Third digit - low nibble of param
                        note.param = (note.param & 0xF0) | hexValue;
                        this.state.effectInputPos = 0;
                        // Advance to next row after 3 digits
                        this.state.currentRow = Math.min(31, this.state.currentRow + 1);
                    }
                }
                return;
            }
        }
    }
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
    }
}
