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

const accidentalHalfStepsTable = {
  n: 0,
  "": 0,
  b: -1,
  "#": 1,
  bb: -2,
  "##": 2,
}

const verticalityToMidiNotes = vert => {
  return vert.keys.map(key => midiNote(key))
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
  if (sortedVert.keys.length === 1) return 1
  if (sortedVert.keys.length === 0) return 0

  const lowest = sortedVert.keys[0]
  const highest = sortedVert.keys[sortedVert.keys.length - 1]
  return Math.ceil((midiNote(highest) - midiNote(lowest)) / 12)
}

export default {
  verticalityToMidiNotes,
  midiNote,
  sortVerticality,
  octaveSpan,
}