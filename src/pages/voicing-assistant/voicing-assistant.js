import React, { useState } from "react"
import {
  TUNINGS,
  CHORD_TYPES,
  noteStrToVoicing,
  inputToEasyScoreChord,
  inputToIntervalDisplay,
  tablatureToVoicing,
  tablatureToEasyScore,
  voicingToEasyScore,
  howToFretVoicing,
  processTuningInput,
  matchChord,
} from "./music"
import { OnlyMobile, NoMobile } from "./styled/elements"
import { Vexflow, VexflowHover } from "./vexflow-components"
import { Link } from "gatsby"
import TextField from "@material-ui/core/TextField"
import FormControl from "@material-ui/core/FormControl"
import InputLabel from "@material-ui/core/InputLabel"
import Select from "@material-ui/core/Select"
import MenuItem from "@material-ui/core/MenuItem"
import styled from "styled-components"
import * as theme from "./styled/theme"
import { HangIndent } from "./styled/styles"

const InputTextField = styled.div`
  display: inline-flex;
  width: 100%;
  margin-top: 15px;
  p {
    line-height: 2em;
  }
`

const TuningTextField = styled.div`
  display: inline-block;
  width: 73%;
`

const Result = styled.div`
  margin-left: 125px;
  margin-top: 130px;
  font-size: 150%;
  @media screen and (max-width: $responsive-width) {
    margin-top: 30px;
  }
`

const RedOutline = styled.div`
  display: inline;
  [class*="MuiOutlinedInput-notchedOutline"] {
    border-color: ${theme.TOPBAR_COLOR} !important;
  }
  [class*="MuiFormLabel-focused"] {
    color: ${theme.TOPBAR_COLOR} !important;
  }
  [class*="MuiInput-underline"] {
    :after {
      border-bottom: 2px solid ${theme.TOPBAR_COLOR} !important;
    }
  }
`

const ChordMatch = styled.div`
  margin-bottom: 100px;
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    margin-top: ${props => (props.twoStave ? "-60px" : "-130px")};
  }
`

// id matches Vexflow of same name
const NoteDisplay = styled.div`
  display: inline-block;
  #notedisplay {
    margin: 0px;
    //width: 200px;
    //height: 800px;
    position: absolute;
    //left: ${theme.SIDEBAR_WIDTH};
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    z-index: -1;

    @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
      svg path,
      rect {
        transform: translateY(25px);
      }
    }
    @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
      svg path,
      rect {
        transform: translateY(25px);
      }
    }
  }
`

