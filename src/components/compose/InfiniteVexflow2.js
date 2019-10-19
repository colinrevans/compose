import React, { useState, useEffect, useCallback } from "react"
import { VexPlaybackButton } from "../vexflow-components"
import Inspector from "./inspector"
import TextField from "@material-ui/core/TextField"
import empty from "is-empty"
import System from "../../lib/music/system"
import Clef from "../../lib/music/clef"
import Duration from "../../lib/music/duration"
import Verticality from "../../lib/music/verticality"
import Staff from "../../lib/music/staff"
import Voice from "../../lib/music/voice"
import {
  pianoRollRegex,
  pianoRollKeysToNotes,
  durationRegex,
  durationKeysToDurations,
} from "./InfiniteVexflow2/tables"
import { convertSavedMusicFromJSON } from "./InfiniteVexflow2/util"
import Note from "../../lib/music/note.js"
import Rest from "../../lib/music/rest"
import TimeSignature from "../../lib/music/time-signature"
import { shouldHide, Crosshair, HoverButtons } from "./common"
import { dragging, wheeling } from "../../pages/compose"
import {
  setElementPropertyById,
  deleteElementById,
  selectElementAndDeselectRest,
  viewport,
} from "../../lib/infinite-util"

const debug = true

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

// a map of vexflow-generated DOMIds to references to their respective music elements
// this is not in the component because we can't let it get out of sync, eg. by using async setState
let DOMIdsToVexflows = {}

// need this to rerender vexflow once a wheel event has stopped
let wheelingLastTime = {}

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

