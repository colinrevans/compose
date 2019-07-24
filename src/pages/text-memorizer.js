import React, { useRef, useState, useEffect } from "react"
import { Link } from "gatsby"
import SEO from "../components/seo.js"
import Button from "@material-ui/core/Button"
import Table from "@material-ui/core/Table"
import TableCell from "@material-ui/core/TableCell"
import TableBody from "@material-ui/core/TableBody"
import TableHead from "@material-ui/core/TableHead"
import TableRow from "@material-ui/core/TableRow"
import invariant from "invariant"
import { equals, flatten } from "ramda"
import empty from "is-empty"

const has = x => !empty(x)

const COMPLETE = 0
const FIRST_AND_LAST_LETTERS = 1
const FIRST_LETTER = 2
const UNDERSCORES = 3
const WHITESPACE = 4
const DONE = 4

const TextContext = React.createContext("")

const hasAnnotaters = parsed => {
  return flatten(parsed.map(line => line.map(word => word.showAnnotater))).some(
    x => x
  )
}

const hasAnnotations = parsed => {
  return flatten(
    parsed.map(line => line.map(word => has(word.annotation)))
  ).some(x => x)
}

const removeOtherAnnotaters = (parsed, lineIdx, wordIdx) => {
  return parsed.map((line, i) =>
    line.map((word, j) =>
      i === lineIdx && j === wordIdx
        ? { ...word, showAnnotater: true }
        : { ...word, showAnnotater: false }
    )
  )
}

const firstAndLastLetter = text => {
  if (text.length <= 2) return text
  return (
    text.substr(0, 1) +
    text.substr(1, text.length - 2).replace(/[\da-zA-Z]/g, "_") +
    text.substr(text.length - 1)
  )
}
const justFirstLetter = text => {
  return text.substr(0, 1) + text.substr(1).replace(/[\da-zA-Z]/g, "_")
}
const asUnderscores = text => {
  return text.replace(/[\da-zA-Z]/g, "_")
}