export const VoicingAssistant = props => {
  const [voicing, setVoicing] = useState("")
  const [easyScore, setEasyScore] = useState("D5/w/r")
  const [intervalDisplay, setIntervalDisplay] = useState("")
  const [mode, setMode] = useState("notes")
  const [tuning, setTuning] = useState(
    localStorage.getItem("tuning") ? localStorage.getItem("tuning") : "standard"
  )
  const [customTuning, setCustomTuning] = useState([])
  const [curVal, setCurVal] = useState("")
  const [curCustomTuningInput, setCurCustomTuningInput] = useState("")
  const [twoStave, setTwoStave] = useState(false)

  const handleInput = event => {
    setCurVal(event.target.value)
    let t

    // if handleInput is being called because the tuning has changed
    if (Array.isArray(event.target.tuning)) t = event.target.tuning
    else if (event.target.tuning !== undefined) {
      t = TUNINGS[event.target.tuning]
      setCustomTuning([])
    } // if handleInput is handling regular input
    else {
      if (customTuning.length !== 0) t = customTuning
      else t = TUNINGS[tuning]
    }

    let val = event.target.value.toLowerCase()
    let modeForThisInput = mode
    if (val === "") {
      modeForThisInput = mode
    }
    if (val.trim().match(/^v/)) {
      modeForThisInput = "voicing"
      setMode("voicing")
    } else if (
      Object.keys(CHORD_TYPES).includes(val.trim().replace(/\s/g, "_"))
    ) {
      modeForThisInput = "chord"
      setMode("chord")
    } else if (val.trim().match(/[o0123456789]/)) {
      modeForThisInput = "tablature"
      setMode("tablature")
    } else {
      modeForThisInput = "notes"
      setMode("notes")
    }

    if (modeForThisInput === "notes") {
      setVoicing(noteStrToVoicing(val))
      setEasyScore(inputToEasyScoreChord(val))
      setIntervalDisplay(inputToIntervalDisplay(val).join(", "))
    } else if (modeForThisInput === "tablature") {
      setVoicing(tablatureToVoicing(val, t))
      setEasyScore(tablatureToEasyScore(val, t))
      setIntervalDisplay([])
    } else if (modeForThisInput === "voicing") {
      if (val.match(/[^v1234567890te.\s]/)) {
        val = ""
      } else val = val.replace(/\s/g, "").substr(1)

      setVoicing(val)
      setEasyScore(voicingToEasyScore(val))
      setIntervalDisplay([])
    } else if (modeForThisInput === "chord") {
      let key = val.trim().replace(/\s/g, "_")
      setVoicing(CHORD_TYPES[key].rootPosition)
      setEasyScore(voicingToEasyScore(CHORD_TYPES[key].rootPosition))
      setIntervalDisplay([])
    }
  }

  const tuningSelect = event => {
    if (event.target.value === "custom") {
      setTuning("custom")
      handleCustomTuning({ target: { value: curCustomTuningInput } })
      return
    } else if (
      !Array.isArray(event.target.value) &&
      event.target.value !== undefined
    ) {
      setTuning(event.target.value)
      localStorage.setItem("tuning", event.target.value)
    } else {
      setCustomTuning(event.target.value)
    }
    setVoicing("")
    setEasyScore(voicingToEasyScore(""))
    let dummyEvent = { target: { value: curVal, tuning: event.target.value } }
    handleInput(dummyEvent)
  }

  const handleTwoStave = bool => {
    setTwoStave(bool)
  }

  const handleCustomTuning = event => {
    let val = processTuningInput(event.target.value)
    let evt = { target: { value: val } }
    setTuning("custom")
    setCurCustomTuningInput(event.target.value)
    tuningSelect(evt)
  }

  return (
    <div style={{ transform: "scale(0.9)", transformOrigin: "top left" }}>
      <div>
        <FormControl
          style={{
            maxWidth: "130px",
            display: "inline-block",
            minWidth: "33%",
          }}
        >
          <InputLabel htmlFor="age-simple">tuning</InputLabel>
          <Select
            value={tuning}
            onChange={tuningSelect}
            inputProps={{
              name: "tuning",
              id: "tuning-simple",
            }}
          >
            {Object.keys(TUNINGS).map((x, idx) => {
              return (
                <MenuItem key={idx + "tuningmenu"} value={x}>
                  {x}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <RedOutline>
          <TuningTextField>
            <TextField
              autoFocus={false}
              fullWidth={true}
              label="custom tuning"
              name="tuning"
              autoComplete="off"
              variant="standard"
              onChange={handleCustomTuning}
            />
          </TuningTextField>

          <InputTextField>
            <TextField
              autoFocus={true}
              fullWidth={true}
              label="input"
              helperText={
                "notes (a g# C db fs), tablature (o o 1 2 x 3), voicing (v2.7te), or chord (major7)"
              }
              name="input"
              autoComplete="off"
              variant="outlined"
              onChange={handleInput}
            />
          </InputTextField>
        </RedOutline>
      </div>

      <NoteDisplay>
        <Vexflow
          height={twoStave ? 350 : 200}
          width={200}
          name="notedisplay"
          easyscore={easyScore}
          onTwoStave={handleTwoStave}
          playback={true}
          synth={props.synth}
        />
      </NoteDisplay>

      <Result>
        {voicing}
        {/* | {intervalDisplay} */}
      </Result>
      <GuitarVoicingTable
        twoStave={twoStave}
        voicing={voicing}
        tuning={customTuning.length !== 0 ? customTuning : TUNINGS[tuning]}
      />
      <br />
      <br />
      <ChordMatch twoStave={twoStave}>
        <table style={{ width: "100%" }}>
          <tbody>
            {matchChord(voicing).map((x, idx) => {
              if (x[2] > 0)
                return (
                  <tr
                    style={{
                      fontStyle: x[2] > 0.999 ? "italic" : "normal",
                      color: x[2] > 0.999 ? "rgb(0, 26, 51)" : "black",
                    }}
                    key={x[0]}
                  >
                    <td style={{ opacity: x[2] ** 2 / 2 + x[2] / 2 }}>
                      {x[0]
                        .replace(/_/g, " ")
                        .replace(/\ssharp\s/, " #")
                        .replace(/\sflat\s/, " b")
                        .replace(/seven\s/, "7 ")}
                    </td>
                    <td>
                      <VexflowHover
                        textStyle={`opacity: ${x[2] ** 2 / 2 + x[2] / 2}`}
                        voicing={x[1]}
                      />
                    </td>
                    <td style={{ opacity: x[2] ** 2 / 2 + x[2] / 2 }}>
                      {Math.round(x[2] * 100)}
                    </td>
                  </tr>
                )
              else return <></>
            })}
          </tbody>
        </table>
      </ChordMatch>
    </div>
  )
}

let GuitarVoicingTableStyled = styled.div`
  position: relative;
  min-height: 132px;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    margin-top: ${props => (props.twoStave ? "200px" : "100px")};
    margin-left: 0px;
    width: 90vw;
  }
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    //margin-bottom: 70px;
    margin-left: 225px;
    bottom: ${props => (props.twoStave ? "70px" : "134px")};
    width: 30vw;
  }
  @media screen and (min-width: 1000px) {
    width: 50vw;
  }
`

export const GuitarVoicingTable = props => {
  let voicing = props.voicing
  let tuning = props.tuning
  if (voicing === "") return <GuitarVoicingTableStyled />
  if (voicing.length > tuning.length - 1) return <GuitarVoicingTableStyled />
  let howToList = howToFretVoicing(voicing, tuning)
  if (howToList === undefined || howToList === null) howToList = []

  const fillToSize = l => {
    if (l.length === tuning.length) {
      return l
    }
    if (l.length < tuning.length) {
      return fillToSize(["", ...l])
    }
  }

  tuning = tuning.slice().reverse()

  howToList = fillToSize(howToList.slice().reverse()).map((x, idx) => {
    return (
      <HangIndent>
        <div key={idx}>
          {tuning[idx].match(/[^\d]+/)} : {x}
        </div>
      </HangIndent>
    )
  })

  return (
    <GuitarVoicingTableStyled twoStave={props.twoStave}>
      <div className={props.className}>{howToList}</div>
    </GuitarVoicingTableStyled>
  )
}

export default VoicingAssistant