// only convert saved json once. see music's setState
let converted = {}
const convert = (id, json) => {
  let c = convertSavedMusicFromJSON(json)
  converted[id] = c
  return c
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
  const { viewportX, viewportY } = viewport(x, y, context)

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
      ? converted[id] || convert(id, save.music)
      : new System([
          new Staff([new TimeSignature(4, 4).at(0), new Clef("treble").at(0)]),
        ])
  )
  const [showCommandField, setShowCommandField] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [commandKeys, setCommandKeys] = useState([])
  const [vexflowRenderTicker, setVexflowRenderTicker] = useState(false)
  const triggerRender = () => setVexflowRenderTicker(t => !t)
  const [CURRENT, SETCURRENT] = useState(null)
  const [selection, setSelection] = useState([])
  const [currentVoice, setCurrentVoice] = useState(
    save.music ? music.staves[0].voices[0] : null
  )
  const [preCurrent, setPreCurrent] = useState(true)
  const [octave, setOctave] = useState(4)
  const [noNotes, setNoNotes] = useState(!save.music)
  // NB this is an index into durationKeysToDurations;
  const [editorDuration, setEditorDuration] = useState("4")
  const [MIDIInputs, setMIDIInputs] = useState(null)

  const getCurrent = useCallback(() => {
    if (DOMIdsToVexflows[id]) return DOMIdsToVexflows[id][CURRENT]
    else return null
  }, [id, CURRENT])
  const preserveCurrent = useCallback(() => {
    if (!getCurrent()) return
    if (getCurrent() === getCurrent().canonical)
      getCurrent().canonical.makeCurrent = true
    else {
      if (getCurrent().tie) getCurrent().cononical.makeFormerCurrent = true
      else getCurrent().canonical.makeLatterCurrent = true
    }
  }, [getCurrent])
  const getCurrentOnDOM = useCallback(
    () => document.getElementById(`vf-${CURRENT}`),
    [CURRENT]
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
  }, [id, context, music, options])

  const loadFromCanvasState = useCallback(() => {
    // TODO load music from JSON string
    setMusic(music =>
      save.music ? convertSavedMusicFromJSON(save.music) : music
    )
    if (save.music) triggerRender()
    setOptions(opts => (save.options ? save.options : opts))
  }, [save.music, save.options])

  const toggleCommandField = useCallback(() => {
    setCommandKeys([])
    setShowCommandField(f => !f)
  }, [])

  const commandFieldBackspace = useCallback(() => {
    if (commandKeys.length <= 1) toggleCommandField()
    else setCommandKeys(keys => keys.slice(0, keys.length - 1))
  }, [commandKeys.length, toggleCommandField])

  const addKeyToCommandField = useCallback(
    x => setCommandKeys(keys => [...keys, x]),
    []
  )

  const doLastCommand = useCallback(
    () => commandFieldCommands[lastCommand.name].fn(lastCommand.arg),
    [commandFieldCommands, lastCommand]
  )

  const setCurrentToDur = useCallback(
    (num, denom) => {
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
            //getCurrent().next.canonical.makeCurrent = true
            preserveCurrent()
          } else {
            console.log("no next")
            preserveCurrent()
          }
        }
        triggerRender()
      }
    },
    [getCurrent, preserveCurrent]
  )

  const expandSelectionRight = useCallback(() => {
    if (preCurrent) {
      moveCurrentRight()
      return
    }
    if (!getCurrent()) return
    if (!getCurrent().next) return
    setSelection(sel => [...sel, getCurrent().next.DOMId])
    SETCURRENT(getCurrent().next.DOMId)
  }, [preCurrent, moveCurrentRight, getCurrent])

  const moveCurrentRight = useCallback(() => {
    if (preCurrent) {
      // move current to first note of first voice
      SETCURRENT(currentVoice.temporals[0].DOMId)
      setPreCurrent(false)
    }
    if (!getCurrent()) return
    if (!getCurrent().next) return
    setSelection([])
    SETCURRENT(getCurrent().next.DOMId)
  }, [currentVoice, preCurrent, getCurrent])

  const moveCurrentLeft = useCallback(() => {
    if (!getCurrent()) return
    if (!getCurrent().prev) {
      setPreCurrent(true)
      setCurrentVoice(getCurrent().owner)
      SETCURRENT(null)
    } else {
      SETCURRENT(getCurrent().prev.DOMId)
    }
    setSelection([])
  }, [getCurrent])

  const pianoRoll = useCallback(
    (e, midiNoteNumber) => {
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
      console.log("curent: ", getCurrent())
      console.log("preCur: ", preCurrent)

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
    },
    [
      CURRENT,
      id,
      editorDuration,
      octave,
      getCurrent,
      music,
      currentVoice,
      preCurrent,
    ]
  )

  useEffect(() => {
    context.setLastInteractedElemId(id)
  }, [])

  const processMIDINoteOn = useCallback(
    (midiNoteNumber, velocity) => {
      midiNotesDown[midiNoteNumber] = true
      if (!firstMidiNote) {
        firstMidiNote = midiNoteNumber
      }
      if (id === context.lastInteractedElemId) pianoRoll({}, midiNoteNumber)
    },
    [id, context, pianoRoll]
  )

  const processMIDINoteOff = useCallback(midiNoteNumber => {
    if (midiNotesDown[midiNoteNumber]) {
      midiNotesDown[midiNoteNumber] = null
    }
    if (firstMidiNote === midiNoteNumber) firstMidiNote = null
  }, [])

  const processMIDI = useCallback(
    midiMessage => {
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
    },
    [
      adjustCurrentsOctave,
      enharmonicCurrent,
      processMIDINoteOn,
      processMIDINoteOff,
    ]
  )

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
  }, [MIDIInputs, processMIDI])

  const moveCurrentToBeginningOfMeasure = useCallback(() => {
    if (!getCurrent()) return
    let cur = getCurrent()
    if (cur.prev && cur.prev.position !== cur.position) {
      cur = cur.prev
    }
    while (cur.prev && cur.position === cur.prev.position) {
      cur = cur.prev
    }
    SETCURRENT(cur.DOMId)
  }, [getCurrent])

  const moveCurrentToEndOfMeasure = useCallback(() => {
    if (!getCurrent()) return

    let cur = getCurrent()
    if (cur.next && cur.next.position !== cur.position) {
      cur = cur.next
    }
    while (cur.next && cur.position === cur.next.position) {
      cur = cur.next
    }
    SETCURRENT(cur.DOMId)
  }, [getCurrent])

  const replaceCurrentWithRest = useCallback(() => {
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
  }, [getCurrent, preserveCurrent])

  const replaceCurrent = useCallback(
    key => {
      if (!getCurrent()) return
      console.log(key)
      console.log(pianoRollKeysToNotes[key])
      let { letter, accidental, octaveAdjust } = pianoRollKeysToNotes[key]
      let replacement = new Note(
        letter,
        accidental ? accidental : "",
        octave + (octaveAdjust ? octaveAdjust : 0)
      )
      console.log(replacement)
      let cur = getCurrent()
      if (cur instanceof Verticality) {
        if (cur.canonical === cur) {
          cur.notes = [replacement]
        }
      }
      preserveCurrent()
      triggerRender()
    },
    [getCurrent, preserveCurrent, octave]
  )

  const duplicateCurrent = useCallback(() => {
    if (!getCurrent()) return
    let cur = getCurrent()
    let copy = cur.copy()
    copy.makeCurrent = true
    cur.canonical.insertAfter(copy)
    triggerRender()
  }, [getCurrent])

  const transposeCurrent = useCallback(
    steps => {
      if (!getCurrent()) return
      getCurrent().transposeByHalfSteps(steps)
      preserveCurrent()
      triggerRender()
    },
    [getCurrent, preserveCurrent]
  )

  const moveCurrentToEndOfVoice = useCallback(() => {
    if (!getCurrent()) return
    let cur = getCurrent()
    while (cur.next) cur = cur.next
    SETCURRENT(cur.DOMId)
  }, [getCurrent])

  const moveCurrentToBeginningOfVoice = useCallback(() => {
    if (!getCurrent()) return
    let cur = getCurrent()
    while (cur.prev) cur = cur.prev
    SETCURRENT(cur.DOMId)
  }, [getCurrent])

  const addRest = useCallback(() => {
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
  }, [getCurrent, editorDuration, music.staves, preCurrent])

  const invertCurrentUp = useCallback(() => {
    if (
      !getCurrent() ||
      !(getCurrent() instanceof Verticality) ||
      !getCurrent().isChord()
    )
      return

    getCurrent().canonical.invertUp()
    preserveCurrent()
    triggerRender()
  }, [getCurrent, preserveCurrent])

  const adjustCurrentsOctave = useCallback(
    n => {
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
    },
    [getCurrent, preserveCurrent]
  )

  const createVoice = useCallback(
    (direction = "upper", pianoRollKey) => {
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
    },
    [getCurrent, music.staves]
  )

  const createVoicingOnCurrent = useCallback(
    voicingStr => {
      if (!getCurrent()) return
      if (!(getCurrent() instanceof Verticality)) return
      let notes = [
        ...voicingStr.split("").map(s => {
          if (s === "t") return 10
          if (s === "e") return 11
          return parseInt(s, 10)
        }),
      ].map(
        num =>
          new Note(
            num +
              getCurrent().notes[getCurrent().notes.length - 1].midiNoteNumber
          )
      )
      console.log(notes)
      getCurrent().notes = [...getCurrent().notes, ...notes]
      preserveCurrent()
      triggerRender()

      console.log(voicingStr)
    },
    [getCurrent, preserveCurrent]
  )

  const invertCurrentDown = useCallback(() => {
    if (
      !getCurrent() ||
      !(getCurrent() instanceof Verticality) ||
      !getCurrent().isChord()
    )
      return

    getCurrent().canonical.invertDown()
    preserveCurrent()
    triggerRender()
  }, [getCurrent, preserveCurrent])

  const augmentCurrent = useCallback(() => {
    if (!getCurrent() || getCurrent().canonical.duration >= 4) return
    getCurrent().canonical.duration.augment(2)
    preserveCurrent()
    triggerRender()
  }, [getCurrent, preserveCurrent])

  const diminuteCurrent = useCallback(() => {
    if (!getCurrent() || getCurrent().canonical.duration < 1 / 8) return
    getCurrent().canonical.duration.diminute(2)
    preserveCurrent()
    triggerRender()
  }, [getCurrent, preserveCurrent])

  const enharmonicCurrent = useCallback(() => {
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
  }, [getCurrent, preserveCurrent])

  const addForcedNatural = useCallback(() => {
    if (!getCurrent() || !(getCurrent() instanceof Verticality)) return
    if (getCurrent().notes.length > 1) return
    if (getCurrent().notes[0].accidental === "n")
      getCurrent().notes[0].accidental = ""
    else if (getCurrent().notes[0].accidental === "")
      getCurrent().notes[0].accidental = "n"
    preserveCurrent()
    triggerRender()
  }, [getCurrent, preserveCurrent])

  const switchCurrentVoice = useCallback(() => {
    if (!getCurrent() || music.staves[0].voices.length === 1) return
    let voices = music.staves[0].voices
    let me = 0
    for (let i = 0; i < voices.length; i++) {
      if (voices[i] === me) {
        me = i
      }
    }
    let idx = me + 1
    idx = idx % (voices.length - 1)
    let currentPos = getCurrent().pos
    let currentStartsAt = getCurrent().startsAt
    let switched = voices[idx]
    for (let i = 0; i < switched.temporals.length; i++) {}
  }, [getCurrent])

  const backspace = useCallback(() => {
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
  }, [id, context, getCurrent])

  const addClef = useCallback(
    type => {
      // adds a clef to the current measure.
      // TODO:  for now, only can add a clef to the beginning of a measure
      // replaces clef if there already is one.
      if (!noNotes && !getCurrent()) return
      if (noNotes) return

      let clefs = music.staves[0].clefs
      let clefMap = {}
      clefs.forEach(
        clef => (clefMap[clef.position] = { type: clef.type, owner: clef })
      )
      if (!clefMap[getCurrent().position])
        music.staves[0].add(new Clef(type).at(getCurrent().position))
      else clefMap[getCurrent().position].owner.type = type
      preserveCurrent()
      triggerRender()
    },
    [noNotes, getCurrent, music.staves, preserveCurrent]
  )

  const deleteClef = useCallback(() => {
    if (!getCurrent()) return
    let clefs = music.staves[0].clefs
    for (let clef of clefs) {
      console.log("clef", clef)
      if (clef.position === getCurrent().position) music.staves[0].remove(clef)
    }
    preserveCurrent()
    triggerRender()
  }, [music.staves, getCurrent, preserveCurrent])

  const addDot = useCallback(() => {
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
  }, [getCurrent])

  const submitCommandFieldCommand = useCallback(() => {
    if (showCommandField) {
      for (let key of Object.keys(commandFieldCommands)) {
        let command = commandFieldCommands[key]
        if (command.keys.every((regex, idx) => commandKeys[idx].match(regex))) {
          let arg = commandKeys.join("").substr(command.keys.length)
          if (arg.match(command.argRegex)) {
            command.fn(arg)
            setLastCommand({
              name: key,
              arg,
            })
          }
          setCommandKeys([])
          setShowCommandField(false)
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
      fn: e => {
        if (e.shiftKey) expandSelectionRight()
        else moveCurrentRight()
      },
    },
    "move current left": {
      key: /^(H|ArrowLeft|i)$/,
      fn: e => {
        if (e.shiftKey) expandSelectionLeft()
        else moveCurrentLeft()
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
    "transpose current up a step": {
      key: /^ArrowUp$/,
      fn: () => transposeCurrent(1),
    },
    "transpose current down a step": {
      key: /^ArrowDown$/,
      fn: () => transposeCurrent(-1),
    },
    "augment current": {
      key: /^(=|\+)$/,
      fn: () => augmentCurrent(),
    },
    "diminute current": {
      key: /^(-)$/,
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
      fn: e => {
        if (!e.metaKey) addRest()
      },
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
      keys: [/r/, /p/, /t/, /a/],
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
    ["natural"]: {
      keys: [/n/],
      fn: () => addForcedNatural(),
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
      argRegex: /^[123456789te]+$/,
      needsSubmit: true,
    },
    ["replace current verticality with rest"]: {
      keys: [/r/, /r/],
      fn: () => replaceCurrentWithRest(),
    },
    ["replace current verticality with note at key"]: {
      keys: [/r/, pianoRollRegex],
      fn: pianoRollKey => replaceCurrent(pianoRollKey),
    },
    ["change to treble clef"]: {
      keys: [/c/, /t/],
      fn: () => addClef("treble"),
    },
    ["change to bass clef"]: {
      keys: [/c/, /b/],
      fn: () => addClef("bass"),
    },
    ["delete clef"]: {
      keys: [/c/, /d/],
      fn: () => deleteClef(),
    },
    ["switch to other voice"]: {
      keys: [/s/, /v/],
      fn: () => switchCurrentVoice(),
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
    [id, context, showCommandField, commands]
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
    [commandKeys, showCommandField, commandFieldCommands]
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
    setPreCurrent(false)
  }

  const injectEventListeners = tickable => {
    tickable.attrs.el.addEventListener(
      "click",
      onTemporalClick(tickable),
      false
    )
    let c = 0
    for (let staveNote of tickable.attrs.el.children) {
      for (let note of staveNote.children) {
        if (note.getAttribute("class") === "vf-notehead") {
          let a = c
          note.addEventListener(
            "click",
            () => {
              //note.children[0].style.fill = "maroon"
              DOMIdsToVexflows[id][tickable.attrs.id].selected = true
              SETCURRENT(tickable.attrs.id)
              setPreCurrent(false)
            },
            true
          )
          c++
        }
      }
    }
  }

  const renderVexflow = () => {
    /** vexflow's taxonomy is poorly named btw.
     * a stave, for vexflow, is essentially a measure.
     * a staveNote may be a rest, a single note, or a chord.
     * our Verticalities biject to vexflow's staveNotes.
     */
    log("renderVexflow")
    try {
      console.log("RENDER")
      const VF = require("vexflow").Flow
      const div = document.getElementById(`vex-${id}`)
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG)
      renderer.resize(500, 170)
      const ctx = renderer.getContext()
      let measureWidth = 300
      // when there are more notes than this in a measure,
      // the measures will increase width.
      let measureWidthToFitNStaveNotes = 12
      let measureWidenAmount = 0
      // local current
      let currentSetThisRender
      // id of 'filler' rest at end of stave.
      let fillerId

      // vexflow ids get regenerated on every render.
      DOMIdsToVexflows[id] = {}
      // convert our music representation to vexflow's
      const measures = music.staves[0].measures
      console.log("measures", measures)
      let ties = []
      let timeSignatures = music.staves[0].timeSignatures
      console.log("time sigs", timeSignatures)
      let clefs = music.staves[0].clefs
      console.log("clefs", clefs)
      let clefMap = {}
      let staveNoteClefMap = {}
      clefs.forEach(clef => (clefMap[clef.position] = clef.type))
      let lastclef = null
      for (let i = 0; i < measures.length; i++) {
        if (!clefMap[i]) staveNoteClefMap[i] = lastclef
        else {
          staveNoteClefMap[i] = clefMap[i]
          lastclef = clefMap[i]
        }
      }
      console.log("clefmap", clefMap)
      console.log("stavenoteclefmap", staveNoteClefMap)
      if (measures.length === 0) {
        // empty. render an empty stave
        let stave = new VF.Stave(10, 40, measureWidth, {
          left_bar: false,
          right_bar: false,
        }).setContext(ctx)
        //.setMeasure(1)
        if (clefMap[0]) stave.addClef(clefMap[0])
        stave.draw()
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
                    clef: staveNoteClefMap[temp.position],
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
          let stave = new VF.Stave(10 + i * measureWidth, 40, measureWidth, {
            left_bar: i > 0,
            right_bar: i < measures.length - 1,
          }).setContext(ctx)
          //.setMeasure(i + 1)
          if (clefMap[i]) stave.addClef(clefMap[i])

          stave.draw()
          let formatter = new VF.Formatter()
          let beams = voices.map(voice =>
            VF.Beam.generateBeams(voice.getTickables(), {
              maintain_stem_directions: true,
              beam_rests: true,
              beam_middle_only: true,
            })
          )
          formatter
            .joinVoices(voices)
            .formatToStave(voices, stave, { align_rests: true })
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
      renderer.resize(300 * (measures.length ? measures.length : 0.1) + 20, 220)

      // flush current to reset current visual

      if (!currentSetThisRender) SETCURRENT(null)
    } catch (err) {
      console.log("error during rendering: ", err)
    }
  }

  useEffect(() => {
    // TODO this has no sense for width and height
    if (viewportX > window.innerWidth * 1.5) return
    if (viewportY > window.innerHeight * 1.5) return
    if (viewportX < (window.innerWidth / 2) * -1) return
    if (viewportY < (window.innerHeight / 2) * -1) return
    console.log("*********************************")
    console.log("RENDER: vexflow component within viewport")
    console.log("********************************")
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

  const scaled = n => n * context.zoom.scale * options.scale

  if (shouldHide(id, context)) return null
  return (
    <>
      {id === context.lastInteractedElemEd && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      {id === context.lastInteractedElemId && context.noteMode ? (
        <div
          className="noselect"
          style={{
            top: 20,
            right: 70,
            position: "fixed",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
            color: "grey",
            fontSize: 16,
          }}
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
      id === context.lastInteractedElemId &&
      !wheeling ? (
        <Cursor
          selection={selection.length > 0 ? selection : [CURRENT]}
          context={context}
          currentVoice={currentVoice}
          viewportY={viewportY}
          viewportX={viewportX}
          empty={noNotes}
          preCurrent={preCurrent}
        />
      ) : null}

      {/* OLD INDICATOR CODE
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
        */}

      {debug && context.lastInteractedElemId === id ? (
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
          {`nonotes: ${noNotes}`}
          <br />
          {`selection: ${selection}`}
          <br />
          {getCurrent() ? (
            <>
              {`is canonical: ${getCurrent().canonical === getCurrent()}`}
              <br />
              {`next: ${getCurrent().next} domID: ${
                getCurrent().next ? getCurrent().next.DOMId : ""
              }`}
              <br />
              {`prev: ${getCurrent().prev} domID: ${
                getCurrent().prev ? getCurrent().prev.DOMId : ""
              }`}
              <br />
              {`owner: ${getCurrent().owner}`}
              <br />
            </>
          ) : null}
        </div>
      ) : null}

      <HoverButtons
        id={id}
        context={context}
        scaled={scaled}
        hovering={isHovering}
        setHovering={setIsHovering}
        dragging={dragging}
        viewportX={viewportX}
        viewportY={viewportY}
        adjustY={55}
        options={options}
      />

      <div
        style={{
          position: "fixed",
          top: viewportY,
          left: viewportX,
          transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
          transformOrigin: "top left",
        }}
        onMouseEnter={e => setIsHovering(true)}
        onMouseLeave={e => setIsHovering(false)}
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

// cursor(s) to indicate current selection or position
const Cursor = ({
  selection,
  viewportX,
  viewportY,
  empty,
  preCurrent,
  currentVoice,
  context,
}) => {
  let positions = []
  let scale = context.zoom.scale
  if (empty || (preCurrent && !currentVoice)) {
    let top = viewportY
    let height = 30
    let left = viewportX
    positions = [{ top, height, left }]
  } else if (preCurrent) {
    if (!document.getElementById(`vf-${currentVoice.temporals[0].DOMId}`))
      return <></>
    let elem = document.getElementById(`vf-${currentVoice.temporals[0].DOMId}`)
    let bbox = elem.getBoundingClientRect()
    let height = bbox.height
    let top = bbox.y
    let left = viewportX
    positions = [{ top, height, left }]
  } else if (selection.length > 0) {
    positions = selection.map(sel => {
      if (!document.getElementById(`vf-${sel}`)) return <></>
      let elem = document.getElementById(`vf-${sel}`)
      let bbox = elem.getBoundingClientRect()
      let scale = context.zoom.scale
      let top = bbox.y - 12
      let height = bbox.height + 24
      let left = bbox.width + bbox.x + 5 * scale
      return { top, height, left }
    })
  }
  return (
    <>
      {positions.map(({ top, height, left }, idx) => (
        <div
          id={`indicator-${idx}`}
          key={idx}
          style={{
            position: "fixed",
            top,
            height,
            left,
            width: Math.ceil(2 * scale),
            color: "maroon",
            backgroundColor: "maroon",
          }}
        />
      ))}
    </>
  )
}

export default InfiniteVexflow
