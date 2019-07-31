import React, { useEffect, useState, useCallback } from "react"
import { Link } from "gatsby"
import { Vexflow } from "../components/vexflow-components.js"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import Checkbox from "@material-ui/core/Checkbox"
import { equals } from "ramda"
import { Spotify, Youtube } from "../components/embeds"
import keycode from "keycode"
import empty from "is-empty"
import { Sampler } from "tone"
import pdfjsLib from "pdfjs-dist"
import invariant from "invariant"
import "../components/layout.css"

// in public folder
const SAMPLER_FILES = {
  C3: "/piano/C3.[mp3|ogg]",
  G3: "/piano/G3.[mp3|ogg]",
  C4: "/piano/C4.[mp3|ogg]",
  G4: "/piano/G4.[mp3|ogg]",
  C5: "/piano/C5.[mp3|ogg]",
}

// idCount is never reset to zero. Every element gets a unique id.
// the most recent element is always the one with the highest id.
let idCount = 0

const ComposeContext = React.createContext({})

const Compose = () => {
  const [mouse, setMouse] = useState({ x: 100, y: 100 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState({ scale: 1 })
  const [elements, setElements] = useState([])
  const [showHelp, setShowHelp] = useState(false)
  // 1 is zoom in, -1 is zoom out, 0 is don't zoom
  const [zoomMode, setZoomMode] = useState(0)
  // id of element that was most recently interacting with
  const [lastInteractedElemId, setLastInteractedElemId] = useState(null)
  const [inspecting, setInspecting] = useState(false)
  const [synth, setSynth] = useState(null)
  const [zenMode, setZenMode] = useState(false)

  {
    /* FUNCTIONS FOR COMMANDS . see below for command list. */
  }

  const createElement = (component, x = mouse.x, y = mouse.y, options = {}) => {
    setElements(elements => [
      ...elements,
      {
        x,
        y,
        scale: zoom.scale,
        id: idCount,
        component,
        selected: false,
        ...options,
      },
    ])
    setLastInteractedElemId(idCount)
    idCount += 1
  }

  // TODO update mouse.x and mouse.y after navigation

  const navigateRight = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      x: translate.x - window.innerWidth / zoom.scale,
    }))
  }, [zoom])

  const navigateLeft = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      x: translate.x + window.innerWidth / zoom.scale,
    }))
  }, [zoom])

  const navigateDown = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      y: translate.y - window.innerHeight / zoom.scale,
    }))
  }, [zoom])

  const navigateUp = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      y: translate.y + window.innerHeight / zoom.scale,
    }))
  }, [zoom])

  const zoomAccordingToMode = () => {
    if (zoomMode === 1) zoomIn()
    if (zoomMode === -1) zoomOut()
  }
  const zoomIn = () =>
    setZoom(zoom => ({
      scale: zoom.scale + 0.5 * zoom.scale,
    }))
  const zoomOut = () =>
    setZoom(zoom => ({
      scale: zoom.scale - 0.5 * zoom.scale,
    }))
  const paste = async () => {
    navigator.clipboard
      .readText()
      .then(text => {
        if (text.match(/youtu\.?be/))
          createElement(InfiniteYoutube, mouse.x, mouse.y, {
            src: text.match(/=.+/)[0].substr(1),
          })
        else {
          let alt = [e.altKeys]
          console.log("typeof: ", typeof test)
          createElement(InfiniteTextArea, mouse.x, mouse.y, {
            text,
          })
        }
      })
      .catch(err => console.log)
  }

  {
    /* COMMANDS */
  }

  // prettier-ignore
  const commands = {
    'navigate left': { fn: navigateLeft, keys: [16, 65], mode: 'noedit' },
    'navigate right': { fn: navigateRight, keys: [16, 68], mode: 'noedit' },
    'navigate up': { fn: navigateUp, keys: [16, 87], mode: 'noedit' },
    'navigate down': { fn: navigateDown, keys: [16, 83], mode: 'noedit' },
    'clear': { fn: (() => setElements([])), keys: [16, 67],  mode: 'noedit'},
    'delete last': { fn: () => setElements(elements => elements.slice(0, elements.length - 1)),
                     keys: [16, 88], mode: 'noedit'},
    'create text field': { fn: (() => createElement(InfiniteTextArea)), keys: [16, 32],  mode: 'noedit'},
    'create score': { fn: (() => createElement(InfiniteVexflow)), keys: [16, 86],  mode: 'noedit'},
    'create youtube embed': { fn: (() => createElement(InfiniteYoutube)), keys: [16, 89],  mode: 'noedit'},
    'create pdf': { fn: (() => createElement(InfinitePDF)), keys: [16, 80], mode: 'noedit'},
    'show help': { fn: (() => setShowHelp(prev => !prev)), keys: [16, 191], mode: 'noedit'},
    'move left': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x + 150 / zoom.scale}))),
                   keys: [65], altKeys: [72], mode: 'noedit'},
    'move up': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y + 150 / zoom.scale}))),
                 keys: [87], altKeys: [75], mode: 'noedit'},
    'move right': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x - 150 / zoom.scale}))),
                    keys: [68], altKeys: [76], mode: 'noedit'},
    'move down': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y - 150 / zoom.scale}))),
                   keys: [83], altKeys: [74], mode: 'noedit'},
    'deselect all': { fn: (() => {document.activeElement.blur(); setPropertyForAll({ elements, setElements}, 'selected', false)}), keys: [27], mode: 'any'},
    'zoom in mode': { fn: (() => setZoomMode(zm => zm !== 1 ? 1 : 0)), keys: [90], mode: 'noedit'},
    'zoom out mode': { fn: (() => setZoomMode(zm => zm !== -1 ? -1 : 0)), keys: [16, 90], mode: 'noedit'},
    'initiate zoom': { fn: (() => zoomAccordingToMode()), keys: [32], mode: 'noedit'},
    'inspect mode': { fn: (() => setInspecting(i => !i)), keys: [73], mode: 'noedit'},
    'delete selected': { fn: (() => setElements(elements => elements.filter(elem => !elem.selected))), keys: [8, 16], mode: 'any'},
    'zen mode': { fn: (() => setZenMode(zm => !zm)), keys: [16, 70], mode: 'noedit'},
    'paste': { fn: paste, keys: ['meta', 86], mode: 'noedit'},
  }

  {
    /* EVENT HANDLERS */
  }

  const onKeyDown = useCallback(
    e => {
      // if e.keyCode matches a keyCode from the commands list
      // && we are in the right mode
      // execute that command's function
      let mode =
        ["TEXTAREA", "INPUT"].includes(document.activeElement.tagName) ||
        document.activeElement.getAttribute("contenteditable") === "true"
          ? "edit"
          : "noedit"
      let keys = [e.keyCode]
      if (e.shiftKey) keys.push(16)
      if (e.metaKey) keys.push("meta")

      // let's get out of zoom mode if we're in it and it's not a zoom event
      if (!keys.includes(90) && !keys.includes(32)) setZoomMode(0)

      for (let key of Object.keys(commands)) {
        let command = commands[key]
        if (
          equals(new Set(keys), new Set(command.keys)) ||
          equals(new Set(keys), new Set(command.altKeys))
        )
          if (command.mode === "any" || command.mode === mode) {
            command.fn()
            e.preventDefault()
            document.activeElement.blur()
          }
      }
    },
    [mouse, commands]
  )

  const onMouseMove = useCallback(
    ({ x, y }) => {
      setMouse({
        x:
          (x - window.innerWidth / 2) / zoom.scale +
          window.innerWidth / 2 -
          translate.x,
        y:
          (y - window.innerHeight / 2) / zoom.scale +
          window.innerHeight / 2 -
          translate.y,
      })
    },
    [mouse, translate, zoom]
  )

  {
    /* LIFECYCLE */
  }

  // synth initialization
  useEffect(() => {
    initializeSynth()
  }, [])

  useEffect(() => {
    // so our contenteditable p's don't add divs inside!
    document.execCommand("defaultParagraphSeparator", false, "p")
  }, [])

  const initializeSynth = async () => {
    let sampler = await new Sampler(SAMPLER_FILES).toMaster()
    setSynth(sampler)
  }

  // event listeners
  useEffect(() => {
    if (window === undefined) return
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("mousemove", onMouseMove, true)

    return () => {
      if (window === undefined) return
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("mousemove", onMouseMove, true)
    }
  }, [onKeyDown, onMouseMove, mouse, translate, elements])

  {
    /* RENDER */
  }
  return (
    <ComposeContext.Provider
      value={{
        zoom,
        translate,
        elements,
        setElements,
        zoomMode,
        lastInteractedElemId,
        setLastInteractedElemId,
        inspecting,
        setInspecting,
        synth,
        zenMode,
      }}
    >
      {elements.every(elem => !elem.selected) && inspecting ? (
        <Inspector />
      ) : null}
      <div
        onWheel={e => {
          e.preventDefault()
          //e.stopPropagation()
          if (e.shiftKey) {
            let dy = e.deltaY
            setZoom(z => {
              return { ...z, scale: z.scale + dy * 0.01 * z.scale }
            })
          } else {
            let dx = e.deltaX / zoom.scale
            let dy = e.deltaY / zoom.scale
            setTranslate(translate => ({
              x: translate.x - dx,
              y: translate.y - dy,
            }))
          }
        }}
        onClick={e => {
          if (zoomMode === 1) zoomIn()
          if (zoomMode === -1) zoomOut()
          if (zoomMode !== 0) e.preventDefault()
          setElements(elements =>
            elements.map(elem => ({ ...elem, selected: false }))
          )
        }}
        style={{
          overflowX: "hidden",
          overflowY: "hidden",
          cursor: (() => {
            if (zoomMode === 1) return "zoom-in"
            if (zoomMode === 0) return "default"
            if (zoomMode === -1) return "zoom-out"
          })(),
        }}
      >
        <div
          style={{
            width: 1,
            height: 1,
            backgroundColor: "black",
            color: "black",
            position: "fixed",
            left: "calc(50vw)",
            top: "calc(50vh)",
          }}
        />
        <h1
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            color: "grey",
            fontWeight: 300,
            zIndex: 12,
          }}
        >
          compose
        </h1>
        <span
          style={{
            position: "fixed",
            top: 34,
            left: 200,
            color: "lightgrey",
            fontFamily: "sans-serif",
          }}
        >
          ({Math.round(-1 * translate.x)}, {Math.round(-1 * translate.y)})
        </span>
        {/* CLEAR */}
        <Button
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            color: "grey",
            zIndex: 14,
          }}
          onClick={() => {
            setElements([])
          }}
        >
          clear
        </Button>
        {/* TO ORIGIN */}
        <Button
          style={{
            position: "fixed",
            bottom: 20,
            left: 120,
            color: "grey",
            zIndex: 14,
          }}
          onClick={() => setTranslate({ x: 0, y: 0 })}
        >
          origin
        </Button>
        <Button
          style={{
            position: "fixed",
            bottom: 20,
            left: 220,
            color: "grey",
            zIndex: 14,
          }}
          onClick={() => setShowHelp(s => !s)}
        >
          help
        </Button>
        <Button
          style={{
            position: "fixed",
            bottom: 20,
            left: 320,
            color: "grey",
            zIndex: 14,
          }}
          onClick={() => console.log(elements)}
        >
          log
        </Button>

        {/* NAVIGATION */}
        <Button
          style={{
            position: "fixed",
            bottom: "50vh",
            left: 5,
            color: "grey",
          }}
          onClick={navigateLeft}
        >
          ⟵
        </Button>
        <Button
          style={{
            position: "fixed",
            bottom: "50vh",
            right: 5,
            color: "grey",
          }}
          onClick={navigateRight}
        >
          ⟶
        </Button>
        <Button
          style={{
            position: "fixed",
            left: "calc(50vw - 32px)",
            top: 5,
            color: "grey",
          }}
          onClick={navigateUp}
        >
          ↑
        </Button>
        <Button
          style={{
            position: "fixed",
            left: "calc(50vw - 32px)",
            bottom: 5,
            color: "grey",
          }}
          onClick={navigateDown}
        >
          ↓
        </Button>
        {showHelp ? (
          <>
            <style jsx>
              {`
                .container {
                  overflow-y: scroll;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }
                .container::-webkit-scrollbar {
                  width: 0;
                  height: 0;
                }
              `}
            </style>
            <div
              className="container"
              style={{
                position: "fixed",
                backgroundColor: "white",
                right: "calc(50vw - 200px)",
                top: "10vh",
                width: 400,
                height: "80vh",
                overflow: "hidden",
                color: "grey",
                border: "1px solid grey",
                fontFamily: "sans-serif",
                fontSize: "80%",
                sizing: "content-box",
                zIndex: 2,
              }}
            >
              <p style={{ padding: 30, textTransform: "capitalize" }}>
                Keyboard Shortcuts
                <hr />
                {Object.keys(commands).map(commandName => {
                  let command = commands[commandName]
                  return (
                    <>
                      <span style={{ float: "left" }}>{commandName}: </span>
                      <span style={{ marginLeft: "80px" }}> </span>
                      <span style={{ float: "right" }}>
                        {command.keys
                          .map(key =>
                            keycode(key) ? keycode(key).toUpperCase() : ""
                          )
                          .reduce((a, b) => a + " + " + b)}
                      </span>
                      <br />
                    </>
                  )
                })}
              </p>
            </div>
          </>
        ) : null}

        <div
          style={{
            overflowY: "hidden",
            width: "100vw",
            height: "100vh",
          }}
        >
          {elements.map(({ component, ...props }) => (
            <ComposeContext.Consumer key={`consumer-${props.id}`}>
              {context =>
                React.createElement(component, { ...props, context }, null)
              }
            </ComposeContext.Consumer>
          ))}
        </div>
      </div>
    </ComposeContext.Provider>
  )
}

