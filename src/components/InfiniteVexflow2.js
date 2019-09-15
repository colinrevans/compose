import React, { useState, useEffect, useCallback } from "react"
import { VexPlaybackButton } from "./vexflow-components"
import Inspector from "./inspector"
import TextField from "@material-ui/core/TextField"
import empty from "is-empty"
import System from "../lib/music/system"
import Duration from "../lib/music/duration"
import Verticality from "../lib/music/verticality"
import Staff from "../lib/music/staff"
import Voice, { melody } from "../lib/music/voice"
import Note from "../lib/music/note.js"
import Rest from "../lib/music/rest"
import TimeSignature from "../lib/music/time-signature"

let toLog = []
let logging = ""
const c = (...args) => {
  if (toLog.includes(logging)) {
    console.log(...args)
  }
}
const log = x => {
  if (toLog.includes(x)) {
    console.log(" ")
    console.log("logging: ", x)
    console.log(" ")
  }
  logging = x
}
const unlog = () => (logging = "")

const applyFnToElemAndChildren = (fn, elem) => {
  if (elem.children.length > 0) {
    fn(elem)
    for (let child of elem.children) {
      applyFnToElemAndChildren(fn, child)
    }
  } else {
    fn(elem)
  }
}

// a map of vexflow-generated DOMIds to references to their respective music elements
// this is not in the component because we can't let it get out of sync, eg. by using setState
let DOMIdsToVexflows = {}

