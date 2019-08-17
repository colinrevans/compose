import { equals } from "ramda"

// middle C is MIDI 60

// tailored to verticality format:
// verticality : { keys: [{ key: "c", octave: 4, accidental: ''}, ...], duration: "q"}

const keyHalfStepsFromCTable = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

const notesUp = {
  c: "d",
  d: "e",
  e: "f",
  f: "g",
  g: "a",
  a: "b",
  b: "c",
}

const notesDown = {
  c: "b",
  d: "c",
  e: "d",
  f: "e",
  g: "f",
  a: "g",
  b: "a",
}

const accidentalHalfStepsTable = {
  n: 0,
  "": 0,
  b: -1,
  "#": 1,
  bb: -2,
  "##": 2,
}

const halfStepToAccidentals = {
  "0": "",
  "1": "#",
  "2": "##",
  "-1": "b",
  "-2": "bb",
}

const higher = (n, n2) => {
  return midiNote(n) > midiNote(n2)
}

const lower = (n, n2) => !higher(n, n2)

const keyFromMidiNote = n => {
  let octave = Math.floor(n / 12) - 1
  let mod = n % 12
  let key
  let diff = 0
  for (let k of Object.keys(keyHalfStepsFromCTable)) {
    if (mod >= keyHalfStepsFromCTable[k]) {
      key = k
      diff = mod - keyHalfStepsFromCTable[k]
    }
  }
  let accidental = halfStepToAccidentals[diff.toString()]
  return { key, accidental, octave }
}

const planeUp = vert => {
  let keys = vert.keys.map(k => ({
    ...k,
    key: notesUp[k.key],
    octave: k.key === "b" ? k.octave + 1 : k.octave,
  }))
  return { ...vert, keys }
}

const deleteNoteInVerticalityByIdx = (vert, i) => {
  if (i < 0 || i >= vert.keys.length) return vert
  let { keys } = vert
  let r = []
  keys.map((x, idx) => {
    if (idx !== i) r.push(x)
  })
  keys = r
  return { ...vert, keys }
}

const planeDown = vert => {
  let keys = vert.keys.map(k => ({
    ...k,
    key: notesDown[k.key],
    octave: k.key === "c" ? k.octave - 1 : k.octave,
  }))
  return { ...vert, keys }
}

const verticalityToMidiNotes = vert => {
  return vert.keys.map(key => midiNote(key))
}

const removeDuplicateNotes = vert => {
  let r = []
  let keys = vert.keys
  for (let key of vert.keys) {
    let unique = true
    for (let added of r) {
      if (equals(key, added)) unique = false
    }
    if (unique) r.push(key)
  }
  keys = r
  return { ...vert, keys }
}

const midiNote = note => {
  let octavesC = (4 - note.octave) * -12 + 60
  return (
    octavesC +
    keyHalfStepsFromCTable[note.key] +
    accidentalHalfStepsTable[note.accidental]
  )
}

const sortVerticality = vert => {
  let newKeys = vert.keys.sort((a, b) => midiNote(a) - midiNote(b))
  return { ...vert, keys: newKeys }
}

// INPUT SHOULD BE SORTED
const octaveSpan = sortedVert => {
  if (sortedVert.keys.length <= 1) return 0

  const lowest = sortedVert.keys[0]
  const highest = sortedVert.keys[sortedVert.keys.length - 1]
  return Math.ceil((midiNote(highest) - midiNote(lowest)) / 12)
}

const removeAccidentals = vert => {
  return { ...vert, keys: vert.keys.map(key => ({ ...key, accidental: "" })) }
}

const clean = x => removeDuplicateNotes(sortVerticality(x))

export default {
  verticalityToMidiNotes,
  midiNote,
  sortVerticality,
  octaveSpan,
  planeUp,
  planeDown,
  keyFromMidiNote,
  deleteNoteInVerticalityByIdx,
  removeDuplicateNotes,
  removeAccidentals,
  clean,
  higher,
}
