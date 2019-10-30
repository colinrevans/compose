import { accidental, accidentals, accidentalRegex } from "./accidentals"
/**
   TYPES:
   accidental : '#' | '##' | 'b' | 'bb' | 'n' | ''
   octave : 0-8
   letter : abcdefgABCDEFG

   a note string (noteStr) is, eg, 'C#4' or 'Dbb5'
*/

const noteLetterRegex = /^[abcdefgABCDEFG]$/
type noteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G"
//prettier-ignore
type noteInputLetter = "a" | "A" | "b" | "B" | "c" | "C" | "d" | "D" | "e" | "E" | "f" | "F" | "g" | "G"

const withinOctaveBounds = (i: number) => {
 if (i < 0) return 0
 else if (i > 8) return 8
 return Math.round(i)
}

const noteStrToMidiNoteNumber = (str: string) => {
 const letter = str.toLowerCase().charAt(0)
 const accidentalMatch = str.match(accidentalRegex)
 const accidental = accidentalMatch ? accidentalMatch[0].substr(1) : ""
 const octave = parseInt(str.charAt(str.length - 1), 10)

 return (
  lettersToPcs[letter] +
  accidentalsToChromaticHalfSteps[accidental] +
  12 +
  12 * octave
 )
}

const midiNoteNumberToNoteString = (n: number) => {
 const octave = Math.floor((n - 12) / 12)
 console.log(octave)
 const pc = n % 12
 console.log(`${pcsToLetters[pc]}${octave}`)
 return `${pcsToLetters[pc]}${octave}`
}

export interface NoteJSON {
 type: "note"
 letter: noteLetter
 accidental: accidental
 octave: number
}

export interface NoteInterface {
 letter: noteLetter
 accidental: accidental
 octave: number
 midiNoteNumber: number
 vexflowRepresentation: string
 enharmonic: NoteInterface
 reset: (note: NoteInterface) => NoteInterface // stateful
 copy: () => NoteInterface // functional
 withOctave: (octave: number) => NoteInterface
 withOctaveAdjustedBy: (octaves: number) => NoteInterface
 transposeByHalfSteps: (steps: number) => NoteInterface
 toString: () => string
 toJSON: () => NoteJSON
}

class Note {
 private _letter: noteLetter
 private _octave: number
 accidental: accidental

 constructor(noteStr: string)
 constructor(letter: noteInputLetter)
 constructor(midiNoteNumber: number)
 constructor(letter: noteInputLetter, accidental: accidental, octave: number)
 constructor(
  note: noteInputLetter | number | string,
  accidental?: accidental,
  octave?: number
 ) {
  this._letter = "C"
  this._octave = 4

  if (accidental === undefined && octave === undefined) {
   let noteStr: string
   if (typeof note === "number") {
    let midiNoteNumber = note
    noteStr = midiNoteNumberToNoteString(midiNoteNumber)
   } else noteStr = note

   this.letter = noteStr[0] as noteInputLetter

   const accidentalMatch = noteStr.match(accidentalRegex)
   if (accidentalMatch)
    this.accidental = accidentalMatch[0].substr(1) as accidental
   else this.accidental = ""

   const octaveMatch = noteStr.match(/\d+/)
   if (octaveMatch) this.octave = Number(octaveMatch[0])
   else this.octave = 4
  } else {
   let letter = note
   // note, accidental, and octave are split amongst arguments
   if (
    typeof letter === "number" ||
    !letter.match(noteLetterRegex) ||
    accidental === undefined ||
    octave === undefined
   ) {
    throw new TypeError(
     "note constructor with multiple arguments requires that the first argument be a noteLetterInput"
    )
   } else {
    this.letter = note as noteInputLetter
    this.accidental = accidental
    this.octave = octave ? octave : 4
   }
  }
 }

 reset(note: NoteInterface) {
  this.letter = note.letter
  this.accidental = note.accidental
  this.octave = note.octave
  return this
 }

 set letter(letter: noteInputLetter) {
  if (!letter.match(noteLetterRegex)) {
   throw new TypeError(`letter must match ${noteLetterRegex}. got ${letter}`)
  }
  this._letter = letter.toUpperCase() as noteLetter
 }

 get letter() {
  return this._letter
 }

 get midiNoteNumber() {
  return noteStrToMidiNoteNumber(this.toString())
 }

 get vexflowRepresentation() {
  return `${this.letter}${this.accidental}/${this.octave}`
 }

 get enharmonic() {
  if (this.accidental === "") return this
  console.log(enharmonics[`${this.letter}${this.accidental}`])
  let str = `${this.letter}${this.accidental}`
  let oct = this.octave
  if (Object.keys(enharmonics).includes(str)) {
   if (str === "B#") oct += 1
   if (str === "Cb") oct -= 1
   console.log("lala", enharmonics[str])
   console.log("le", oct)
   console.log(`${enharmonics[str]}${oct}`)
   let n = new Note(`${enharmonics[str]}${oct}`)
   // typescript doesn't know that noteInputLetter encompasses noteLetter
   // @ts-ignore
   return this.reset(n)
  }
  return this
 }

 toEnharmonic() {
  return this.enharmonic
 }

 copy() {
  return new Note(this.letter, this.accidental, this.octave)
 }

 set octave(octave) {
  if (typeof octave !== "number") throw new TypeError("octave not a number!")
  this._octave = withinOctaveBounds(octave)
 }

 get octave() {
  return this._octave
 }

 withOctaveAdjustedBy(n: number) {
  return new Note(this.letter, this.accidental, this.octave + n)
 }

 withOctave(o: number) {
  return new Note(this.letter, this.accidental, o)
 }

 toString() {
  return `${this.letter}${this.accidental}${this.octave}`
 }

 transposeByHalfSteps(steps: number) {
  return new Note(this.midiNoteNumber + steps)
 }

 toJSON() {
  return {
   type: "note",
   letter: this.letter,
   accidental: this.accidental,
   octave: this.octave,
  }
 }
}

export default Note

// TODO double sharps and double flats !
const enharmonics = {
 ["Cb"]: "B",
 ["C#"]: "Db",
 ["D#"]: "Eb",
 ["E#"]: "F",
 ["Fb"]: "E",
 ["F#"]: "Gb",
 ["G#"]: "Ab",
 ["A#"]: "Bb",
 ["B#"]: "C",
} as { [note: string]: string }
 ; (() => {
  // reverse them too
  let vals = Object.values(enharmonics)
  let keys = Object.keys(enharmonics)
  for (let i = 0; i < vals.length; i++) {
   enharmonics[vals[i]] = keys[i]
  }
 })()

const lettersToPcs = {
 c: 0,
 d: 2,
 e: 4,
 f: 5,
 g: 7,
 a: 9,
 b: 11,
} as { [letter: string]: number }

const accidentalsToChromaticHalfSteps = {
 "": 0,
 "#": 1,
 b: -1,
 "##": 2,
 bb: -2,
 n: 0,
} as { [accidental: string]: number }

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
} as { [pc: number]: string }