const Annotater = props => {
  const inputEl = useRef(null)

  const handleKeydown = e => {
    //shift - enter
    if ((e.keyCode === 13 && e.shiftKey) || e.keyCode === 27) {
      props.onClose()
      e.preventDefault()
    }
  }

  useEffect(() => {
    inputEl.current.focus()
    window.addEventListener("keydown", handleKeydown, true)
    return () => window.removeEventListener("keydown", handleKeydown, true)
  }, [handleKeydown])

  return (
    <div
      style={{ position: "relative", width: 0, height: 0, display: "inline" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 20,
          backgroundColor: "white",
          border: "1px solid black",
          display: "inline",
          zIndex: 12,
          textIndent: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        <textarea
          ref={inputEl}
          style={{
            minWidth: 100,
            maxWidth: "50vw",
            height: 50,
            margin: 5,
            textIndent: 0,
          }}
          onChange={props.onChange}
          value={props.value}
        />
        <br />
        <Button
          style={{ float: "right" }}
          onClick={e => {
            props.onClose()
            e.stopPropagation()
          }}
          size="small"
        >
          done{` `}
          <span style={{ marginLeft: 4, padding: 0, fontSize: "80%" }}>
            (escape)
          </span>
        </Button>
      </div>
    </div>
  )
}

const replaceWord = (parsed, replacementWord, lineIdx, wordIdx) => {
  return parsed.map((line, lidx) =>
    line.map((word, widx) =>
      lineIdx === lidx && wordIdx === widx ? replacementWord : word
    )
  )
}

const Word = props => {
  const [isHovering, setIsHovering] = useState(false)
  const [annotationText, setAnnotationText] = useState(props.word.annotation)

  let textToDisplay = props.word.text ? props.word.text : ""
  if (props.option === COMPLETE) textToDisplay = props.word.text
  if (props.option === FIRST_AND_LAST_LETTERS)
    textToDisplay = firstAndLastLetter(props.word.text)
  if (props.option === FIRST_LETTER)
    textToDisplay = justFirstLetter(props.word.text)
  if (props.option === UNDERSCORES)
    textToDisplay = asUnderscores(props.word.text)

  if (isHovering || props.word.showAnnotater) textToDisplay = props.word.text

  const onCloseAnnotater = e => {
    props.setParsed(
      replaceWord(
        props.parsed,
        { ...props.word, showAnnotater: false, annotation: annotationText },
        props.word.lineIdx,
        props.word.wordIdx
      )
    )
  }

  return (
    <TextContext.Consumer>
      {({ parsed, setParsed }) => {
        return (
          <>
            {/*isHovering && props.option !== COMPLETE ? (
        <WordHover>{props.word.text}</WordHover>
      ) : null*/}
            {props.word.showAnnotater ? (
              <Annotater
                parsed={parsed}
                word={props.word}
                setParsed={setParsed}
                onChange={e => setAnnotationText(e.target.value)}
                onClose={onCloseAnnotater}
                onClick={e => e.stopPropagation()}
                value={annotationText}
              />
            ) : null}

            <span
              onMouseOver={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={e => {
                if (!props.word.showAnnotater) {
                  setParsed(
                    removeOtherAnnotaters(
                      replaceWord(
                        parsed,
                        { ...props.word, showAnnotater: true },
                        props.word.lineIdx,
                        props.word.wordIdx
                      ),
                      props.word.lineIdx,
                      props.word.wordIdx
                    )
                  )
                } else if (props.word.showAnnotater) {
                  setParsed(
                    replaceWord(
                      parsed,
                      { ...props.word, showAnnotater: false },
                      props.word.lineIdx,
                      props.word.wordIdx
                    )
                  )
                }
                e.stopPropagation()
              }}
              style={{
                padding: 0,
                margin: 0,
                color:
                  props.option === WHITESPACE && !isHovering
                    ? "white"
                    : "black",
                textDecoration: has(props.word.annotation)
                  ? `underline dotted ${
                      props.option === WHITESPACE ? "white" : "maroon"
                    }`
                  : "initial",
              }}
            >
              {textToDisplay}
            </span>
          </>
        )
      }}
    </TextContext.Consumer>
  )
}

const shouldReplace = (n = 5) => {
  return Math.floor(Math.random() * n) === 0
}

const allDone = (options, parsed, n = DONE) => {
  if (parsed === undefined) return false
  invariant(
    options.length === parsed.length,
    "all done given lists of unequal length"
  )
  for (let i = 0; i < options.length; i++) {
    if (isNewline(parsed, i)) continue
    for (let j = 0; j < options[i].length; j++) {
      if (options[i][j] !== n) return false
    }
  }
  return true
}

export const newWord = (text, lineIdx, wordIdx) => {
  return {
    showAnnotater: false,
    text,
    annotation: "",
    lineIdx,
    wordIdx,
  }
}

const isNewline = (parsed, i) => {
  return (
    Array.isArray(parsed[i]) &&
    parsed[i].length === 1 &&
    parsed[i][0].text === ""
  )
}

const optionsAreEqual = (oldOptions, newOptions, parsedWords) => {
  invariant(
    oldOptions.length === newOptions.length &&
      newOptions.length === parsedWords.length,
    "hasSteppedAWord was given lists of unequal length"
  )

  for (let i = 0; i < parsedWords.length; i++) {
    // if a newline
    if (isNewline(parsedWords, i)) continue

    if (!equals(oldOptions[i], newOptions[i])) return false
  }
  return true
}

export const TextMemorizer = props => {
  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState([])
  const [options, setOptions] = useState([])
  const [history, setHistory] = useState([parsed])
  const [idx, setIdx] = useState(0)
  const [cheat, setCheat] = useState(false)
  const [showInput, setShowInput] = useState(true)
  const [showMemorizer, setShowMemorizer] = useState(false)

  const handleKeydown = e => {
    if (e.defaultPrevented) return
    if (!showMemorizer) return
    if (e.keyCode === 220 || e.keyCode === 73) setCheat(true) //backslash

    const clearOfAnnotaters = !hasAnnotaters(parsed)
    if (clearOfAnnotaters) {
      if (e.keyCode === 37 || e.keyCode === 72) goBack() //left arrow
      if (e.keyCode === 38 || e.keyCode === 75) reset() // up arrow
      if (e.keyCode === 39 || e.keyCode === 76) {
        //right arrow
        stepMemorizer()
      }
      if (e.keyCode === 40 || e.keyCode === 74) stepAll() //down arrow
      if ([37, 38, 39, 40, 72, 75, 76, 74]) e.preventDefault()
    }
    //e.preventDefault();
  }

  const handleKeyup = e => {
    if (e.defaultPrevented) return
    if (e.keyCode === 220 || e.keyCode === 73) setCheat(false)
    e.preventDefault()
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown, true)
    window.addEventListener("keyup", handleKeyup, true)
    return () => {
      window.removeEventListener("keydown", handleKeydown, true)
      window.removeEventListener("keyup", handleKeyup, true)
    }
  }, [handleKeydown, handleKeyup, showInput])

  const reset = () => {
    let o = options.map(line => line.map(option => 0))
    setOptions(o)
    setIdx(0)
    setHistory([o])
  }

  const pushHistory = (optionsList, i = 0) => {
    // since setIdx and setHistory are asynchronous, they can get out of sync.
    // ensures there's no jittering when rapidly going
    // forward and backward through the options history, as when holding
    // the keyboard shortcut down.

    // if new options item has less cleared away than what's before it
    if (
      flatten(optionsList).reduce((a, b) => a + b) <
      flatten(history[0]).reduce((a, b) => a + b)
    )
      //sort them so they're in order
      setHistory(h =>
        [optionsList, ...h.slice(idx)].sort(
          (a, b) =>
            flatten(b).reduce((x, y) => x + y) -
            flatten(a).reduce((x, y) => x + y)
        )
      )
    else setHistory(h => [optionsList, ...h.slice(i)])
    setIdx(0)
  }

  const stepMemorizer = (c = 0) => {
    invariant(c < 100, "probable overflow")
    if (allDone(history[idx], parsed)) return

    let newOptions = []
    for (let line of history[idx]) {
      let newOptionsLine = []
      for (let word of line) {
        if (shouldReplace() && word < DONE) {
          newOptionsLine.push(word + 1)
        } else newOptionsLine.push(word)
      }
      newOptions.push(newOptionsLine)
    }

    if (
      optionsAreEqual(history[idx], newOptions, parsed) &&
      !allDone(history[idx], parsed)
    )
      return stepMemorizer(c + 1)

    setOptions(newOptions)
    setIdx(0)
    pushHistory(newOptions, idx)
  }

  const stepAll = () => {
    if (allDone(history[idx], parsed)) return
    if (history[idx] === undefined) return
    const i = flatten(history[idx]).sort((a, b) => a - b)[0]
    const newOptions = history[idx].map(line =>
      line.map(option => (i < DONE ? i + 1 : DONE))
    )
    setOptions(newOptions)
    setIdx(0)
    pushHistory(newOptions, idx)
  }

  const goBack = () => {
    if (idx < history.length - 1) setIdx(i => i + 1)
  }

  const goForward = () => {
    if (idx > 0) setIdx(i => i - 1)
  }

  return (
    <>
      <SEO title="Text Memorizer" />
      <h1>Text Memorizer</h1>

      {showInput ? (
        <>
          <textarea
            onChange={e => {
              setRawText(e.target.value)
              let p = e.target.value.split("\n").map((line, lineIdx) =>
                line
                  .replace(/\s{2,}/g, " ")
                  .split(" ")
                  .map((word, wordIdx) => newWord(word, lineIdx, wordIdx))
              )
              let o = p.map(line => line.map(word => 0))
              setParsed(p)
              setOptions(o)
              setIdx(0)
              setHistory([o])
            }}
            id="poem"
            name="poem"
            style={{ width: "100%", height: "50vh" }}
            value={rawText}
          />
          <br />
          <Button
            onClick={() => {
              setShowMemorizer(true)
              setShowInput(false)
            }}
          >
            memorize
          </Button>
          <br />
          {has(parsed) && showMemorizer ? <hr /> : null}
        </>
      ) : null}
      {!showInput ? (
        <div
          style={{ height: 2000, overflowY: "hidden" }}
          onClick={e =>
            setParsed(
              parsed.map(line =>
                line.map(word => ({ ...word, showAnnotater: false }))
              )
            )
          }
        >
          <TextContext.Provider
            value={{
              parsed,
              setParsed,
            }}
          >
            <h2>text</h2>
            <div
              style={{
                fontFamily: "Source Code Pro, monospace",
                fontSize: "88%",
                fontWeight: "100",
              }}
            >
              {parsed.map((line, lineIdx) =>
                !(line.length === 1 && line[0].text === "") ? (
                  <p>
                    {line
                      .map((word, wordIdx) => (
                        <TextContext.Consumer>
                          {({ parsed, setParsed }) => (
                            <Word
                              value={word.text}
                              word={word}
                              parsed={parsed}
                              setParsed={setParsed}
                              option={
                                history[idx] && history[idx][lineIdx] && !cheat
                                  ? history[idx][lineIdx][wordIdx]
                                  : 0
                              }
                            />
                          )}
                        </TextContext.Consumer>
                      ))
                      .reduce((x, y) => (
                        <>
                          {x} {y}
                        </>
                      ))}
                  </p>
                ) : (
                  <br />
                )
              )}
            </div>
            <Button
              onClick={() => stepMemorizer()}
              disabled={allDone(history[idx], parsed)}
            >
              step (→)
            </Button>
            <Button
              onClick={() => stepAll()}
              disabled={allDone(history[idx], parsed)}
            >
              step all (↓)
            </Button>
            <Button
              onMouseDown={e => setCheat(true)}
              onMouseUp={e => setCheat(false)}
              onTouchStart={e => setCheat(true)}
              onTouchEnd={e => setCheat(false)}
              disabled={allDone(history[idx], parsed, 0)}
            >
              cheat (<span style={{ margin: 0, fontSize: "80%" }}>\</span>)
            </Button>
            <Button
              onClick={() => goBack()}
              disabled={idx >= history.length - 1}
            >
              undo (←)
            </Button>
            <Button onClick={() => goForward()} disabled={idx === 0}>
              redo
            </Button>
            <Button
              style={{ marginLeft: "60px" }}
              onClick={() => reset()}
              disabled={allDone(history[idx], parsed, 0)}
            >
              reset (↑)
            </Button>
            <Button
              onClick={() => {
                setShowInput(true)
                setShowMemorizer(false)
              }}
            >
              edit
            </Button>
            {/*
            <Button
              onClick={() => {
                console.log(history[idx]);
                console.log("parsed", parsed);
              }}
            >
              log
            </Button>
            */}
            <br />
            {hasAnnotations(parsed) ? (
              <>
                <h2>annotations</h2>
                {parsed.map(line =>
                  line.map(word => {
                    if (has(word.annotation))
                      return (
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell style={{ width: "20%" }}>
                                {word.text}
                              </TableCell>
                              <TableCell style={{ width: "80%" }}>
                                {word.annotation}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      )
                    else return null
                  })
                )}
              </>
            ) : null}
          </TextContext.Provider>
        </div>
      ) : null}
    </>
  )
}

export default TextMemorizer
