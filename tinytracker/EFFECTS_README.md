# TinyTracker Effects Guide

This guide explains all the effects available in TinyTracker and how to use them.

## Understanding Effect Parameters

Effects in TinyTracker use hexadecimal notation (0x00 to 0xFF):
- `0x00` = 0 in decimal
- `0x10` = 16 in decimal  
- `0xFF` = 255 in decimal
- Two-digit hex: `0xXY` where X and Y are nibbles (0-F each)

Default parameters are automatically set when you select an effect, but you can adjust them using the +/- buttons.

---

## Effect List

### 0x01 - Arpeggio
**Default Parameter:** `0x37` (Major chord)

Creates rapid note changes to simulate chords.

**How it works:**
- Parameter format: `0xXY`
- X = semitones for second note
- Y = semitones for third note
- Cycles through: base note → base+X → base+Y

**Examples:**
- `0x37` = Major chord (0, +3, +7 semitones) = C, E, G
- `0x47` = Major chord (0, +4, +7 semitones) = C, E, G  
- `0x34` = Minor chord (0, +3, +4 semitones) = C, Eb, E
- `0x07` = Power chord (0, 0, +7 semitones) = C, C, G
- `0x0C` = Octave (0, 0, +12 semitones) = C, C, C'

**Musical Use:**
- Basslines with implied harmony
- Retro game-style chords
- Adding harmonic richness with single notes

---

### 0x02 - Slide Up
**Default Parameter:** `0x10` (Moderate speed)

Continuously increases pitch.

**How it works:**
- Parameter = slide speed (0x01-0xFF)
- Higher values = faster pitch increase
- Continues until next note or pattern end

**Examples:**
- `0x05` = Slow slide (subtle pitch bend)
- `0x10` = Moderate slide
- `0x20` = Fast slide (siren effect)
- `0x40` = Very fast slide

**Musical Use:**
- Siren/alarm effects
- Pitch bends (combine with Note Cut for controlled length)
- Rising tension
- Lead synth expression

---

### 0x03 - Slide Down
**Default Parameter:** `0x10` (Moderate speed)

Continuously decreases pitch.

**How it works:**
- Parameter = slide speed (0x01-0xFF)
- Higher values = faster pitch decrease
- Continues until next note or pattern end

**Examples:**
- `0x05` = Slow slide
- `0x10` = Moderate slide
- `0x20` = Fast slide (falling effect)
- `0x40` = Very fast slide

**Musical Use:**
- Falling effects (explosions, drops)
- Pitch bends downward
- Bass drops
- Lead synth expression

---

### 0x04 - Vibrato
**Default Parameter:** `0x44` (Speed 4, Depth 4)

Creates pitch wobble/vibrato effect.

**How it works:**
- Parameter format: `0xXY`
- X = speed (0-F, how fast it wobbles)
- Y = depth (0-F, how much it wobbles)

**Examples:**
- `0x22` = Subtle vibrato (slow, shallow)
- `0x44` = Standard vibrato
- `0x88` = Wide vibrato (expressive)
- `0x24` = Slow but deep vibrato
- `0x82` = Fast but shallow vibrato

**Musical Use:**
- Expressive leads
- Vocal-like synth sounds
- Adding life to sustained notes
- Retro game aesthetic

---

### 0x05 - Portamento (Slide to Note)
**Default Parameter:** `0x20` (Moderate speed)

Smoothly slides from current note to target note.

**How it works:**
- Parameter = slide speed (0x01-0xFF)
- Place target note with Portamento effect
- Pitch slides from current note to target
- If no note is playing, plays target immediately

**Examples:**
- `0x10` = Slow portamento (smooth glide)
- `0x20` = Moderate portamento
- `0x40` = Fast portamento
- `0x80` = Very fast portamento (almost instant)

**Musical Use:**
- Smooth basslines (classic tracker technique)
- Lead synth slides
- Theremin-like effects
- Expressive melodies
- 303-style acid bass

**Usage Pattern:**
```
Row 00: C-4 (normal note)
Row 04: E-4 + Portamento 0x20 (slides from C to E)
Row 08: G-4 + Portamento 0x20 (slides from E to G)
```

---

### 0x0A - Volume Slide
**Default Parameter:** `0x0F` (Slide down by 15)

Gradually changes volume up or down.

**How it works:**
- Parameter format: `0xXY`
- X = slide up amount per tick
- Y = slide down amount per tick
- Only one should be non-zero

**Examples:**
- `0x0F` = Slide down (fade out)
- `0xF0` = Slide up (fade in)
- `0x05` = Slow fade out
- `0x50` = Slow fade in

**Musical Use:**
- Fade in/fade out effects
- Volume swells
- Dynamic expression
- Ducking effects

---

### 0x0C - Set Volume
**Default Parameter:** `0x40` (Full volume = 64 decimal)

Instantly sets the volume level.

**How it works:**
- Parameter = volume (0x00-0x40 in hex, 0-64 in decimal)
- `0x00` = Silent
- `0x40` = Full volume
- Values above 0x40 are treated as full volume

**Examples:**
- `0x00` = Silent (mute)
- `0x10` = 25% volume (quiet)
- `0x20` = 50% volume (medium)
- `0x30` = 75% volume (loud)
- `0x40` = 100% volume (full)

**Musical Use:**
- Accent notes (louder)
- Ghost notes (quieter)
- Dynamic variation
- Volume automation

---

### 0x0D - Note Cut
**Default Parameter:** `0x08` (Cut after 8 ticks)

Cuts the note after specified number of ticks.

**How it works:**
- Parameter = ticks to wait before cutting (0x00-0xFF)
- Note plays normally until tick count reached
- Then immediately silenced
- Tempo setting determines tick speed (default 6 ticks/row)