export default Compose

// __________
// COMPONENTS
// ----------

const InfiniteVoicingAssistant = props => {
  let zoom = props.zoom + props.globalZoom.scale
  if (zoom < -1) zoom = -1
  return (
    <iframe
      style={{
        position: "fixed",
        top: props.y + props.translateY - 150,
        left: props.x + props.translateX,
        transform: `scale(${zoom})`,
        minWidth: 500,
        minHeight: 600,
      }}
      src={props.src}
      id={`voicing-assistant-${props.idx}`}
    />
  )
}

const InfinitePDF = ({ context, scale, x, y, id, selected, ...props }) => {
  //https://repositorio.ufsc.br/bitstream/handle/123456789/163729/The%20Ballad%20of%20the%20Sad%20Caf%C3%A9%20-%20Carson%20McCullers.pdf?sequence=1
  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({
    url: "/helloworld (3).pdf",
    width: "302",
    height: "302",
  })

  useEffect(() => {
    let url = options.url
    var loadingTask = pdfjsLib.getDocument(url)
    loadingTask.promise.then(
      function(pdf) {
        // Fetch the first page
        var pageNumber = 1
        pdf.getPage(pageNumber).then(function(page) {
          var scale = 1.5
          var viewport = page.getViewport({ scale: scale })

          // Prepare canvas using PDF page dimensions
          var canvas = document.getElementById(`pdf-canvas-${id}`)
          var context = canvas.getContext("2d")
          canvas.height = viewport.height
          canvas.width = viewport.width

          // Render PDF page into canvas context
          var renderContext = {
            canvasContext: context,
            viewport: viewport,
          }
          var renderTask = page.render(renderContext)
          renderTask.promise.then(function() {})
        })
      },
      function(reason) {
        // PDF loading error
        console.error(reason)
      }
    )
  }, [options.url, options.width, options.height])

  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <>
      {id === context.lastInteractedElemId && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      <canvas
        id={`pdf-canvas-${id}`}
        onClick={e => {
          if (!context.zoomMode) {
            e.stopPropagation()
            if (selected && !context.inspecting)
              setElementPropertyById(id, context, "selected", false)
            if (selected && context.inspecting)
              context.setLastInteractedElemId(id)
            if (!selected) {
              setElementPropertyById(id, context, "selected", true)
              context.setLastInteractedElemId(id)
            }
          }
        }}
        style={{
          border: `1px solid ${selected ? "grey" : "#ededed"}`,
          position: "fixed",
          top: viewportY,
          left: viewportX,
          width: `${options.width}px`,
          height: `${options.height}px`,
          transform: `scale(${context.zoom.scale / scale})`,
        }}
      />
    </>
  )
}