const e = new Duration(1, 2)
const q = new Duration(1, 4)
const testSystems = [
  new System(
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "f4", "e4", "d4").at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System(
    new Staff([
      new Voice([new Verticality(["c4", "e4", "g4"])]).at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System(
    new Staff([
      new Voice([new Verticality(["c4", "e4", "g4"])]).at(0),
      new Voice([new Verticality(["d4", "f4", "a4"])]).at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      melody("e4", "f4", "g4", "a4").at(0),
      new TimeSignature(4, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      melody("f4", "e4", "d4", "c4").at(0),
      new TimeSignature(2, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      new TimeSignature(3, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5")
        .withDurations(e)
        .at(0),
      new TimeSignature(4, 4).at(0),
    ]),
  ]),
  new System(
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5")
        .withDurations(e)
        .at(0),
      melody("c5", "b4", "a4", "g4", "a4", "b4", "c5", "d5")
        .withDurations(e)
        .at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
]

const last = arr => arr[arr.length - 1]

// keys that are currently pressed.
// used to reliably suppress key repeats when necessary
let keysDown = {}
// midi keys pressed
let midiNotesDown = {}
let firstMidiNote = null
// lastKeyEventType : "up" | "down" | null
// this is used for managing whether piano roll input
// adds to a chord or creates a new note.
let lastKeyEventType = null
let firstPianoRollKey = null

const pianoRollRegex = /^[awsedftgyhujkl;bvc\[\]\\]$/
const pianoRollKeysToNotes = {
  a: { letter: "c" },
  w: { letter: "c", accidental: "#" },
  s: { letter: "d" },
  e: { letter: "e", accidental: "b" },
  d: { letter: "e" },
  f: { letter: "f" },
  t: { letter: "f", accidental: "#" },
  g: { letter: "g" },
  y: { letter: "a", accidental: "b" },
  h: { letter: "a" },
  u: { letter: "b", accidental: "b" },
  j: { letter: "b" },
  k: { letter: "c", octaveAdjust: 1 },
  l: { letter: "d", octaveAdjust: 1 },
  [";"]: { letter: "e", octaveAdjust: 1 },
  ["["]: { letter: "f", octaveAdjust: 1 },
  ["]"]: { letter: "g", octaveAdjust: 1 },
  ["\\"]: { letter: "a", octaveAdjust: 1 },
  b: { letter: "b", octaveAdjust: -1 },
  v: { letter: "a", octaveAdjust: -1 },
  c: { letter: "g", octaveAdjust: -1 },
}

const durationRegex = /^[123456]$/
const durationKeysToDurations = {
  1: [4, 1],
  2: [2, 1],
  3: [1, 1],
  4: [1, 2],
  5: [1, 4],
  6: [1, 8],
  7: [1, 16],
}

import {
  getViewportCoordinates,
  setElementPropertyById,
  deleteElementById,
  selectElementAndDeselectRest,
} from "../lib/infinite-util"

const convertSavedMusicFromJSON = json => {
  let saved = []
  for (let ent of json.music) {
    if (ent.type === "time-signature")
      saved.push(
        new TimeSignature(ent.numerator, ent.denominator).at(ent.position)
      )
    else if (ent.type === "voice")
      saved.push(
        new Voice(
          ent.temporals.map(temp => {
            if (temp.type === "rest")
              return new Rest(
                new Duration(temp.duration.numerator, temp.duration.denominator)
              )
            else if (temp.type === "verticality")
              return new Verticality(
                temp.notes.map(n => new Note(n.letter, n.accidental, n.octave)),
                new Duration(temp.duration.numerator, temp.duration.denominator)
              )
          })
        ).at(ent.position)
      )
  }
  return new System(new Staff(saved))
}

export const InfiniteVexflow = ({
  context,
  scale,
  x,
  y,
  id,
  selected,
  ...save
}) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState(
    save.options
      ? save.options
      : {
          ["scale"]: 1 / scale,
          ["playback"]: false,
        }
  )

  // the last command field command. stored so that
  // the period key can repeat a command, like vim.
  const [lastCommand, setLastCommand] = useState("")
  const [music, setMusic] = useState(
    save.music
      ? convertSavedMusicFromJSON(save.music)
      : new System([new Staff([new TimeSignature(4, 4).at(0)])])
  )
  const [showCommandField, setShowCommandField] = useState(false)
  const [commandKeys, setCommandKeys] = useState([])
  const [vexflowRenderTicker, setVexflowRenderTicker] = useState(false)
  const triggerRender = () => setVexflowRenderTicker(t => !t)
  const [CURRENT, SETCURRENT] = useState(null)
  const [currentVoice, setCurrentVoice] = useState(
    save.music ? music.staves[0].voices[0] : null
  )
  const [preCurrent, setPreCurrent] = useState(true)
  const [octave, setOctave] = useState(4)
  const [noNotes, setNoNotes] = useState(save.music ? false : true)
  // NB this is an index into durationKeysToDurations;
  const [editorDuration, setEditorDuration] = useState("4")
  const [MIDIInputs, setMIDIInputs] = useState(null)
  const getCurrent = () => {
    if (DOMIdsToVexflows[id]) return DOMIdsToVexflows[id][CURRENT]
    else return null
  }
  const preserveCurrent = () => {
    if (!getCurrent()) return
    if (getCurrent() === getCurrent().canonical)
      getCurrent().canonical.makeCurrent = true
    else {
      if (getCurrent().tie) getCurrent().cononical.makeFormerCurrent = true
      else getCurrent().canonical.makeLatterCurrent = true
    }
  }
  const getCurrentOnDOM = () => document.getElementById(`vf-${CURRENT}`)
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  useEffect(() => {
    DOMIdsToVexflows[id] = {}
  }, [])

  const pushStateToCanvas = useCallback(() => {
    //TODO save music as JSON string
    let entsAsJSON = []
    for (let ent of music.staves[0].entities) {
      entsAsJSON.push(ent.toJSON())
    }
    let saveState = { music: entsAsJSON }
    console.log("saving: ", entsAsJSON)
    context.saveElement(id, { music: saveState, options })
  }, [music, options])

  const loadFromCanvasState = useCallback(() => {
    // TODO load music from JSON string
    setMusic(music =>
      save.music ? convertSavedMusicFromJSON(save.music) : music
    )
    if (save.music) triggerRender()
    setOptions(opts => (save.options ? save.options : opts))
  }, [])

  const toggleCommandField = useCallback(() => {
    setCommandKeys([])
    setShowCommandField(f => !f)
  }, [])

  const commandFieldBackspace = useCallback(() => {
    if (commandKeys.length <= 1) toggleCommandField()
    else setCommandKeys(keys => keys.slice(0, keys.length - 1))
  }, [])

  const addKeyToCommandField = useCallback(
    x => setCommandKeys(keys => [...keys, x]),
    []
  )

  const doLastCommand = useCallback(
    () => commandFieldCommands[lastCommand.name].fn(lastCommand.arg),
    [lastCommand]
  )

  const setCurrentToDur = (num, denom) => {
    if (!getCurrent()) return
    getCurrent().canonical.duration = new Duration(num, denom)
    if (getCurrent().filler) {
      console.log("filler")
      getCurrent().canonical.duration = new Duration(num, denom)
      getCurrent().owner.add(getCurrent())
      getCurrent().filler = false
      getCurrent().makeCurrent = true
      triggerRender()
    } else {
      console.log("not filler")
      if (
        getCurrent().next &&
        getCurrent().next instanceof Rest &&
        !getCurrent().next.next
      ) {
        console.log("pre filler")
        preserveCurrent()
        getCurrent().next = null
      } else {
        console.log("not prefiller")
        if (getCurrent().next) {
          console.log("next")
          getCurrent().next.canonical.makeCurrent = true
        } else {
          console.log("no next")
          preserveCurrent()
        }
      }
      triggerRender()
    }

    //getCurrent().canonical.makeCurrent = true
  }

  const moveCurrentRight = () => {
    if (preCurrent) {
      // move current to first note of first voice
      currentVoice.temporals[0].makeCurrent = true
      setPreCurrent(false)
      triggerRender()
    }
    if (!getCurrent()) return
    if (!getCurrent().next) return
    SETCURRENT(getCurrent().next.DOMId)
  }

  const moveCurrentLeft = () => {
    if (!getCurrent()) return
    if (!getCurrent().prev) {
      setPreCurrent(true)
      setCurrentVoice(getCurrent().owner)
      SETCURRENT(null)
    } else {
      SETCURRENT(getCurrent().prev.DOMId)
    }
  }

  const pianoRoll = (e, midiNoteNumber) => {
    console.log("piano roll:", e.key || midiNoteNumber)
    if (!getCurrent() && !music.staves[0].empty && !preCurrent) return
    if (e.key !== undefined && e.key === firstPianoRollKey) return
    if (!firstPianoRollKey && !e.metaKey) firstPianoRollKey = e.key
    setNoNotes(false)
    let note = midiNoteNumber
      ? new Note(midiNoteNumber)
      : pianoRollKeysToNotes[e.key]
    if (!(note instanceof Note)) {
      note = new Note(
        note.letter,
        note.accidental ? note.accidental : "",
        octave + (note.octaveAdjust ? note.octaveAdjust : 0)
      )
    }

    // if the new note and the current note have the same letter
    // but different accidentals,
    // switch the note with the accidental to its enharmonic so we get, eg,
    // f - gb - f rather than f - f# - f automatically.
    if (
      getCurrent() &&
      getCurrent() instanceof Verticality &&
      getCurrent().notes[0]
    ) {
      let curNote = getCurrent().notes[0]

      if (
        curNote.letter === note.letter &&
        curNote.accidental !== note.accidental
      ) {
        console.log("hit")
        if (getCurrent().notes[0].accidental === ``) {
          note.toEnharmonic()
        } else if (note.accidental === "") {
          getCurrent().notes[0].toEnharmonic()
        }
      }
    }

    let letter = note.letter
    let accidental = note.accidental
    let oct = note.octave ? note.octave : octave
    let adj = note.octaveAdjust === undefined ? 0 : note.octaveAdjust
    if (!accidental) accidental = ""
    console.log(`${letter}${accidental}${oct + adj}`)
    let noteStr = `${letter}${accidental}${oct + adj}`
    console.log("notestr: ", noteStr)
    try {
      if (getCurrent()) {
        if (
          midiNoteNumber
            ? firstMidiNote === midiNoteNumber
            : !e.metaKey && firstPianoRollKey === e.key
        )
          DOMIdsToVexflows[id][CURRENT].insertAfter(
            new Verticality(
              noteStr,
              new Duration(...durationKeysToDurations[editorDuration])
            )
          )
        else getCurrent().addNote(new Note(noteStr))
      } else if (music.staves[0].empty) {
        let n = new Verticality(
          noteStr,
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        let v = new Voice([n]).at(0)
        setCurrentVoice(v)
        music.staves[0].entities = [...music.staves[0].entities, v]
        setPreCurrent(false)
      } else if (preCurrent) {
        let n = new Verticality(
          noteStr,
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        currentVoice.addBeforeIdx(n, 0)
        setPreCurrent(false)
      }
      triggerRender()
    } catch (err) {
      console.log(Object.keys(err))
      console.log(err.name)
      if (err.name === "NotInVoiceError") {
        // current refers to the dummy rests
        // we put at the end of an incomplete measure.
        // add the rest to the owning voice, then add
        // the new verticality afterwards.
        let cur = getCurrent()
        cur.owner.add(cur)
        let n = new Verticality(
          noteStr,
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        cur.owner.add(n)
        triggerRender()
      } else {
        throw err
      }
    }
  }

  useEffect(() => {
    context.setLastInteractedElemId(id)
  }, [])

  const processMIDINoteOn = (midiNoteNumber, velocity) => {
    midiNotesDown[midiNoteNumber] = true
    if (!firstMidiNote) {
      firstMidiNote = midiNoteNumber
    }
    if (id === context.lastInteractedElemId) pianoRoll({}, midiNoteNumber)
  }

  const processMIDINoteOff = midiNoteNumber => {
    if (midiNotesDown[midiNoteNumber]) {
      midiNotesDown[midiNoteNumber] = null
    }
    if (firstMidiNote === midiNoteNumber) firstMidiNote = null
  }

  const processMIDI = midiMessage => {
    let command = midiMessage.data[0]
    let note = midiMessage.data[1]
    let velocity = midiMessage.data.length > 2 ? midiMessage.data[2] : 0

    console.log(`MIDI message received: ${command} ${note} ${velocity}`)
    if (command === 146 || command === 144) {
      if (velocity > 0) processMIDINoteOn(note, velocity)
      if (velocity === 0) processMIDINoteOff(note)
    }
    if (command === 191 && note === 113 && velocity === 127) {
      enharmonicCurrent()
    }
    if (command === 191 && note === 114 && velocity === 127) {
      adjustCurrentsOctave(-1)
    }
    if (command === 191 && note === 115 && velocity === 127) {
      adjustCurrentsOctave(1)
    }
  }

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      console.log("this browser supports midi.")
      ;(async () => {
        try {
          let { inputs } = await navigator.requestMIDIAccess()
          for (let input of inputs.values()) {
            input.onmidimessage = processMIDI
          }
          setMIDIInputs(inputs)
        } catch (err) {
          console.log(err)
        }
      })()
    }
  }, [])

  useEffect(() => {
    if (MIDIInputs) {
      for (let input of MIDIInputs.values()) {
        input.onmidimessage = processMIDI
      }
    }
  }, [CURRENT, vexflowRenderTicker, context.lastInteractedElemId])

  const moveCurrentToBeginningOfMeasure = () => {
    if (!getCurrent()) return
    let cur = getCurrent()
    if (cur.prev && cur.prev.position !== cur.position) {
      cur = cur.prev
    }
    while (cur.prev && cur.position === cur.prev.position) {
      cur = cur.prev
    }
    SETCURRENT(cur.DOMId)
  }

  const moveCurrentToEndOfMeasure = () => {
    if (!getCurrent()) return

    let cur = getCurrent()
    if (cur.next && cur.next.position !== cur.position) {
      cur = cur.next
    }
    while (cur.next && cur.position === cur.next.position) {
      cur = cur.next
    }
    SETCURRENT(cur.DOMId)
  }

  const replaceCurrentWithRest = () => {
    if (!getCurrent()) return
    if (getCurrent() instanceof Verticality) {
      if (getCurrent() === getCurrent().canonical)
        getCurrent().canonical.turnIntoRest()
      else {
        let rest = new Rest(getCurrent().duration.copy())
        rest.makeCurrent = true
        if (getCurrent().tie) {
          getCurrent().canonical.insertBefore(rest)
        } else {
          getCurrent().canonical.insertAfter(rest)
        }
        getCurrent().canonical.duration = getCurrent().canonical.duration.minus(
          getCurrent().duration
        )
      }
    } else {
      preserveCurrent()
    }
    triggerRender()
  }

  const duplicateCurrent = () => {
    if (!getCurrent()) return
    let cur = getCurrent()
    let copy = cur.copy()
    copy.makeCurrent = true
    cur.canonical.insertAfter(copy)
    triggerRender()
  }

  const moveCurrentToEndOfVoice = () => {
    if (!getCurrent()) return
    let cur = getCurrent()
    while (cur.next) cur = cur.next
    SETCURRENT(cur.DOMId)
  }

  const moveCurrentToBeginningOfVoice = () => {
    if (!getCurrent()) return
    let cur = getCurrent()
    while (cur.prev) cur = cur.prev
    SETCURRENT(cur.DOMId)
  }

  const addRest = () => {
    if (!getCurrent()) {
      if (music.staves[0].empty) {
        let n = new Rest(
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        let v = new Voice([n]).at(0)
        setCurrentVoice(v)
        music.staves[0].entities = [...music.staves[0].entities, v]
        setPreCurrent(false)
        triggerRender()
        return
      } else if (preCurrent) {
        let n = new Rest(
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        music.staves[0].voices[0].addBeforeIdx(n, 0)
        triggerRender()
        return
      } else {
        return
      }
    }

    try {
      getCurrent().insertAfter(
        new Rest(new Duration(...durationKeysToDurations[editorDuration]))
      )
    } catch (err) {
      if (err.name === "NotInVoiceError") {
        getCurrent().owner.add(getCurrent())
        let n = new Rest(
          new Duration(...durationKeysToDurations[editorDuration])
        )
        n.makeCurrent = true
        getCurrent().owner.add(n)
      } else {
        throw err
      }
    }
    triggerRender()
  }

  const invertCurrentUp = () => {
    if (
      !getCurrent() ||
      !(getCurrent() instanceof Verticality) ||
      !getCurrent().isChord()
    )
      return

    getCurrent().canonical.invertUp()
    preserveCurrent()
    triggerRender()
  }

  const adjustCurrentsOctave = n => {
    if (!getCurrent() || !(getCurrent() instanceof Verticality)) {
      return
    }
    if (getCurrent().isCanonical()) {
      getCurrent().notes.forEach(note => (note.octave += n))
      preserveCurrent()
    } else {
      // split up tie
      let adjusted = getCurrent().withOctaveAdjustedBy(n)
      adjusted.makeCurrent = true
      getCurrent().canonical.insertBefore(adjusted)
      getCurrent().canonical.duration = getCurrent().duration.minus(
        adjusted.duration
      )
    }
    triggerRender()
  }

  const createVoice = (direction = "upper", pianoRollKey) => {
    console.log(pianoRollKey)
    if (!(direction === "upper" || direction === "lower")) return
    if (!getCurrent()) return
    let durationInMeasure = null
    if (
      !getCurrent().prev ||
      getCurrent().prev.position < getCurrent().position
    ) {
      durationInMeasure = null
    } else {
      let prev = getCurrent().prev
      let dur = prev.duration.copy()
      while (prev.prev && prev.prev.position === prev.position) {
        prev = prev.prev
        dur = dur.plus(prev.duration.copy())
      }
      durationInMeasure = dur
    }
    let pos = getCurrent().position
    let comparisonNote
    if (direction === "upper") {
      comparisonNote = getCurrent().notes[getCurrent().notes.length - 1]
    } else comparisonNote = getCurrent().notes[0]
    let oct = comparisonNote.octave
    let { letter, accidental } = pianoRollKeysToNotes[pianoRollKey]
    let n = new Note(`${letter}${accidental}${oct}`)
    if (
      n.midiNoteNumber <= comparisonNote.midiNoteNumber &&
      direction === "upper"
    ) {
      n.octave += 1
      setOctave(n.octave)
    } else if (
      n.midiNoteNumber >= comparisonNote.midiNoteNumber &&
      direction === "lower"
    ) {
      n.octave -= 1
      setOctave(n.octave)
    }
    let v
    if (durationInMeasure) {
      v = new Voice([
        new Rest(durationInMeasure),
        new Verticality([n]).asCurrent(),
      ]).at(pos)
    } else {
      v = new Voice([new Verticality([n]).asCurrent()]).at(pos)
    }
    console.log(music.staves[0])
    music.staves[0].add(v)
    triggerRender()
  }

  const createVoicingOnCurrent = voicingStr => {
    if (!getCurrent()) return
    if (
      !(getCurrent() instanceof Verticality) ||
      getCurrent().notes.length !== 1
    )
      return
    let notes = [0, ...voicingStr.split("").map(s => parseInt(s, 10))].map(
      num => new Note(num + getCurrent().notes[0].midiNoteNumber)
    )
    console.log(notes)
    getCurrent().notes = notes
    preserveCurrent()
    triggerRender()

    console.log(voicingStr)
  }

  const invertCurrentDown = () => {
    if (
      !getCurrent() ||
      !(getCurrent() instanceof Verticality) ||
      !getCurrent().isChord()
    )
      return

    getCurrent().canonical.invertDown()
    preserveCurrent()
    triggerRender()
  }

  const augmentCurrent = () => {
    if (!getCurrent() || getCurrent().canonical.duration >= 4) return
    getCurrent().canonical.duration.augment(2)
    preserveCurrent()
    triggerRender()
  }

  const diminuteCurrent = () => {
    if (!getCurrent() || getCurrent().canonical.duration < 1 / 8) return
    getCurrent().canonical.duration.diminute(2)
    preserveCurrent()
    triggerRender()
  }

  const enharmonicCurrent = () => {
    if (!getCurrent()) return
    if (getCurrent().notes && getCurrent().notes.length === 1) {
      getCurrent().notes[0].toEnharmonic()
    } else if (getCurrent().notes) {
      getCurrent().notes.forEach(note => {
        if (["b", "#"].includes(note.accidental)) {
          console.log(note.accidental)
          note.toEnharmonic()
          console.log("enharmonic: ", note.accidental)
        }
      })
    }
    preserveCurrent()
    triggerRender()
  }

  const backspace = () => {
    if (!getCurrent()) return
    try {
      if (getCurrent().owner.temporals.length === 1) {
        deleteElementById(id, context)
        return
      }
      if (!getCurrent().canonical.prev) {
        setPreCurrent(true)
        SETCURRENT(null)
      }
      getCurrent().deleteFromOwningVoice(true)
    } catch (err) {
      if (err.name === "NotInVoiceError") {
        getCurrent().owner.temporals[
          getCurrent().owner.temporals.length - 1
        ].makeCurrent = true
      } else {
        throw err
      }
    }
    triggerRender()
  }

  const addDot = () => {
    if (!getCurrent()) return
    // if current note doesn't tie *toward* the barline
    let current = getCurrent()
    let canonical = getCurrent().canonical
    if (canonical !== current && !current.tie) {
      if (current.duration.vexflowRepresentation.match(/d/)) {
        let durToSubtract = current.duration.times(new Duration(1, 3))
        canonical.duration = canonical.duration.minus(durToSubtract)
      } else {
        let durToAdd = current.duration.times(new Duration(1, 2))
        canonical.duration = canonical.duration.plus(durToAdd)
      }
      canonical.makeLatterCurrent = true
    } else {
      if (canonical.duration.vexflowRepresentation.match(/d/)) {
        canonical.duration.undot()
      } else {
        canonical.duration.dot()
      }
      canonical.makeCurrent = true
    }
    triggerRender()
  }

  const submitCommandFieldCommand = useCallback(() => {
    if (showCommandField) {
      for (let key of Object.keys(commandFieldCommands)) {
        let command = commandFieldCommands[key]
        if (command.keys.every((regex, idx) => commandKeys[idx].match(regex))) {
          let arg = commandKeys.join("").substr(command.keys.length)
          command.fn(arg)
          setCommandKeys([])
          setShowCommandField(false)
          setLastCommand({
            name: key,
            arg,
          })
        }
      }
    }
  }, [commandFieldCommands, commandKeys, showCommandField])

  const commands = {
    "Toggle Command Field": {
      key: /\s/,
      fn: () => toggleCommandField(),
    },
    "log music": {
      key: /`/,
      fn: () => console.log(music),
    },
    "enter command field command": {
      key: /Enter/,
      fn: () => submitCommandFieldCommand(),
      commandField: true,
    },
    "do last command": {
      key: /m/,
      fn: () => doLastCommand(),
    },
    "log current": {
      key: /^,$/,
      fn: () => {
        if (!getCurrent()) {
          console.log("current id invalid! (", CURRENT, ")")
          return
        }
        console.log(CURRENT)
        console.log(DOMIdsToVexflows[id][CURRENT])
        console.log("current duration: ", getCurrent().duration.toString())
        console.log("owner:", getCurrent().canonical.owner)
        console.log(
          "owner durations:",
          getCurrent().owner.temporals.map(temp => temp.duration.toString())
        )
        console.log(
          "DOMelem: ",
          document.getElementById(`vf-${getCurrent().DOMId}`)
        )
        if (getCurrent().next)
          console.log(
            "next DOM elem: ",
            document.getElementById(`vf-${getCurrent().next.DOMId}`)
          )
        if (getCurrent().prev)
          console.log(
            "prev DOM elem: ",
            document.getElementById(`vf-${getCurrent().prev.DOMId}`)
          )
        console.log("position: ", getCurrent().position)
        console.log(
          "positions: ",
          getCurrent().owner.temporals.map(temp => temp.position.toString())
        )
        console.log(
          "make current flags: ",
          getCurrent().owner.temporals.map(temp => temp.makeCurrent.toString())
        )
      },
    },
    "move current right": {
      key: /^(L|ArrowRight|o)$/,
      fn: () => {
        moveCurrentRight()
      },
    },
    "move current left": {
      key: /^(H|ArrowLeft|i)$/,
      fn: () => {
        moveCurrentLeft()
      },
    },
    "go to end of measure": {
      key: /^E$/,
      fn: () => moveCurrentToEndOfMeasure(),
    },
    "go to beginning of measure": {
      key: /^B$/,
      fn: () => moveCurrentToBeginningOfMeasure(),
    },
    "go to end of voice": {
      key: /^A$/,
      fn: () => moveCurrentToEndOfVoice(),
    },
    "go to beginning of voice": {
      key: /^0$/,
      fn: () => moveCurrentToBeginningOfVoice(),
    },
    "augment current": {
      key: /^(=|\+|ArrowUp)$/,
      fn: () => augmentCurrent(),
    },
    "diminute current": {
      key: /^(-|ArrowDown)$/,
      fn: () => diminuteCurrent(),
    },
    "set duration": {
      key: durationRegex,
      fn: e => {
        if (e.metaKey) setEditorDuration(e.key)
        else setCurrentToDur(...durationKeysToDurations[e.key])
      },
    },
    "piano roll": {
      key: pianoRollRegex,
      fn: e => pianoRoll(e),
      commandField: false,
    },
    "add rest": {
      key: /^r$/,
      fn: () => addRest(),
      commandField: false,
    },
    "add dot": {
      key: /^\.$/,
      fn: () => addDot(),
      commandField: false,
    },
    "hide command field": {
      key: /Escape/,
      fn: () => setShowCommandField(false),
      commandField: true,
    },
    "command field backspace": {
      key: /Backspace/,
      fn: () => commandFieldBackspace(),
      commandField: true,
    },
    backspace: {
      key: /Backspace/,
      fn: e => {
        if (!e.metaKey) backspace()
      },
      commandField: false,
    },
    "replace with rest": {
      key: /Backspace/,
      fn: e => {
        if (e.metaKey) replaceCurrentWithRest()
      },
      commandField: false,
    },
    "toggle enharmonic": {
      key: /^q$/,
      fn: () => enharmonicCurrent(),
    },
    "add key to command field": {
      key: /^[\da-z]$/,
      fn: ({ key }) => addKeyToCommandField(key),
      commandField: true,
    },
    "octave up": {
      key: /^x$/,
      fn: () => setOctave(o => (o < 8 ? o + 1 : o)),
    },
    "octave down": {
      key: /^z$/,
      fn: () => setOctave(o => (o > 0 ? o - 1 : o)),
    },
    "duplicate current": {
      key: /\//,
      fn: () => duplicateCurrent(),
    },
  }

  useEffect(() => {
    context.setNoteMode(true)
    setNoNotes(true)
  }, [])

  const repeatAllInCurrentVoice = () => {
    if (!getCurrent()) return
    getCurrent().owner.duplicate()
    preserveCurrent()
    triggerRender()
  }

  const commandFieldCommands = {
    write: {
      keys: [/w/],
      fn: () => pushStateToCanvas(),
    },
    load: {
      keys: [/l/],
      fn: () => loadFromCanvasState(),
    },
    ["repeat all in voice"]: {
      keys: [/r/, /a/],
      fn: () => repeatAllInCurrentVoice(),
    },
    ["invert up"]: {
      keys: [/i/, /u/],
      fn: () => invertCurrentUp(),
    },
    ["invert down"]: {
      keys: [/i/, /d/],
      fn: () => invertCurrentDown(),
    },
    ["octave up"]: {
      keys: [/o/, /u/],
      fn: () => adjustCurrentsOctave(1),
    },
    ["octave down"]: {
      keys: [/o/, /d/],
      fn: () => adjustCurrentsOctave(-1),
    },
    ["add note to upper voice"]: {
      keys: [/u/, pianoRollRegex],
      fn: pianoRollKey => createVoice("upper", pianoRollKey),
    },
    ["add note to lower voice"]: {
      keys: [/d/, pianoRollRegex],
      fn: pianoRollKey => createVoice("lower", pianoRollKey),
    },
    ["add voicing to note"]: {
      keys: [/v/],
      fn: voicing => createVoicingOnCurrent(voicing),
      needsSubmit: true,
    },
  }

  const onKeyDown = useCallback(
    e => {
      if (id !== context.lastInteractedElemId) return
      if (!context.noteMode) return
      log("onKeyDown")
      c(e.key)

      const capture = () => {
        e.captured = true
        e.captureId = id
      }

      for (let key of Object.keys(commands)) {
        let command = commands[key]
        if (e.key.match(command.key)) {
          if (command.commandField === undefined) command.commandField = false
          if (command.commandField === showCommandField) {
            command.fn(e)
            c("COMMAND: ", key)
            if (!command.noCapture) capture()
          }
        }
      }
      keysDown[e.key] = true
      lastKeyEventType = "down"
      unlog()
    },
    // CHANGE THIS
    [commands, setCurrentToDur, moveCurrentRight, moveCurrentLeft, backspace]
  )

  const onKeyUp = useCallback(
    e => {
      log("onKeyUp")
      delete keysDown[e.key]
      if (showCommandField) {
        for (let key of Object.keys(commandFieldCommands)) {
          let command = commandFieldCommands[key]
          if (
            !command.needsSubmit &&
            commandKeys.every((x, idx) => x.match(command.keys[idx])) &&
            commandKeys.length === command.keys.length
          ) {
            command.fn(last(commandKeys))
            c("COMMAND FIELD COMMAND: ", key)
            setCommandKeys([])
            setShowCommandField(false)
            setLastCommand({ name: key, arg: last(commandKeys) })
          }
        }
      }
      lastKeyEventType = "up"
      if (e.key === firstPianoRollKey) firstPianoRollKey = null
      unlog()
    },
    [commandFieldCommands]
  )

  const removeSVGs = () => {
    const me = document.getElementById(`vex-${id}`)
    if (me === null) return
    const svgList = me.getElementsByTagName("svg")
    for (let svg of svgList) {
      svg.remove()
    }
  }

  const onTemporalClick = tickable => e => {
    let temporal = DOMIdsToVexflows[id][tickable.attrs.id]
    if (!temporal) return
    console.log(temporal.owner.temporals.map(temp => temp.duration.toString()))
    console.log(e)
    if (e.shiftKey) {
      if (temporal.canonical.duration < 4)
        temporal.canonical.duration.augment(2)
      triggerRender()
    } else if (e.metaKey) {
      if (temporal.canonical.duration > 1 / 16)
        temporal.canonical.duration.diminute(2)
      triggerRender()
    }
    DOMIdsToVexflows[id][tickable.attrs.id].selected = true
    SETCURRENT(tickable.attrs.id)
  }

  const injectEventListeners = tickable => {
    tickable.attrs.el.addEventListener(
      "click",
      onTemporalClick(tickable),
      false
    )
  }

  const renderVexflow = () => {
    /** vexflow's taxonomy is poorly named btw.
     * a stave, for vexflow, is essentially a measure.
     * a staveNote may be a rest, a single note, or a chord.
     * staveNotes map to our Verticalities.
     */
    log("renderVexflow")
    try {
      console.log("RENDER")
      const VF = require("vexflow").Flow
      const div = document.getElementById(`vex-${id}`)
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG)
      renderer.resize(2000, 170)
      const ctx = renderer.getContext()
      let measureWidth = 300
      // when there are more notes than this in a measure,
      // the measures will increase width.
      let measureWidthToFitNStaveNotes = 12
      let measureWidenAmount = 0
      // local current
      let currentSetThisRender
      // id of 'filler' rest at end of stave.
      // we make it grey at the end.
      let fillerId

      // vexflow ids get regenerated on every render.
      DOMIdsToVexflows[id] = {}
      // convert our music representation to vexflow's
      const measures = music.staves[0].measures
      console.log(measures)
      let ties = []

      if (measures.length === 0) {
        // empty. render an empty stave
        let stave = new VF.Stave(10, 0, measureWidth, {
          left_bar: false,
          right_bar: false,
        })
          .setContext(ctx)
          //.setMeasure(1)
          .draw()
      }
      // render those bbs
      else
        for (let i = 0; i < measures.length; i++) {
          // accidentals that have already occurred
          // (add natural signs when necessary!)
          let measureAccidentals = []
          let measure = measures[i]
          let voices = measure.voices
          let firstHigher =
            voices.length === 1
              ? true
              : music.staves[0].above(voices[0].voice, voices[1].voice)
          voices = voices.map(({ voice, owner }, voiceIdx) =>
            new VF.Voice(measure.timeSignature.vexflowRepresentation)
              .setStrict(false)
              .addTickables(
                voice.temporals.map((temp, tempIdx) => {
                  let staveNote = new VF.StaveNote({
                    clef: "treble",
                    auto_stem: voices.length === 1,
                    ...temp.vexflowRepresentation,
                  }).setStemDirection(
                    (() => {
                      if (voices.length === 1) return 0
                      if (firstHigher) {
                        if (voiceIdx === 0) return 1
                        else return -1
                      } else {
                        if (voiceIdx === 0) return -1
                        else return 1
                      }
                    })()
                  )
                  if (temp instanceof Verticality) {
                    // ties
                    if (temp.tie)
                      ties.push({
                        startVert: temp,
                        startStaveNote: staveNote,
                      })
                    if (temp.endTie) {
                      for (let tie of ties) {
                        if (!tie.startStaveNote) continue
                        if (tie.startVert.canonical === temp.canonical) {
                          tie.endVert = temp
                          tie.endStaveNote = staveNote
                        }
                      }
                    }

                    // accidentals
                    let accidentals = []
                    for (let note of temp.notes) {
                      if (note.accidental !== "") {
                        if (!measureAccidentals.includes(note.toString())) {
                          accidentals.push(new VF.Accidental(note.accidental))
                          measureAccidentals.push(note.toString())
                        }
                      } else {
                        if (
                          measureAccidentals
                            .map(x => x.substr(0, 1) + x.charAt(x.length - 1))
                            .includes(note.letter + note.octave)
                        ) {
                          accidentals.push(new VF.Accidental("n"))
                          measureAccidentals = measureAccidentals.filter(
                            x => !(x.substr(0, 1) === note.letter)
                          )
                        } else accidentals.push(null)
                      }
                    }
                    for (let i = 0; i < accidentals.length; i++) {
                      if (accidentals[i])
                        staveNote.addAccidental(i, accidentals[i])
                    }
                  }
                  // dots
                  if (temp.duration.vexflowRepresentation.match(/d/))
                    staveNote.addDotToAll()

                  // make DOM element and verticalities point to one another.
                  temp.DOMId = staveNote.attrs.id
                  if (temp.makeCurrent === true) {
                    console.log("setting current to ", staveNote.attrs.id)
                    SETCURRENT(staveNote.attrs.id)
                    currentSetThisRender = true
                    temp.makeCurrent = false
                  }
                  temp.owner = owner
                  DOMIdsToVexflows[id][staveNote.attrs.id] = temp
                  if (temp.filler) fillerId = staveNote.attrs.id
                  if (tempIdx + 1 > measureWidthToFitNStaveNotes) {
                    measureWidth += measureWidenAmount
                    measureWidthToFitNStaveNotes += 1
                  }
                  return staveNote
                })
              )
          )
          console.log(voices)
          let stave = new VF.Stave(10 + i * measureWidth, 0, measureWidth, {
            left_bar: i > 0,
            right_bar: i < measures.length - 1,
          }).setContext(ctx)
          //.setMeasure(i + 1)
          /*
          if (i === 0)
            stave
              .addClef("treble")
              .addTimeSignature(measure.timeSignature.vexflowRepresentation)
          */

          stave.draw()
          let formatter = new VF.Formatter()
          let beams = voices.map(voice =>
            VF.Beam.generateBeams(voice.getTickables(), {
              maintain_stem_directions: true,
              beam_rests: true,
              beam_middle_only: true,
            })
          )
          formatter.joinVoices(voices).formatToStave(voices, stave)
          voices.forEach(voice => {
            voice
              .setStave(stave)
              .setContext(ctx)
              .draw()

            voice
              .getTickables()
              .forEach(tickable => injectEventListeners(tickable))
          })
          beams.forEach(beams =>
            beams.forEach(beam => beam.setContext(ctx).draw())
          )
          for (let tie of ties) {
            if (tie.startStaveNote && tie.endStaveNote) {
              const fillIndices = n => {
                let ret = []
                while (n >= 0) {
                  ret.push(n)
                  n -= 1
                }
                return ret
              }

              let tieObj = {
                first_note: tie.startStaveNote,
                last_note: tie.endStaveNote,
                first_indices: fillIndices(tie.startVert.notes.length - 1),
                last_indices: fillIndices(tie.endVert.notes.length - 1),
              }
              let vexTie = new VF.StaveTie(tieObj)
              vexTie.setContext(ctx).draw()
              tie = null
            }
          }
          if (fillerId) {
            let grayOut = document.getElementById(`vf-${fillerId}`)
            grayOut.setAttribute("stroke", "grey")
            grayOut.setAttribute("fill", "grey")
          }
        }
      // flush current to reset current visual
      if (!currentSetThisRender) SETCURRENT(null)
    } catch (err) {
      console.log("error during rendering: ", err)
    }
  }

  useEffect(() => {
    removeSVGs()
    renderVexflow()
  }, [vexflowRenderTicker])

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("keyup", onKeyUp, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("keyup", onKeyUp, true)
    }
  }, [onKeyDown, onKeyUp])

  return (
    <>
      {id === context.lastInteractedElemEd && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      {id === context.lastInteractedElemId && context.noteMode ? (
        <div
          className="noselect"
          style={{ top: 20, right: 70, position: "fixed", color: "grey" }}
        >
          insert note mode. octave {octave}. dur:{" "}
          {durationKeysToDurations[editorDuration].join("/")}
        </div>
      ) : null}

      {showCommandField ? (
        <TextField
          className="noselect"
          style={{
            maxWidth: 100,
            position: "fixed",
            bottom: 20,
            left: window.innerWidth / 2 - 50,
            backgroundColor: "white",
            zIndex: 500,
          }}
          value={
            empty(commandKeys)
              ? ""
              : commandKeys.reduce((acc, cur) => acc + "-" + cur)
          }
        />
      ) : null}

      {(getCurrent() || noNotes || preCurrent) &&
      context.noteMode &&
      id === context.lastInteractedElemId
        ? (() => {
            let top, height, left
            if (getCurrent()) {
              top = getCurrentOnDOM().getBoundingClientRect().y - 12
              height = getCurrentOnDOM().getBoundingClientRect().height + 24
              left =
                getCurrentOnDOM().getBoundingClientRect().width +
                getCurrentOnDOM().getBoundingClientRect().x +
                5
            } else if (
              noNotes ||
              (preCurrent &&
                (!currentVoice || !currentVoice.temporals[0].DOMId))
            ) {
              top = viewportY - 55 - (selected ? 1 : 0)
              height = 30
              left = viewportX - 185 - (selected ? 1 : 0)
            } else if (preCurrent) {
              let bbox = document
                .getElementById(`vf-${currentVoice.temporals[0].DOMId}`)
                .getBoundingClientRect()
              height = bbox.height
              top = bbox.y
              left = viewportX - 185 - (selected ? 1 : 0)
            }
            return (
              <div
                id="indicator"
                style={{
                  position: "fixed",
                  top,
                  height,
                  left,
                  width: 0,
                  border: "1px solid maroon",
                }}
              />
            )
          })()
        : null}

      <div
        className="noselect"
        style={{
          position: "fixed",
          bottom: 20,
          right: 100,
          fontSize: 10,
        }}
      >
        {`preCurrent: ${preCurrent}`}
        <br />
        {`current: ${CURRENT}`}
        <br />
        {getCurrent() ? (
          <>
            {`is canonical: ${getCurrent().canonical === getCurrent()}`}
            <br />
            {`next: ${getCurrent().next}`}
            <br />
            {`prev: ${getCurrent().prev}`}
            <br />
            {`owner: ${getCurrent().owner}`}
            <br />
          </>
        ) : null}
      </div>
      <div
        style={{
          position: "fixed",
          top: viewportY - 100 - (selected ? 1 : 0),
          left: viewportX - 200 - (selected ? 1 : 0),
          transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
          border: `${selected ? `1px solid white` : ``}`,
        }}
        onClick={e => {
          if (!context.zoomMode) {
            e.stopPropagation()
            //if (selected && !context.inspecting)
            //setElementPropertyById(id, context, "selected", false)
            if (selected && context.inspecting)
              context.setLastInteractedElemId(id)
            if (!selected) {
              if (e.shiftKey)
                setElementPropertyById(id, context, "selected", true)
              else selectElementAndDeselectRest(id, context)
              context.setLastInteractedElemId(id)
            }
          }
        }}
        id={`infiniteVex-${id}`}
      >
        {selected ? (
          <>
            <span
              style={{
                position: "absolute",
                right: 1,
                top: -7,
                fontFamily: "sans-serif",
                cursor: "pointer",
              }}
              onClick={e => {
                deleteElementById(id, context)
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              x
            </span>
          </>
        ) : null}
        <div id={`vex-${id}`} />
        {options.playback ? (
          <VexPlaybackButton
            disabled={context.synth ? false : true}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            play
          </VexPlaybackButton>
        ) : null}
      </div>
    </>
  )
}

export default InfiniteVexflow
