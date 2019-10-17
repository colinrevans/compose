import React, { useState, useEffect } from "react"
import { Sampler } from "tone"

// in public folder
const SAMPLER_FILES = {
  C3: "/piano/C3.[mp3|ogg]",
  G3: "/piano/G3.[mp3|ogg]",
  C4: "/piano/C4.[mp3|ogg]",
  G4: "/piano/G4.[mp3|ogg]",
  C5: "/piano/C5.[mp3|ogg]",
}

let notes = {
  a: "C4",
  w: "Db4",
  s: "D4",
  e: "Eb4",
  d: "E4",
  f: "F4",
  t: "F#4",
  g: "G4",
  y: "Ab4",
  h: "A4",
  u: "Bb4",
  j: "B4",
  k: "C5",
}

let keysDown = {}
//
const HoverPiano = props => {
  const [synth, setSynth] = useState(null)
  const [lastPlayed, setLastPlayed] = useState("")

  // initialize tone.js
  useEffect(() => {
    const initializeSynth = async () => {
      let sampler = await new Sampler(SAMPLER_FILES).toMaster()
      setSynth(sampler)
    }

    initializeSynth()
  }, [])

  const playNote = e => {
    if (keysDown[e.key]) return

    keysDown[e.key] = true
    if (synth) {
      for (let key of Object.keys(notes)) {
        let note = notes[key]
        if (e.key === key) {
          setLastPlayed(note.replace(/\d/g, ""))
          synth.triggerAttackRelease([note], "4n")
        }
      }
    }
  }

  const onKeyUp = e => {
    if (keysDown[e.key]) delete keysDown[e.key]
  }

  useEffect(() => {
    window.addEventListener("keydown", playNote, true)
    window.addEventListener("keyup", onKeyUp, true)

    return () => {
      window.removeEventListener("keydown", playNote, true)
      window.removeEventListener("keyup", onKeyUp, true)
    }
  }, [playNote, synth, onKeyUp])

  return (
    <>
      <img
        style={{
          position: "fixed",
          bottom: "calc(50vh - 75px)",
          right: 15,
          marginBottom: 0,
        }}
        src="/svgs/hover keyboard.svg"
        width={150}
        height={142}
        alt="hover piano"
      />
      {/*
      <span
        style={{
          fontFamily: "georgia",
          fontSize: 12,
          position: "fixed",
          right: 40,
          bottom: "calc(50vh - 100px)",
        }}
      >
        {`last note played: ${lastPlayed ? lastPlayed : "n/a"}`}
      </span>
      */}
    </>
  )
}

export default HoverPiano
