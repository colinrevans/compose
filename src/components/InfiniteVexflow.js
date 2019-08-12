import React, { useState, useEffect } from "react"
import { VexPlaybackButton } from "./vexflow-components"
import Inspector from "./inspector"
import TextField from "@material-ui/core/TextField"
import empty from "is-empty"

const last = arr => arr[arr.length - 1]

// keys that are currently pressed.
// used to reliably suppress key repeats when necessary
let keysDown = {}
// lastKeyEventType : "up" | "down" | null
// this is used for managing whether piano roll input
// adds to a chord or creates a new note.
let lastKeyEventType = null

let note = {
  keys: [{ key: "c", octave: 4, accidental: "" }],
  duration: "q",
}

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
}

import {
  getViewportCoordinates,
  setElementPropertyById,
  deleteElementById,
  selectElementAndDeselectRest,
} from "../lib/infinite-util"

export const InfiniteVexflow = ({ context, scale, x, y, id, selected }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({
    ["scale"]: 1 / scale,
    ["playback"]: false,
  })
  const [lastCommand, setLastCommand] = useState("")
  const [notes, setNotes] = useState([])
  const [showCommandField, setShowCommandField] = useState(false)
  const [commandKeys, setCommandKeys] = useState([])
  const [metaMakesNewNote, setMetaMakesNewNote] = useState(false)
  const [svgs, setSvgs] = useState([])
  const [svgXPositions, setSvgXPositions] = useState([])
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  // KEYBOARD EVENT LISTENERS
  useEffect(() => {
    const octaveUp = offset => {
      offset = parseInt(offset, 10)
      setNotes(notes =>
        notes.map(note => ({
          ...note,
          keys: note.keys.map(key => {
            return { ...key, octave: key.octave + offset }
          }),
        }))
      )
    }

    const backspace = e => {
      if (e.shiftKey) return
      setNotes(n => n.slice(0, n.length - 1))
    }

    const octaveDown = offset => octaveUp(offset * -1)

    // makes a chord of all notes since the last chord (if n undefined)
    // or of n last notes
    const chordify = n => {
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
      setNotes(notes => [
        ...notes.slice(0, idxOfFirstNoteToChordify),
        { keys, duration: notes[0].duration },
      ])
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
      let newKey = {
        ...keyToInvert,
        octave: keyToInvert.octave + (up ? 1 : -1),
      }
      let newKeys = up
        ? [...lastNote.keys.slice(1), newKey]
        : [...lastNote.keys.slice(0, lastNote.keys.length - 1), newKey]
      setNotes(notes => [
        ...notes.slice(0, notes.length - 1),
        { ...lastNote, keys: newKeys },
      ])
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
        console.log("repeat")
        return
      }
      let octave = context.octave
      if (["k", "l", ";"].includes(e.key)) octave += 1
      if (e.metaKey)
        if (metaMakesNewNote) {
          addNoteToEnd({
            // NOTE : keysToNotes may contain accidental information
            // for now.
            keys: [{ octave, accidental: "", ...keysToNotes[e.key] }],
            duration: "q",
          })
          setMetaMakesNewNote(false)
        } else {
          addNoteToLastVerticality({
            keys: [{ octave, accidental: "", ...keysToNotes[e.key] }],
            duration: "q",
          })
          setMetaMakesNewNote(false)
        }
      else
        addNoteToEnd({
          keys: [{ octave, accidental: "", ...keysToNotes[e.key] }],
          duration: "q",
        })
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
      "do again": {
        key: /\./,
        fn: () => doLastCommand(),
      },
    }

    const onKeyDown = e => {
      if (id !== context.lastInteractedElemId) return
      if (!context.noteMode) return

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
            console.log("COMMAND: ", key)
            if (!command.noCapture) capture()
          }
        }
      }
      keysDown[e.key] = true
      lastKeyEventType = "down"
    }

    const onKeyUp = e => {
      delete keysDown[e.key]
      if (e.key === "Meta") setMetaMakesNewNote(true)
      if (showCommandField) {
        for (let key of Object.keys(commandFieldCommands)) {
          let command = commandFieldCommands[key]
          if (
            commandKeys.every((x, idx) => x.match(command.keys[idx])) &&
            commandKeys.length === command.keys.length
          ) {
            command.fn(last(commandKeys))
            console.log("COMMAND FIELD COMMAND: ", key)
            setCommandKeys([])
            setShowCommandField(false)
            setLastCommand({ name: key, arg: last(commandKeys) })
          }
        }
      }
      lastKeyEventType = "up"
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
    metaMakesNewNote,
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
          ? {
              ...n,
              keys: [...n.keys, ...note.keys],
            }
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

    let now = new Date()
    if (lastKeyEventType === "up" || lastKeyEventType === null) {
      setNotes(notes => [...notes, note])
      sound()
    } else if (lastKeyEventType === "down") {
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
    try {
      const VF = require("vexflow").Flow
      const div = document.getElementById(`vex-${id}`)
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG)
      renderer.resize(notes.length * 30 + 100, 200)
      const context = renderer.getContext()
      const stave = new VF.Stave(10, 40, notes.length * 30 + 100)
      stave.addClef("treble")
      stave.setContext(context).draw()

      if (notes.length > 0) {
        const staveNotes = notes.map(n => {
          let accidentalList = []
          for (let i = 0; i < n.keys.length; i++) {
            let key = n.keys[i]
            if (key.accidental)
              accidentalList.push({ idx: i, accidental: key.accidental })
          }
          let keysInVexflowFormat = n.keys.map(
            key => `${key.key}${key.accidental}/${key.octave}`
          )
          console.log(keysInVexflowFormat)
          let vfNote = new VF.StaveNote({
            clef: "treble",
            ...n,
            keys: keysInVexflowFormat,
          })
          for (let { idx, accidental } of accidentalList) {
            vfNote = vfNote.addAccidental(idx, new VF.Accidental(accidental))
          }
          return vfNote
        })
        const voice = new VF.Voice({ num_beats: notes.length, beat_value: 4 })
        voice.addTickables(staveNotes)
        const formatter = new VF.Formatter()
          .joinVoices([voice])
          .format([voice], notes.length * 30)
        voice.draw(context, stave)
      }

      // parse the svg elements that vexflow creates
      getSvgs()
    } catch (err) {
      console.log("vexflow error: ", err)
    }
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

      {showCommandField ? (
        <TextField
          className="noselect"
          style={{
            maxWidth: 100,
            position: "fixed",
            bottom: 20,
            left: window.innerWidth / 2 - 50,
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
