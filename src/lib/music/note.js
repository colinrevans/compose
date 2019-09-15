import { accidentals } from "./accidentals"
/**
   TYPES:
   accidental : '#' | '##' | 'b' | 'bb' | 'n' | ''
   octave : 0-8
   letter : abcdefgABCDEFG

   a note string (noteStr) is, eg, 'C#4' or 'Dbb5'
*/

const noteRegex = /^[abcdefgABCDEFG]$/
const accidentalRegex = /^.(#|##|b|bb)/

const withinOctaveBounds = i => {
  if (i < 0) return 0
  else if (i > 8) return 8
  return Math.round(i)
}

const hasAccidental = noteStr => noteStr.match(accidentalRegex)

const noteStrToMidiNoteNumber = str => {
  const letter = str.toLowerCase().charAt(0)
  const accidental = hasAccidental(str)
    ? str.match(accidentalRegex)[0].substr(1)
    : ""
  const octave = parseInt(str.charAt(str.length - 1), 10)

  return (
    lettersToPcs[letter] +
    accidentalsToChromaticHalfSteps[accidental] +
    12 +
    12 * octave
  )
}

const midiNoteNumberToNoteString = n => {
  const octave = Math.floor((n - 12) / 12)
  console.log(octave)
  const pc = n % 12
  console.log(`${pcsToLetters[pc]}${octave}`)
  return `${pcsToLetters[pc]}${octave}`
}

class Note {
  constructor(note, accidental, octave) {
    if (accidental === undefined && octave === undefined) {
      if (typeof note === "number") {
        note = midiNoteNumberToNoteString(note)
      }

      if (typeof note === "string") {
        // input is "C#4" or similar
        let noteStr = note
        this.note = noteStr[0]
        if (noteStr.match(accidentalRegex))
          this.accidental = noteStr.match(accidentalRegex)[0].substr(1)
        else this.accidental = ""
        this.octave = Number(noteStr.match(/\d+/)[0])
      } else if (typeof note === "number") {
        //input is a MIDI note number
      }
    } else {
      // note, accidental, and octave are split amongst arguments
      this.note = note
      this.accidental = accidental
      this.octave = octave ? octave : 4
    }
  }

  reset(note) {
    this.note = note.note
    this.accidental = note.accidental
    this.octave = note.octave
    return this
  }

  set note(note) {
    if (!note.match(noteRegex)) {
      throw new TypeError(`note must match ${noteRegex}. got ${note}`)
    }

    this._note = note.toUpperCase()
  }

  get note() {
    return this._note
  }

  get letter() {
    return this._note
  }

  set accidental(accidental) {
    if (!accidentals.includes(accidental)) {
      throw new TypeError("incorrect accidental input.")
    }

    this._accidental = accidental
  }

  get accidental() {
    return this._accidental
  }

  get midiNoteNumber() {
    return noteStrToMidiNoteNumber(this.toString())
  }

  get vexflowRepresentation() {
    return `${this.note}${this.accidental}/${this.octave}`
  }

  get enharmonic() {
    if (this.accidental === "") return this
    console.log(enharmonics[this.toString()])
    if (Object.keys(enharmonics).includes(this.toString())) {
      return this.reset(enharmonics[this.toString()])
    }
    return this
  }

  toEnharmonic() {
    return this.enharmonic
  }

  copy() {
    return new Note(this.note, this.accidental, this.octave)
  }

  set octave(octave) {
    if (typeof octave !== "number") throw new TypeError("octave not a number!")
    this._octave = withinOctaveBounds(octave)
  }

  get octave() {
    return this._octave
  }

  withOctaveAdjustedBy(n) {
    return new Note(this.note, this.accidental, this.octave + n)
  }

  withOctave(o) {
    return new Note(this.note, this.accidental, o)
  }

  toString() {
    return `${this.note}${this.accidental}${this.octave}`
  }

  toJSON() {
    return {
      type: "note",
      letter: this.letter,
      accidental: this.accidental,
      octave: this.octaveve,
    }
  }
}

export default Note

// TODO double sharps and double flats !
const enharmonics = {
  ["Cb4"]: "B3",
  ["C#4"]: "Db4",
  ["D#4"]: "Eb4",
  ["E#4"]: "F4",
  ["Fb4"]: "E4",
  ["F#4"]: "Gb4",
  ["G#4"]: "Ab4",
  ["A#4"]: "Bb4",
  ["B#4"]: "C5",
}
;(() => {
  // reverse them too
  let vals = Object.values(enharmonics)
  let keys = Object.keys(enharmonics)
  for (let i = 0; i < vals.length; i++) {
    enharmonics[vals[i]] = keys[i]
  }
  // and go ahead and make the values Notes, not their string values.
  keys = Object.keys(enharmonics)
  for (let key of keys) {
    enharmonics[key] = new Note(enharmonics[key])
  }
  Object.freeze(enharmonics)
})()

const lettersToPcs = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

const accidentalsToChromaticHalfSteps = {
  "": 0,
  "#": 1,
  b: -1,
  "##": 2,
  bb: -2,
  n: 0,
}

const pcsToLetters = {
  0: "C",
  1: "C#",
  2: "D",
  3: "D#",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "G#",
  9: "A",
  10: "Bb",
  11: "B",
}