const InfiniteYoutube = ({ context, scale, x, y, id, selected, ...props }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({ src: props.src ? props.src : "" })
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <>
      {id === context.lastInteractedElemId && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      <div
        style={{
          position: "fixed",
          top: viewportY - 120,
          left: viewportX - 170,
          width: 340,
          height: 240,
          transform: `scale(${context.zoom.scale / scale})`,
        }}
        onMouseEnter={e => setIsHovering(true)}
        onMouseLeave={e => setIsHovering(false)}
      >
        {isHovering ? (
          <div
            style={{
              position: "absolute",
              width: 10,
              height: 20,
              top: 5,
              right: 5,
              color: "black",
            }}
            onClick={e => {
              if (!context.zoomMode) {
                e.stopPropagation()
                if (selected && !context.inspecting)
                  setElementPropertyById(id, context, "selected", false)
                if (selected && context.inspecting)
                  context.setLastInteractedElemId(id)
                if (!selected) {
                  setElementPropertyById(id, context, "selected", true)
                  context.setLastInteractedElemId(id)
                }
              }
            }}
          >
            i
          </div>
        ) : null}
        <Youtube
          style={{
            position: "fixed",
            top: 20,
            left: 20,
          }}
          src={options.src}
          id={`youtube-${id}`}
          onLoad={e => setLoaded(true)}
        />
        {!loaded ? (
          <p
            style={{
              position: "absolute",
              color: "grey",
              fontFamily: "sans-serif",
              top: 100,
              left: 100,
              zIndex: -1,
            }}
          >
            loading
          </p>
        ) : null}
      </div>
    </>
  )
}

