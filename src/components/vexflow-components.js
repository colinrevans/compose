import React, { useState, useEffect } from "react"
import { easyScoreToExactNotes, voicingToEasyScore } from "../lib/music.js"
import Vex from "vexflow"
import styled, { keyframes } from "styled-components"

const VexPlaybackButton = styled.button`
  position: absolute;
  margin-top: 25px;
  transition: 0.2s;
  box-shadow: 0px 1px 2px #888888;
  background-color: rgb(250, 248, 248);
  :hover {
    border-color: rgb(126, 126, 126);
    transition: 0.2s;
  }
`

export const Vexflow = props => {
  useEffect(() => {
    removeSVGs()
    renderEasyScore(props.name, props.easyscore)
  })

  let onTwoStave = props.onTwoStave !== undefined ? props.onTwoStave : () => {}

  const tone = () => {
    if (props.easyscore === "D5/w/r") return
    if (!props.synth.loaded) {
      return
    }
    let notes = []

    if (needBassClef(props.easyscore)) {
      let [bass, treble] = splitToPianoStave(
        dropNotesByOctaves(
          props.easyscore,
          2 + Math.floor((needBassClef(props.easyscore) - 6) / 2)
        )
      )
      let bassNotes = easyScoreToExactNotes(bass)
      let trebleNotes = easyScoreToExactNotes(treble)
      notes = bassNotes.concat(trebleNotes)
    } else {
      notes = easyScoreToExactNotes(props.easyscore)
    }

    props.synth.triggerAttackRelease(notes, "2n")
  }

  const needBassClef = scr => {
    let lastNote = scr.replace(/.+ (.+)\)\/w$/, "$1")
    //if highest note is higher than G6
    let oct = parseInt(lastNote.match(/\d+$/))
    if (oct >= 6) return oct
    //if (oct === 5 && ["G", "F", "E", "D"].includes(lastNote[0])) return oct;
    else return false
  }

  const dropNotesByOctaves = (scr, numOctaves = 1) => {
    //rest?
    if (scr === "D5/w/r") return scr

    //single note?
    if (!scr.match(/\(/)) {
      let oct = parseInt(scr.match(/\d+/)) - numOctaves
      return scr.replace(/.(?=\/)/, oct)
    }

    //chord
    scr = notesInEasyScore(scr)
      .map(x => {
        let oct = parseInt(x.match(/\d+$/)) - numOctaves
        if (oct < 0) return ""
        return x.replace(/\d+$/, oct)
      })
      .join(" ")
      .trim()
    return "(" + scr + ")/w"
  }

  const notesInEasyScore = scr => {
    return scr.replace(/^\((.+)\)\/w$/, "$1").split(" ")
  }

  const splitToPianoStave = scr => {
    let notes = notesInEasyScore(scr)
    let idx = notes.findIndex(x => parseInt(x.substr(-1)) >= 4)
    // if nothing fits well in a treble clef, split w/ notes an octave higher
    if (idx === -1) return splitToPianoStave(dropNotesByOctaves(scr, -1))
    return [notes.slice(0, idx), notes.slice(idx)].map(x => {
      if (x.length === 1) return x + "/w"
      return "(" + x.join(" ") + ")/w"
    })
  }

  const renderEasyScore = (
    id,
    easyscore,
    width = props.width,
    height = props.height
  ) => {
    const VF = Vex.Flow
    let vf = new VF.Factory({
      renderer: { elementId: id, width: width, height: height },
    })

    let score = vf.EasyScore()
    let system = vf.System()

    if (needBassClef(easyscore)) {
      let [bass, treble] = splitToPianoStave(
        dropNotesByOctaves(
          easyscore,
          2 + Math.floor((needBassClef(easyscore) - 6) / 2)
        )
      )
      system
        .addStave({
          voices: [score.voice(score.notes(treble, { stem: "up" }))],
        })
        .addClef("treble")

      system
        .addStave({
          voices: [
            score.voice(score.notes(bass, { clef: "bass", stem: "up" })),
          ],
        })
        .addClef("bass")

      system.addConnector()
      onTwoStave(true)
    } else {
      system
        .addStave({
          voices: [score.voice(score.notes(easyscore, { stem: "up" }))],
        })
        .addClef(props.overrideClef || "treble")

      system.addConnector()
      onTwoStave(false)
    }

    vf.draw()
  }

  const removeSVGs = () => {
    if (document.getElementById(props.name) === null) return
    let svgList = document
      .getElementById(props.name)
      .getElementsByTagName("svg")
    for (let i = 0; i < svgList.length; i++) {
      svgList[i].remove()
    }
  }

  return (
    <>
      <div style={{ ...props.style }} id={props.name} />
      {props.playback ? (
        <VexPlaybackButton disabled={props.synth ? false : true} onClick={tone}>
          play
        </VexPlaybackButton>
      ) : (
        <></>
      )}
    </>
  )
}
