import React, { useEffect, useState } from "react"
import { Sampler } from "tone"

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

const SVG = ({ playable, width, height, file }) => {
  const [synth, setSynth] = useState(null)
  // on mount
  useEffect(() => {
    if (playable) {
      const initializeSynth = async () => {
        let sampler = await new Sampler(SAMPLER_FILES).toMaster()
        setSynth(sampler)
      }

      initializeSynth()
    }
  }, [])

  // once synth has loaded
  useEffect(() => {
    if (playable && synth) {
      setTimeout(() => {
        let frame = document.getElementById(`svg-frame-${file}`)
        console.log(frame)
        if (!frame) return
        let d = frame.contentWindow.document
        const inject = elem => {
          if (elem.children.length === 0) {
            let m = elem.id.match(/^[A-G](#|b)?\d/)
            if (m) {
              elem.addEventListener("mousedown", () => {
                if (synth) synth.triggerAttackRelease([m[0]], "4n")
              })

              //console.log("added event listener to ", elem, m[0])
            }
          } else {
            for (let el of elem.children) {
              inject(el)
            }
          }
        }
        if (d) {
          inject(d)
          console.log("injected")
        }
      }, 2000)
    }
  }, [synth])

  const playNote = e => {
    if (keysDown[e.key]) return

    keysDown[e.key] = true
    if (synth) {
      for (let key of Object.keys(notes)) {
        let note = notes[key]
        if (e.key === key) {
          synth.triggerAttackRelease([note], "4n")
        }
      }
    }
  }

  const onKeyUp = e => {
    if (keysDown[e.key]) delete keysDown[e.key]
  }

  // we have to duplicate the keydown hover keyboard. (ugh)
  // as soon as someone clicks the svg, the <object> takes over
  // and our window key listeners get deactivated.
  // maybe its ona alter
  // so add em to the svg-frame's contentWindow.document
  useEffect(() => {
    let frame = document.getElementById(`svg-frame-${file}`)
    let w = frame.contentWindow
    w.addEventListener("keydown", playNote, true)
    w.addEventListener("keyup", onKeyUp, true)

    return () => {
      w.removeEventListener("keydown", playNote, true)
      w.removeEventListener("keyup", onKeyUp, true)
    }
  }, [playNote, synth, onKeyUp])

  return (
    <div style={{ textAlign: "center" }}>
      <object
        id={`svg-frame-${file}`}
        data={`/svgs/${file}`}
        width={width ? width : "100%"}
        height={height ? height : "100%"}
        type="image/svg+xml"
      />
    </div>
  )
}

export default SVG