**Examples:**
- `0x01` = Very short note (cut almost immediately)
- `0x04` = Short staccato
- `0x08` = Medium length
- `0x0C` = Longer note (3/4 of row at tempo 6)

**Musical Use:**
- Tight hi-hats (essential for drums!)
- Staccato notes
- Percussive sounds
- Gated synth effects
- Precise rhythm control

**Usage Tip:**
With default tempo (6 ticks/row), a value of 0x06 cuts exactly at the next row.

---

### 0x0E - Retrigger
**Default Parameter:** `0x04` (Every 4 ticks)

Retriggers the note at regular intervals.

**How it works:**
- Parameter = retrigger interval in ticks (0x01-0xFF)
- Note is retriggered (reset phase & envelope) every X ticks
- Creates stuttering/gating effect

**Examples:**
- `0x01` = Every tick (extreme glitch)
- `0x02` = Every 2 ticks (fast stutter)
- `0x04` = Every 4 ticks (moderate)
- `0x08` = Every 8 ticks (slow retrigger)
- `0x0C` = Every 12 ticks (very slow)

**Musical Use:**
- Drum rolls (especially on noise channel)
- Glitch effects
- Rhythmic variation
- Gated synth patterns
- Snare rolls

**Usage Tip:**
Combine with Volume Slide for classic fadeout rolls.

---

### 0x0F - Duty Cycle
**Default Parameter:** `0x80` (50% duty cycle)

Changes the pulse width of the square wave.

**How it works:**
- **Only works on Channel 0 (Melody - Square Wave)**
- Parameter = duty cycle (0x00-0xFF = 0%-100%)
- Changes timbre of square wave
- Resets to 50% when new note is triggered

**Examples:**
- `0x10` = ~6% duty cycle (very thin, hollow)
- `0x40` = 25% duty cycle (thin pulse, bright)
- `0x80` = 50% duty cycle (standard square wave)
- `0xC0` = 75% duty cycle (wide pulse, full)
- `0xF0` = ~94% duty cycle (very wide, full)

**Musical Use:**
- Timbral variation within a melody
- "Talking" bass sounds (C64 style)
- Dynamic tone changes
- Replicating classic chip sounds

**Note:** 
This effect is **channel-specific** and only affects the square wave channel (Channel 0 - Melody). Other channels use different waveforms (Sawtooth, Sine, Noise) and are not affected.

---

## Effect Combinations

Some effects work great together:

### Expressive Lead
- Base note + Vibrato `0x44` + Volume Slide `0xF0` = Swelling vibrato lead

### Acid Bassline
- Note + Portamento `0x30` + Slide Down `0x10` = Classic 303 style

### Drum Roll
- Noise note + Retrigger `0x02` + Volume Slide `0x0F` = Fadeout snare roll

### Siren
- Note + Slide Up `0x20` + Note Cut `0x10` = Rising pitch effect

### Staccato Arpeggio
- Note + Arpeggio `0x37` + Note Cut `0x08` = Tight chordal hit

---

## Tips & Tricks

1. **Test effects in Pattern Loop mode** - Set Loop checkbox to hear your pattern repeat

2. **Tempo affects tick-based effects** - Default is 6 ticks/row, so:
   - Note Cut `0x06` = cuts at next row
   - Retrigger `0x03` = 2 retrigs per row

3. **Combine effects across rows** - Effects continue until changed:
   ```
   Row 00: C-4 + Vibrato 0x44
   Row 01: --- (vibrato continues)
   Row 02: --- (vibrato continues)
   Row 03: E-4 (new note, vibrato stops)
   ```

4. **Channel-specific effects:**
   - Duty Cycle only works on Channel 0 (Melody/Square)
   - Use Note Cut for tight drums on Channel 3 (Noise)

5. **Default parameters are beginner-friendly** - Just click an effect to use it with good default values

6. **Experiment with extreme values** - Try `0xFF` or `0x01` for unique sounds

7. **Right-click to clear** - Right-click notes or effects in the grid to delete them

8. **Scroll the effects list** - Use mouse wheel over the effects panel to see all effects

---

## Quick Reference Table

| Effect | ID   | Default | Best For                          |
|--------|------|---------|-----------------------------------|
| Arpeggio | 0x01 | 0x37 | Chords, basslines                |
| Slide Up | 0x02 | 0x10 | Pitch bends, sirens              |
| Slide Down | 0x03 | 0x10 | Drops, pitch bends             |
| Vibrato | 0x04 | 0x44 | Expressive leads, life           |
| Portamento | 0x05 | 0x20 | Smooth slides, acid bass      |
| Vol Slide | 0x0A | 0x0F | Fades, swells                    |
| Set Vol | 0x0C | 0x40 | Accents, dynamics                |
| Note Cut | 0x0D | 0x08 | Tight drums, staccato            |
| Retrigger | 0x0E | 0x04 | Rolls, glitch                    |
| Duty Cycle | 0x0F | 0x80 | Timbre (Ch0 only)              |

---

## Learning Path

**Beginner:**
1. Start with Note Cut (0x0D) for drums
2. Try Arpeggio (0x01) for chords
3. Use Set Volume (0x0C) for dynamics

**Intermediate:**
4. Add Vibrato (0x04) to leads
5. Try Portamento (0x05) for smooth bass
6. Experiment with Retrigger (0x0E)

**Advanced:**
7. Combine effects for complex sounds
8. Master Volume Slide (0x0A) timing
9. Use Duty Cycle (0x0F) for timbral variation

---

## Need Help?

- **Click an effect** - Default parameters are set automatically
- **Mouse wheel** - Scroll the effects list to see all 10 effects
- **Right-click** - Clear notes or effects
- **+/- buttons** - Adjust effect parameters in hex

Happy tracking! 🎵
