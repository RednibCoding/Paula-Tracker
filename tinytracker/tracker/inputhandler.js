/**
 * TinyTracker Input Handler
 * Keyboard controls for pattern editing and navigation
 */

export class InputHandler {
    constructor(state) {
        this.state = state;
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
        
        // Prevent repeat
        if (this.keys[key]) return;
        this.keys[key] = true;
        
        // Special keys that should prevent default
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab', ' '].includes(key)) {
            e.preventDefault();
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
        
        // Page up/down
        if (key === 'pageup') {
            this.state.currentRow = Math.max(0, this.state.currentRow - 16);
            return;
        }
        
        if (key === 'pagedown') {
            this.state.currentRow = Math.min(31, this.state.currentRow + 16);
            return;
        }
        
        // Home/End
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
        if (key === 'l' && !this.state.editMode) {
            this.state.patternLoopMode = !this.state.patternLoopMode;
            return;
        }
        
        // F key - toggle follow playback
        if (key === 'f' && !this.state.editMode) {
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
        
        // Mute channels
        if (key === 'f5') {
            this.state.audio.toggleMute(0);
            this.state.mutedChannels[0] = !this.state.mutedChannels[0];
            return;
        }
        if (key === 'f6') {
            this.state.audio.toggleMute(1);
            this.state.mutedChannels[1] = !this.state.mutedChannels[1];
            return;
        }
        if (key === 'f7') {
            this.state.audio.toggleMute(2);
            this.state.mutedChannels[2] = !this.state.mutedChannels[2];
            return;
        }
        if (key === 'f8') {
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
                    // Initialize effectInputPos if not set
                    if (!this.state.effectInputPos) {
                        this.state.effectInputPos = 0;
                    }
                    
                    if (this.state.effectInputPos === 0) {
                        // First digit - effect type
                        note.effect = hexValue;
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