const InfiniteVexflow = ({ context, scale, x, y, id, selected }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({
    ["border color"]: "grey",
    ["scale"]: 1 / scale,
    ["playback"]: false,
    ["easy score"]: "D5/w/r",
  })
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <>
      {id === context.lastInteractedElemId && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      <div
        style={{
          position: "fixed",
          top: viewportY - 75 - (selected ? 1 : 0),
          left: viewportX - 150 - (selected ? 1 : 0),
          transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
          border: `${selected ? `1px solid ${options["border color"]}` : ""}`,
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
        <Vexflow
          name={`vex-${id}`}
          synth={context.synth ? context.synth : null}
          easyscore={options["easy score"]}
          playback={options.playback}
        />
      </div>
    </>
  )
}

const Inspector = ({ options, setOptions }) => {
  const [tempOptions, setTempOptions] = useState(options)

  const handleChange = (e, key) => {
    setTempOptions(opt => ({ ...opt, [key]: e.target.value }))
  }
  return (
    <div
      style={{
        width: "30vw",
        position: "fixed",
        color: "black",
        outline: "1px solid black",
        backgroundColor: "white",
        right: 0,
        top: 0,
        height: "100vh",
        zIndex: 100,
      }}
    >
      <div style={{ margin: 20 }}>
        inspector
        <hr />
        {!empty(tempOptions)
          ? Object.keys(tempOptions).map(key => (
              <div style={{ height: 46 }}>
                <div style={{ float: "left" }}>{key}: </div>
                <div style={{ float: "right" }}>
                  {React.createElement(
                    typeof tempOptions[key] === "boolean"
                      ? OptionsToggle
                      : OptionsTextField,
                    {
                      optionKey: key,
                      optionValue: tempOptions[key],
                      setOptions,
                    }
                  )}
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}

const OptionsToggle = ({ optionKey, optionValue, setOptions }) => {
  const [toggleValue, setToggleValue] = useState(optionValue)
  return (
    <Checkbox
      color="default"
      onClick={e => {
        setToggleValue(v => !v)
        setOptions(options => ({
          ...options,
          [optionKey]: !options[optionKey],
        }))
        e.stopPropagation()
        e.preventDefault()
      }}
      checked={toggleValue}
    />
  )
}

const OptionsTextField = ({ optionKey, optionValue, setOptions }) => {
  const [textFieldValue, setTextFieldValue] = useState(optionValue)
  return (
    <TextField
      value={textFieldValue}
      onChange={e => {
        setTextFieldValue(e.target.value)
      }}
      onKeyDown={e => {
        if (e.keyCode === 13) {
          setOptions(options => ({
            ...options,
            [optionKey]: textFieldValue,
          }))
          e.stopPropagation()
          e.preventDefault()
        }
      }}
    />
  )
}

const InfiniteTextArea = ({ context, id, scale, selected, x, y, ...props }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null
  const [options, setOptions] = useState({
    scale: 1 / scale,
    color: "black",
    resizable: false,
    ["distraction free"]: false,
    ["no critic"]: false,
  })

  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  // no critic mode
  useEffect(() => {
    let me = document.getElementById(`textarea-${id}`)
    let paragraphs = [me, ...me.children]
    if (options["no critic"] === false) {
      for (let p of paragraphs) p.style.color = options.color
    } else {
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i]
        if (i === paragraphs.length - 1) p.style.color = options.color
        else p.style.color = "white"
      }
    }
  }, [options["no critic"]])

  return (
    <>
      {id === context.lastInteractedElemId && context.inspecting && selected ? (
        <Inspector options={options} setOptions={setOptions} />
      ) : null}

      <div
        onClick={e => {
          if (options["distraction free"]) {
            e.stopPropagation()
            return
          }
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
        onMouseDown={e => {
          if (e.shiftKey) {
            e.preventDefault()
            document.activeElement.blur()
          }
        }}
        id={`textarea-container-${id}`}
        style={{ overflowY: options["distraction free"] ? "auto" : "hidden" }}
      >
        <MyTextField
          {...props}
          context={context}
          id={id}
          scale={scale}
          distractionFree={options["distraction free"]}
          options={options}
          selected={selected}
          onWheel={e => {
            if (options["distraction free"]) e.stopPropagation()
          }}
          x={x}
          y={y}
          resizable={options.resizable}
          style={{
            ...props.style,
            color: options.color,
            position: "fixed",
            top: options["distraction free"] && selected ? 0 : viewportY - 19,
            left: options["distraction free"] && selected ? 0 : viewportX - 80,
            transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
            backgroundColor: "white",
            minHeight:
              options["distraction free"] && selected ? "100vh" : "100px",
            minWidth:
              options["distraction free"] && selected
                ? context.inspecting
                  ? "70vw"
                  : "100vw"
                : "70px",
            zIndex: options["distraction free"] ? "1000" : "0",
            overflowY: "auto",
          }}
          idx={props.id}
        />
      </div>
    </>
  )
}

const MyTextField = props => {
  console.log(props.text)
  const [text, setText] = useState(props.text ? props.text : "")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    //document.getElementById(`textarea-${props.id}`).focus()
  }, [])

  const onChange = event => {
    console.log("on change")
    setText(event.target.value)

    if (props.distractionFree) return
    const field = event.target

    props.context.setLastInteractedElemId(props.id)

    //auto-expand so there isn't a vertical scrollbar
    let computed = window.getComputedStyle(field)
    let height =
      parseInt(computed.getPropertyValue("border-top-width"), 10) +
      field.scrollHeight +
      parseInt(computed.getPropertyValue("border-bottom-width"), 10)
    field.style.height = height + "px"
  }

  return (
    <>
      <style jsx>{`
        p {
          margin-bottom: 0px;
          max-width: ${props.distractionFree
            ? props.context.inspecting
              ? "70vw"
              : "100vw"
            : "100vw"};
        }
      `}</style>
      <p
        contentEditable
        {...props}
        resizable="a"
        onClick={e => {
          if (props.context.zoomMode) {
            e.preventDefault()
            document.getElementById(`textarea-${props.id}`).blur()
          }
        }}
        onMouseDown={e => {
          if (e.shiftKey) {
            e.preventDefault()
            document.activeElement.blur()
          }
        }}
        onKeyUp={e => {
          if (props.options["no critic"]) {
            if (e.keyCode === 13 || e.keyCode === 32) {
              let me = document.getElementById(`textarea-${props.id}`)
              let paragraphs = [me, ...me.children]
              for (let i = 0; i < paragraphs.length; i++) {
                const p = paragraphs[i]
                if (i === paragraphs.length - 1)
                  p.style.color = props.options.color
                else p.style.color = "white"
              }
            }
          }
        }}
        style={{
          fontSize: "80%",
          fontFamily: "georgia",
          ...props.style,
          cursor: (() => {
            if (props.context.zoomMode === 1) return "zoom-in"
            if (props.context.zoomMode === -1) return "zoom-out"
            if (props.context.zoomMode === 0) return "text"
          })(),
          border: `1px solid ${
            props.selected
              ? "grey"
              : hovering || empty(text)
              ? "#ededed"
              : "white"
          }`,
          lineHeight: "120%",
          resize: props.resizable ? "both" : "none",
          marginBottom: 0,
          paddingLeft: props.distractionFree ? "15vw" : 0,
          paddingRight: props.distractionFree ? "15vw" : 0,
          paddingTop: props.distractionFree ? 30 : 0,
          paddingBottom: props.distractionFree ? 30 : 0,
        }}
        id={`textarea-${props.id}`}
        value={text}
        onChange={onChange}
        autoComplete="new-password"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />
    </>
  )
}

// ________________
// HELPER FUNCTIONS
// ----------------

// VIEWPORT
const getViewportCoordinates = (
  x,
  y,
  globalTranslate,
  globalZoom,
  zoomOriginX = window.innerWidth / 2,
  zoomOriginY = window.innerHeight / 2
) => {
  let scaledX = globalZoom.scale * x
  let scaledY = globalZoom.scale * y
  let scaledTopLeftX = globalZoom.scale * globalTranslate.x * -1
  let scaledTopLeftY = globalZoom.scale * globalTranslate.y * -1
  let viewportCenterX =
    scaledTopLeftX + Math.floor(zoomOriginX) * globalZoom.scale
  let viewportCenterY =
    scaledTopLeftY + Math.floor(zoomOriginY) * globalZoom.scale
  let newDiffXFromCenter = scaledX - viewportCenterX
  let newDiffYFromCenter = scaledY - viewportCenterY
  let viewportX = newDiffXFromCenter + zoomOriginX
  let viewportY = newDiffYFromCenter + zoomOriginY
  return { viewportX, viewportY }
}

// CONVENIENCE FUNCTIONS FOR SETTING Compose STATE
const setElementPropertyById = (id, context, prop, value) => {
  context.setElements(elements =>
    elements.map(elem => (elem.id === id ? { ...elem, [prop]: value } : elem))
  )
}

const setPropertyForAll = (context, prop, value) => {
  context.setElements(elements =>
    elements.map(elem => ({ ...elem, [prop]: value }))
  )
}

const selectElementAndDeselectRest = (id, context) => {
  context.setElements(elements =>
    elements.map(elem =>
      elem.id === id
        ? { ...elem, selected: true }
        : { ...elem, selected: false }
    )
  )
}

const deleteElementById = (id, context) => {
  context.setElements(elements => elements.filter(elem => elem.id !== id))
}
