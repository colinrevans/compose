import React, { useState, useEffect } from "react"
import { VexPlaybackButton } from "./vexflow-components"
import Inspector from "./inspector"
import TextField from "@material-ui/core/TextField"
import empty from "is-empty"
import m from "../lib/music-2.js"

let toLog = ["renderVexflow"]
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

const last = arr => arr[arr.length - 1]
// apply fn to all 'leaves' of HTML element
const applyToChildren = (fn, elem) => {
  if (elem === undefined) return
  if (elem.children.length > 0) {
    for (let i = 0; i < elem.children.length; i++) {
      applyToChildren(fn, elem.children[i])
    }
  } else fn(elem)
}

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
const keysToNotes = {
  a: { key: "c" },
  w: { key: "c", accidental: "#" },
  s: { key: "d" },
  e: { key: "e", accidental: "b" },
  d: { key: "e" },
  f: { key: "f" },
  t: { key: "f", accidental: "#" },
  g: { key: "g" },
  y: { key: "a", accidental: "b" },
  h: { key: "a" },
  u: { key: "b", accidental: "b" },
  j: { key: "b" },
  k: { key: "c" },
  l: { key: "d" },
  [";"]: { key: "e" },
  b: { key: "b" },
  v: { key: "a" },
  c: { key: "g" },
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
  const [notes, setNotes] = useState(save.notes ? save.notes : [])
  const [showCommandField, setShowCommandField] = useState(false)
  const [commandKeys, setCommandKeys] = useState([])
  const [svgs, setSvgs] = useState([])
  const [svgXPositions, setSvgXPositions] = useState([])
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  const pushStateToCanvas = () => {
    context.saveElement(id, { notes, options })
  }

  const loadFromCanvasState = () => {
    setNotes(notes => (save.notes ? save.notes : notes))
    setOptions(opts => (save.options ? save.options : opts))
  }

  // KEYBOARD EVENT LISTENERS
  useEffect(() => {
    const octaveUp = offset => {
      offset = parseInt(offset, 10)
      noteMap(note => ({
        ...note,
        keys: note.keys.map(key => {
          return { ...key, octave: key.octave + offset }
        }),
      }))
    }

    const backspace = e => {
      if (e.shiftKey) return
      let i = notes.length - 1
      setNotes(n => n.slice(0, i))
    }

    // maps over the notes and leaves the rest alone.
    const noteMap = fn => {
      setNotes(notes =>
        notes.map(note => (typeof note === "string" ? note : fn(note)))
      )
    }

    // from an optimization perspective this is a yucky function.
    // are there ways to improve? does using it simplify code
    // but increase its order?
    const justNotes = (fn, ...args) => {
      setNotes(notes => {
        // filters out non-notes, applies the function, puts non-notes back in
        // ie lets you treat notes as just an array of note objects.
        // use noteMap if you don't need to slice at all.
        let objMap = {}
        let filtered = []
        for (let i = 0; i < notes.length; i++) {
          let note = notes[i]
          if (typeof note === "string") objMap[i] = note
          else filtered.push(note)
        }
        log("justNotes")
        c("notes", notes)
        c("objMap", objMap)
        c("length: ", Object.keys(objMap).length)
        c("filtered", filtered)
        c("filtered length", filtered.length)

        filtered = fn(filtered, ...args)

        c("after filter", filtered)
        c("after filter length", filtered.length)

        let res = []
        let idxOffset = 0
        c("objMapLength: ", Object.keys(objMap).length)
        c("total length: ", filtered.length + Object.keys(objMap).length)
        for (let i = 0; i < filtered.length + Object.keys(objMap).length; i++) {
          c()
          c(i, ":")
          c(Object.keys(objMap))
          if (Object.keys(objMap).includes(i.toString())) {
            c("pushing a nonnote: ", objMap[i.toString()])
            res.push(objMap[i.toString()])
            idxOffset += 1
          } else {
            if (filtered[i - idxOffset] === undefined) {
              c("pushing a note: undefined. skipping")
              continue
            }
            c("pushing a note: ", filtered[i - idxOffset])
            res.push(filtered[i - idxOffset])
          }
        }
        while (idxOffset < Object.keys(objMap).length) {
          res.push(objMap[Object.keys(objMap)[idxOffset]])
          idxOffset += 1
        }
        c("res", res)
        unlog()
        return res
      })
    }

    const octaveDown = offset => octaveUp(offset * -1)

    // makes a chord of all notes since the last chord (if n undefined)
    // or of n last notes
    const chordify = n => {
      let fn = (notes, n) => {
        let idxOfFirstNoteToChordify = 0
        if (n === undefined) {
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].keys.length > 1) idxOfFirstNoteToChordify = i + 1
          }
          if (idxOfFirstNoteToChordify >= notes.length)
            idxOfFirstNoteToChordify = notes.length - 2
        } else {
          idxOfFirstNoteToChordify = notes.length - n
        }
        let keys = []
        for (let note of notes.slice(idxOfFirstNoteToChordify)) {
          keys = [...keys, ...note.keys]
        }
        return [
          ...notes.slice(0, idxOfFirstNoteToChordify),
          m.clean({ keys, duration: notes[0].duration }),
        ]
      }
      justNotes(fn, n)
    }

    const duplicate = n => {
      let x = []
      for (let i = 0; i < n; i++) {
        x = [...x, last(notes)]
      }
      setNotes(n => [...n, ...x])
    }

    const repeat = n => {
      let r = notes.slice(notes.length - n, notes.length)
      setNotes(n => [...n, ...r])
    }

    const deleteN = n => {
      if (n > notes.length) n = notes.length
      setNotes(notes => notes.slice(0, notes.length - n))
    }

    const invert = up => {
      let lastNote = last(notes)
      let keyToInvert = up ? lastNote.keys[0] : last(lastNote.keys)
      const span = m.octaveSpan(lastNote)
      let newKey = {
        ...keyToInvert,
        octave: keyToInvert.octave + (up ? span : -1 * span),
      }
      let newKeys = up
        ? [...lastNote.keys.slice(1), newKey]
        : [...lastNote.keys.slice(0, lastNote.keys.length - 1), newKey]
      setNotes(notes => [
        ...notes.slice(0, notes.length - 1),
        m.sortVerticality({ ...lastNote, keys: newKeys }),
      ])
    }

    const addBarline = () => {
      setNotes(notes => [...notes, "BARLINE"])
    }

    const addLineBreak = () => {
      setNotes(notes => [...notes, "LINEBREAK"])
    }

    const plane = up => {
      let fn
      if (up) fn = m.planeUp
      else fn = m.planeDown
      setNotes(notes => {
        let l = fn(last(notes))
        return [...notes.slice(0, notes.length - 1), l]
      })
    }

    const deleteAccidentals = () => {
      setNotes(notes => {
        let l = m.removeAccidentals(last(notes))
        return [...notes.slice(0, notes.length - 1), l]
      })
    }

    const deleteByIdx = idx => {
      setNotes(notes => {
        let l = m.deleteNoteInVerticalityByIdx(last(notes), idx - 1)
        return [...notes.slice(0, notes.length - 1), l]
      })
    }

    const commandFieldCommands = {
      "octave up": {
        keys: [/o/, /u/],
        fn: x => octaveUp(1),
      },
      "octave down": {
        keys: [/o/, /d/],
        fn: x => octaveDown(1),
      },
      "plane up": {
        keys: [/m/, /u/],
        fn: () => plane(1),
      },
      "plane down": {
        keys: [/m/, /d/],
        fn: () => plane(0),
      },
      write: {
        keys: [/w/],
        fn: () => pushStateToCanvas(),
      },
      "delete note in verticality by idx": {
        keys: [/d/, /\d/],
        fn: x => deleteByIdx(x),
      },
      "delete accidentals": {
        keys: [/d/, /a/],
        fn: x => deleteAccidentals(),
      },
      "repeat last note and plane up": {
        keys: [/r/, /m/, /u/],
        fn: () => {
          repeat(1)
          plane(1)
        },
      },
      load: {
        keys: [/l/],
        fn: () => loadFromCanvasState(),
      },
      "repeat last note and plane down": {
        keys: [/r/, /m/, /d/],
        fn: () => {
          repeat(1)
          plane(0)
        },
      },
      "delete n last": {
        keys: [/x/, /\d/],
        fn: x => deleteN(x),
      },
      "invert up": {
        keys: [/i/, /u/],
        fn: () => invert(true),
      },
      "invert down": {
        keys: [/i/, /d/],
        fn: () => invert(false),
      },
      "chordify back": {
        keys: [/c/, /c/],
        fn: () => chordify(),
      },
      "chordify last n": {
        keys: [/c/, /\d/],
        fn: x => chordify(x),
      },
      "duplicate last verticality n times": {
        keys: [/\d/],
        fn: x => duplicate(x),
      },
      "repeat last n notes": {
        keys: [/r/, /\d/],
        fn: x => repeat(x),
      },
      "add barline": {
        keys: [/b/],
        fn: () => addBarline(),
      },
      "repeat last note:": {
        keys: [/r/, /r/],
        fn: () => repeat(1),
      },
      "repeat last note and invert up": {
        keys: [/r/, /i/, /u/],
        fn: () => {
          repeat(1)
          invert(true)
        },
      },
      "repeat last note and invert down": {
        keys: [/r/, /i/, /d/],
        fn: () => {
          repeat(1)
          invert(false)
        },
      },
      "repeat all": {
        keys: [/r/, /a/],
        fn: () => setNotes(notes => [...notes, ...notes]),
      },
    }

    const toggleCommandField = () => {
      setCommandKeys([])
      setShowCommandField(f => !f)
    }

    const commandFieldBackspace = () => {
      if (commandKeys.length <= 1) {
        toggleCommandField()
        return
      }
      setCommandKeys(keys => keys.slice(0, keys.length - 1))
    }

    const addKeyToCommandField = x => {
      setCommandKeys(keys => [...keys, x])
    }

    const pianoRoll = e => {
      if (keysDown[e.key]) {
        return
      }
      let octave = context.octave
      if (["k", "l", ";"].includes(e.key)) octave += 1
      if (["b", "v", "c"].includes(e.key)) octave -= 1
      if (e.metaKey)
        addNoteToLastVerticality({
          keys: [{ octave, accidental: "", ...keysToNotes[e.key] }],
          duration: "q",
        })
      else
        addNoteToEnd({
          keys: [{ octave, accidental: "", ...keysToNotes[e.key] }],
          duration: "q",
        })
      if (firstPianoRollKey === null) firstPianoRollKey = e.key
    }

    const doLastCommand = () => {
      commandFieldCommands[lastCommand.name].fn(lastCommand.arg)
    }

    const commands = {
      backspace: {
        key: /Backspace/,
        fn: e => backspace(e),
        commandField: false,
        noCapture: true,
      },
      "toggle command field": {
        key: /\s/,
        fn: () => toggleCommandField(),
      },
      "new bar": {
        key: /^n$/,
        fn: () => addBarline(),
      },
      "line break": {
        key: /Enter/,
        fn: () => addLineBreak(),
      },
      "log notes": {
        key: /`/,
        fn: () => console.log(notes),
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
      "add key to command field": {
        key: /^[\da-z]$/,
        fn: ({ key }) => addKeyToCommandField(key),
        commandField: true,
      },
      "piano roll": {
        key: new RegExp(`^[${Object.keys(keysToNotes).join("")}]$`),
        fn: e => pianoRoll(e),
        commandField: false,
      },
      "move up": {
        key: /ArrowUp/,
        fn: () => plane(1),
      },
      "move down": {
        key: /ArrowDown/,
        fn: () => plane(0),
      },
      "do again": {
        key: /\./,
        fn: () => doLastCommand(),
      },
    }

    const onKeyDown = e => {
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
    }

    const onKeyUp = e => {
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
    }

    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("keyup", onKeyUp, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("keyup", onKeyUp, true)
    }
  }, [
    context.lastInteractedElemId,
    id,
    context.octave,
    context.noteMode,
    showCommandField,
    commandKeys,
    notes,
    lastCommand,
  ])

  useEffect(() => {
    removeSVGs()
    renderVexflow()
  }, [notes])

  const addNoteToLastVerticality = note => {
    setNotes(notes =>
      notes.map((n, idx) =>
        idx === notes.length - 1
          ? m.clean({
              ...n,
              keys: [...n.keys, ...note.keys],
            })
          : n
      )
    )
  }

  const addNoteToEnd = note => {
    const sound = () => {
      return
      context.synth.triggerAttackRelease(
        note.keys.map(key => key.replace(/\//g, "").toUpperCase()),
        "4n"
      )
    }

    if (firstPianoRollKey === null || lastKeyEventType === null) {
      setNotes(notes => [...notes, note])
      sound()
    } else if (firstPianoRollKey) {
      addNoteToLastVerticality(note)
      sound()
    }
  }

  const addNotesAtIndex = (index, note) => {
    setNotes(notes => {
      return [...notes.slice(0, index), note, ...notes.slice(index + 1)]
    })
  }

  const renderVexflow = () => {
    // TODO : optimize. very expensive to do this every vexflow render.
    // instead keep a renderer in state? useEffect would then
    // only do a new VF.StaveNote(...) and vfNote.addAccidental(...)
    // if necessary
    log("renderVexflow")
    try {
      const VF = require("vexflow").Flow
      const div = document.getElementById(`vex-${id}`)
      var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG)
      renderer.resize(800, 200)
      var ctx = renderer.getContext()
      c("notes: ", notes)
      let measures = []

      // ie measures =  notes.split("BARLINE"), if notes were a string.
      let idx = 0
      for (let note of notes) {
        if (measures[idx] === undefined) measures.push([])
        if (note === "BARLINE") {
          idx += 1
        } else {
          measures[idx].push(note)
        }
      }
      if (notes[notes.length - 1] === "BARLINE") measures.push([])
      c("measures: ", measures)

      // make measures a list of vexflow musical objects
      measures = measures.map(measure => {
        if (measure.length > 0) {
          const staveNotes = measure.map(n => {
            let accidentalList = []
            for (let i = 0; i < n.keys.length; i++) {
              let key = n.keys[i]
              if (key.accidental)
                accidentalList.push({ idx: i, accidental: key.accidental })
            }
            let keysInVexflowFormat = n.keys.map(
              key => `${key.key}${key.accidental}/${key.octave}`
            )
            let vfNote = new VF.StaveNote({
              clef: "treble",
              ...n,
              keys: keysInVexflowFormat,
            })
            for (let { idx, accidental } of accidentalList) {
              vfNote = vfNote.addAccidental(idx, new VF.Accidental(accidental))
            }
            c("vfNote id: ", vfNote.attrs.id)
            return vfNote
          })
          return staveNotes
        } else {
          return []
        }
      })

      c("measures, as vexflow objects: ", measures)
      if (measures.length === 0) measures = [[]]
      renderer.resize(20 + 300 * measures.length, 200)
      for (let i = 0; i < measures.length; i++) {
        let measure = measures[i]
        let stave = new VF.Stave(10 + i * 300, 0, 300)
        if (i === 0) {
          stave.addClef("treble")
        }
        stave.setContext(ctx).draw()

        VF.Formatter.FormatAndDraw(ctx, stave, measure)
        for (let staveNote of measure) {
          console.log(staveNote.attrs.id)
          const elem = document.getElementById(`vf-${staveNote.attrs.id}`)
          elem.addEventListener(
            "click",
            e => {
              console.log(e)
              console.log(elem)
              applyToChildren(x => {
                x.style.fill = "blue"
                x.style.stroke = "blue"
              }, elem)
            },
            false
          )
        }
      }

      // parse the svg elements that vexflow creates
      getSvgs()
    } catch (err) {
      console.log("vexflow error: ", err)
    }
    unlog()
  }

  const triggerPlayback = () => {
    context.synth.triggerAttackRelease(["C4"], "2n")
  }

  const removeSVGs = () => {
    const me = document.getElementById(`vex-${id}`)
    if (me === null) return
    const svgList = me.getElementsByTagName("svg")
    for (let svg of svgList) {
      svg.remove()
    }
  }

  const getSvgs = () => {
    let me = document.getElementById(`vex-${id}`)
    let svgs = []

    // find all svg namespace elements within an element. Note that vexflow's SVG context calls document.createElementNS
    // with the svg namespace.
    const findMySVGs = ls => {
      if (ls.constructor.name === "HTMLCollection") {
        for (let elem of ls) {
          findMySVGs(elem)
        }
      } else {
        if (ls.namespaceURI === "http://www.w3.org/2000/svg") {
          svgs.push(ls)
        }
        if (ls.children && ls.children.length > 0) {
          findMySVGs(ls.children)
        }
      }
    }

    findMySVGs(me)
    svgs = svgs.filter(svg => svg.tagName !== "svg" && svg.tagName !== "g")
    svgs = svgs
      .sort((a, b) => a.getBBox().x - b.getBBox().x)
      .filter(a => a.getBBox().x > 10 && a.getBBox().x < 510)
    setSvgs(svgs)
    setSvgXPositions(svgs.map(a => a.getBBox().x).sort((a, b) => a - b))
  }

  return (
    <>
      {id === context.lastInteractedElemId && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      {id === context.lastInteractedElemId && context.noteMode ? (
        <div style={{ top: 20, right: 20, position: "fixed", color: "grey" }}>
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

      <div
        style={{
          position: "fixed",
          top: viewportY - 100 - (selected ? 1 : 0),
          left: viewportX - 200 - (selected ? 1 : 0),
          transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
          border: `${selected ? `1px solid grey` : ``}`,
        }}
        onClick={e => {
          if (!context.zoomMode) {
            e.stopPropagation()
            if (selected && !context.inspecting)
              setElementPropertyById(id, context, "selected", false)
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
              triggerPlayback()
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
