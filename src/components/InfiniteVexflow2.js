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

let toLog = ["onKeyDown"]
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
// lastKeyEventType : "up" | "down" | null
// this is used for managing whether piano roll input
// adds to a chord or creates a new note.
let lastKeyEventType = null
let firstPianoRollKey = null

//note creation functions slice
//these in.
const pianoRollRegex = /^[awsedftgyhujkl;bvc]$/
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
  b: { letter: "b", octaveAdjust: -1 },
  v: { letter: "a", octaveAdjust: -1 },
  c: { letter: "g", octaveAdjust: -1 },
}

import {
  getViewportCoordinates,
  setElementPropertyById,
  deleteElementById,
  selectElementAndDeselectRest,
} from "../lib/infinite-util"

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
  const [music, setMusic] = useState(save.music ? save.music : {})
  const [showCommandField, setShowCommandField] = useState(false)
  const [commandKeys, setCommandKeys] = useState([])
  const [vexflowRenderTicker, setVexflowRenderTicker] = useState(false)
  const triggerRender = () => setVexflowRenderTicker(t => !t)
  const [CURRENT, SETCURRENT] = useState(null)
  const [octave, setOctave] = useState(4)
  const getCurrent = () => DOMIdsToVexflows[CURRENT]
  const getCurrentOnDOM = () => document.getElementById(`vf-${CURRENT}`)
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  const pushStateToCanvas = useCallback(() => {
    //TODO save music as JSON string
    context.saveElement(id, { music, options })
  }, [music, options])

  const loadFromCanvasState = useCallback(() => {
    // TODO load music from JSON string
    setMusic(notes => (save.notes ? save.notes : notes))
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
    getCurrent().canonical.makeCurrent = true
    triggerRender()
  }

  const moveCurrentRight = () => {
    if (!getCurrent()) return
    if (!getCurrent().next) return
    SETCURRENT(getCurrent().next.DOMId)
  }

  const moveCurrentLeft = () => {
    if (!getCurrent()) return
    if (!getCurrent().prev) return
    SETCURRENT(getCurrent().prev.DOMId)
  }

  const pianoRoll = e => {
    console.log("piano roll:", e.key)
    if (!getCurrent()) return
    let note = pianoRollKeysToNotes[e.key].letter
    let accidental = pianoRollKeysToNotes[e.key].accidental
    let adj =
      pianoRollKeysToNotes[e.key].octaveAdjust === undefined
        ? 0
        : pianoRollKeysToNotes[e.key].octaveAdjust
    if (!accidental) accidental = ""
    console.log(`${note}${accidental}${octave + adj}`)
    let noteStr = `${note}${accidental}${octave + adj}`
    if (!e.metaKey)
      DOMIdsToVexflows[CURRENT].insertAfter(new Verticality(noteStr))
    else getCurrent().addNote(new Note(noteStr))
    triggerRender()
  }

  const addRest = () => {
    if (!getCurrent()) return
    getCurrent().insertAfter(new Rest(new Duration(1)))
    triggerRender()
  }

  const backspace = () => {
    if (!getCurrent()) return
    getCurrent().deleteFromOwningVoice(true)
    triggerRender()
  }

  const commands = {
    "Toggle Command Field": {
      key: /\s/,
      fn: () => toggleCommandField(),
    },
    "log music": {
      key: /`/,
      fn: () => console.log(music),
    },
    "log current": {
      key: /^,$/,
      fn: () => {
        if (!getCurrent()) {
          console.log("current id invalid! (", CURRENT, ")")
          return
        }
        console.log(CURRENT)
        console.log(DOMIdsToVexflows[CURRENT])
        console.log("owner:", getCurrent().canonical.owner)
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
      },
    },
    "move current right": {
      key: /^(L|ArrowRight)$/,
      fn: () => {
        moveCurrentRight()
      },
    },
    "move current left": {
      key: /^(H|ArrowLeft)$/,
      fn: () => {
        moveCurrentLeft()
      },
    },
    "set duration to whole note": {
      key: /^1$/,
      fn: () => {
        setCurrentToDur(4, 1)
      },
    },
    "set duration to half note": {
      key: /^2$/,
      fn: () => {
        setCurrentToDur(2, 1)
      },
    },
    "set duration to quarter note": {
      key: /^3$/,
      fn: () => {
        setCurrentToDur(1, 1)
      },
    },
    "set duration to eighth note": {
      key: /^4$/,
      fn: () => {
        setCurrentToDur(1, 2)
      },
    },
    "set duration to sixteenth note": {
      key: /^5$/,
      fn: () => {
        setCurrentToDur(1, 4)
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
      fn: () => backspace(),
      commandField: false,
    },
    "add key to command field": {
      key: /^[\da-z]$/,
      fn: ({ key }) => addKeyToCommandField(key),
      commandField: true,
    },
    "do again": {
      key: /\./,
      fn: () => doLastCommand(),
    },
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
          if (
            command.commandField === undefined ||
            command.commandField === showCommandField
          ) {
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
    let temporal = DOMIdsToVexflows[tickable.attrs.id]
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
    DOMIdsToVexflows[tickable.attrs.id].selected = true
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
      renderer.resize(2000, 170 * testSystems.length)
      const ctx = renderer.getContext()
      // local current
      let current

      // vexflow ids get regenerated on every render.
      DOMIdsToVexflows = {}
      for (let j = 0; j < testSystems.length; j++) {
        let testSystem = testSystems[j]
        // convert our music representation to vexflow's
        const measures = testSystem.staves[0].measures

        let ties = []

        // render those bbs
        for (let i = 0; i < measures.length; i++) {
          let measure = measures[i]
          let voices = measure.voices
          let firstHigher =
            voices.length === 1
              ? true
              : testSystem.staves[0].above(voices[0].voice, voices[1].voice)
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
                  // ties
                  if (temp instanceof Verticality) {
                    if (temp.tie)
                      ties.push({ startVert: temp, startStaveNote: staveNote })
                    if (temp.endTie) {
                      for (let tie of ties) {
                        if (!tie.startStaveNote) continue
                        if (tie.startVert.canonical === temp.canonical) {
                          tie.endVert = temp
                          tie.endStaveNote = staveNote
                        }
                      }
                    }
                  }
                  // dots
                  if (temp.duration.vexflowRepresentation.match(/d/))
                    staveNote.addDotToAll()
                  // make DOM element and verticalities point to one another.
                  temp.DOMId = staveNote.attrs.id
                  if (temp.makeCurrent) {
                    SETCURRENT(staveNote.attrs.id)
                    current = staveNote.attrs.id
                    temp.makeCurrent = false
                  }
                  temp.owner = owner
                  DOMIdsToVexflows[staveNote.attrs.id] = temp
                  return staveNote
                })
              )
          )
          let stave = new VF.Stave(10 + i * 200, 0 + j * 170, 200, {
            left_bar: i > 0,
            right_bar: i < measures.length - 1,
          })
            .setContext(ctx)
            .setMeasure(i + 1)
          if (i === 0)
            stave
              .addClef("treble")
              .addTimeSignature(measure.timeSignature.vexflowRepresentation)

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
        }
      }
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
      {id === context.lastInteractedElemEd && context.inspacting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      {id === context.lastInteractedElemId && context.noteMode ? (
        <div
          className="noselect"
          style={{ top: 20, right: 20, position: "fixed", color: "grey" }}
        >
          insert note mode
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
              : commandKeys.reduce((acc, cur) => acc + " - " + cur)
          }
        />
      ) : null}

      {getCurrent() ? (
        <div
          id="indicator"
          style={{
            position: "fixed",
            top: getCurrentOnDOM().getBoundingClientRect().y - 4,
            height: getCurrentOnDOM().getBoundingClientRect().height + 8,
            left:
              getCurrentOnDOM().getBoundingClientRect().width +
              getCurrentOnDOM().getBoundingClientRect().x +
              5,
            width: 0,
            border: "1px solid grey",
          }}
        />
      ) : null}

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
