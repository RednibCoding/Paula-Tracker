# ProTracker Effects Reference

Paula Tracker now supports all standard ProTracker effects implemented in the `paulalib/audio-engine.js` module.

## Effect List

### 0xy - Arpeggio
**Usage:** `0xy` where x and y are semitone offsets  
**Description:** Rapidly cycles between the base note, base note + x semitones, and base note + y semitones.  
**Example:** `037` plays the note, then +3 semitones (minor third), then +7 semitones (perfect fifth)

### 1xx - Slide Up
**Usage:** `1xx` where xx is the slide speed  
**Description:** Slides the pitch up (period decreases) continuously.  
**Example:** `110` slides up at speed 16

### 2xx - Slide Down
**Usage:** `2xx` where xx is the slide speed  
**Description:** Slides the pitch down (period increases) continuously.  
**Example:** `220` slides down at speed 32

### 3xx - Tone Portamento (Slide to Note)
**Usage:** `3xx` where xx is the slide speed  
**Description:** Slides smoothly from current note to the specified target note. Does not retrigger the sample.  
**Example:** Play `C-2 01 000`, then `E-2 01 310` to slide from C to E

### 4xy - Vibrato
**Usage:** `4xy` where x is speed and y is depth  
**Description:** Applies pitch modulation (vibrato effect).  
**Example:** `442` applies vibrato with speed 4 and depth 2

### 5xy - Tone Portamento + Volume Slide
**Usage:** `5xy` where x is volume up, y is volume down  
**Description:** Combines effect 3 (tone portamento) with effect A (volume slide).  
**Example:** `510` slides to note while increasing volume

### 6xy - Vibrato + Volume Slide
**Usage:** `6xy` where x is volume up, y is volume down  
**Description:** Combines effect 4 (vibrato) with effect A (volume slide).  
**Example:** `601` applies vibrato while decreasing volume

### 7xy - Tremolo
**Usage:** `7xy` where x is speed and y is depth  
**Description:** Applies volume modulation (tremolo effect).  
**Example:** `733` applies tremolo with speed 3 and depth 3

### 9xx - Set Sample Offset
**Usage:** `9xx` where xx is the offset  
**Description:** Starts sample playback at position xx * 256 bytes.  
**Example:** `904` starts playing from byte 1024 (4 * 256)

### Axy - Volume Slide
**Usage:** `Axy` where x is up speed, y is down speed  
**Description:** Slides volume up or down. Only one parameter should be non-zero.  
**Examples:**  
- `A10` slides volume up at speed 1  
- `A01` slides volume down at speed 1

### Bxx - Position Jump
**Usage:** `Bxx` where xx is the position in the song order  
**Description:** Jumps to a specific position in the song sequence immediately.  
**Example:** `B00` jumps back to the beginning of the song

### Cxx - Set Volume
**Usage:** `Cxx` where xx is volume (0-64)  
**Description:** Sets the channel volume immediately.  
**Example:** `C40` sets volume to 64 (maximum)

### Dxx - Pattern Break
**Usage:** `Dxx` where xx is the row number (in decimal BCD format)  
**Description:** Breaks out of the current pattern and jumps to row xx of the next pattern.  
**Examples:**  
- `D00` jumps to row 0 of next pattern  
- `D16` jumps to row 16 of next pattern  
**Note:** The parameter is in BCD (Binary Coded Decimal), so D32 means row 32, not row 50

### E1x - Fine Slide Up
**Usage:** `E1x` where x is the amount  
**Description:** Slides pitch up once at the start of the row (finer control than effect 1).  
**Example:** `E12` slides up by 2 units

### E2x - Fine Slide Down
**Usage:** `E2x` where x is the amount  
**Description:** Slides pitch down once at the start of the row (finer control than effect 2).  
**Example:** `E24` slides down by 4 units

### E5x - Set Finetune
**Usage:** `E5x` where x is finetune value (0-F)  
**Description:** Sets the finetune value for the current channel.  
**Values:** 0-7 = positive, 8-F = negative (-8 to -1)

### E9x - Retrigger Note
**Usage:** `E9x` where x is the retrigger rate  
**Description:** Retriggers the note every x ticks.  
**Example:** `E93` retriggers the note every 3 ticks

### EAx - Fine Volume Slide Up
**Usage:** `EAx` where x is the amount  
**Description:** Increases volume once at the start of the row.  
**Example:** `EA4` increases volume by 4

### EBx - Fine Volume Slide Down
**Usage:** `EBx` where x is the amount  
**Description:** Decreases volume once at the start of the row.  
**Example:** `EB2` decreases volume by 2

### ECx - Note Cut
**Usage:** `ECx` where x is the tick  
**Description:** Cuts the note (sets volume to 0) at tick x.  
**Example:** `EC3` cuts the note at tick 3

### EDx - Note Delay
**Usage:** `EDx` where x is the delay in ticks  
**Description:** Delays the note trigger by x ticks.  
**Example:** `ED2` delays note by 2 ticks

### Fxx - Set Speed/Tempo
**Usage:** `Fxx` where xx is the value  
**Description:**  
- Values 01-1F (1-31): Set speed (ticks per row)  
- Values 20-FF (32-255): Set BPM (beats per minute)  
**Examples:**  
- `F06` sets speed to 6 (default ProTracker speed)  
- `F7D` sets BPM to 125

## Effect Combinations

Some effects can be combined or chained:

1. **Portamento + Volume:** Use effect 5 to slide to a note while adjusting volume
2. **Vibrato + Volume:** Use effect 6 to apply vibrato while adjusting volume
3. **Effect Memory:** Most effects remember their last parameter if you use 00

## Technical Notes

- All effects are processed on every tick of the tempo clock
- Period range is limited to 113-856 (approximately C-1 to B-3)
- Volume range is 0-64 (ProTracker standard)
- Arpeggio cycles on ticks 0, 1, 2 (repeating)
- Vibrato and tremolo use sine wave modulation
- Sample offset is in multiples of 256 bytes

## Implementation Status

- All standard ProTracker effects are fully implemented  
- Effects are processed in `paulalib/audio-engine.js`  
- Platform-independent (pure JavaScript)  
- Compatible with standard .MOD files

## Usage Example

```javascript
import { PaulaEngine } from './paulalib/audio-engine.js';

const engine = new PaulaEngine(44100);
engine.setSong(mySong);
engine.play(0);

// Effects are automatically processed during playback
const output = engine.mixAudio(4096);
```

## Testing

Load test MOD files from `demomods/test/` to hear effects in action:
- `arpeggio.mod` - Arpeggio (0xy)
- `vibrato.mod` - Vibrato (4xy)
- `tremolo.mod` - Tremolo (7xy)
- `slide.mod` - Pitch slides (1xx, 2xx)
- `slide_to_note.mod` - Tone portamento (3xx)
- `volume_slide.mod` - Volume slides (Axy)
