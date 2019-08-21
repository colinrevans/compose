import React, { useEffect, useState, useCallback } from "react"
import { Link } from "gatsby"
import Button from "@material-ui/core/Button"
import { equals } from "ramda"
import { Spotify, Youtube } from "../components/embeds"
import keycode from "keycode"
import empty from "is-empty"
import { Sampler } from "tone"
import pdfjsLib from "pdfjs-dist"
import invariant from "invariant"
import {
  setElementPropertyById,
  getViewportCoordinates,
  setPropertyForAll,
  selectElementAndDeselectRest,
  deleteElementById,
} from "../lib/infinite-util"
import Inspector from "../components/inspector"
import InfiniteVexflow from "../components/InfiniteVexflow"
import "../components/layout.css"

//localStorage.clear()

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
  const [mouse, setMouse] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })
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
  const [noteMode, setNoteMode] = useState(false)
  const [octave, setOctave] = useState(4)
  // toggled every time a component saves.
  // see useEffect below that saves canvas whenever
  // this changes.
  const [saveTicker, setSaveTicker] = useState(null)

  {
    /* LOADING AND SAVING */
  }

  const saveCanvas = () => {
    let saveData = { elements, translate }
    localStorage.setItem("canvas", JSON.stringify(saveData))
    console.log("SAVED CANVAS")
  }

  // 'pushes' state bottom up -- this is called from within child elements using the provided context!
  const saveElement = (id, saveState) => {
    setElements(elements =>
      elements.map(elem => (elem.id === id ? { ...elem, ...saveState } : elem))
    )
    setSaveTicker(s => !s)
  }

  useEffect(() => {
    if (saveTicker !== null) saveCanvas()
  }, [saveTicker])

  useEffect(() => {
    let saveData = localStorage.getItem("canvas")
    saveData = JSON.parse(saveData)
    if (!saveData) return
    saveData = {
      ...saveData,
      elements: saveData.elements.map(elem => ({
        ...elem,
        component: NAMES_TO_COMPONENTS[elem.componentName],
        selected: false,
      })),
    }
    let { elements, translate } = saveData
    setElements(elements)
    if (elements.length > 0) idCount = elements[elements.length - 1].id + 1
    if (elements.length > 0) setTranslate(translate)
  }, [])

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
        componentName: component.name,
        selected: false,
        ...options,
      },
    ])
    setLastInteractedElemId(idCount)
    if (component.name === "InfiniteVexflow") setNoteMode(true)
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
          createElement(InfiniteTextArea, mouse.x, mouse.y, {
            text,
          })
        }
      })
      .catch(err => console.log)
  }
  const alignSelected = () => {
    setElements(elems => {
      let ids = elems.filter(elem => elem.selected).map(elem => elem.id)
      let firstX = null
      return elems.map(elem => {
        if (ids.includes(elem.id)) {
          if (firstX === null) {
            firstX = elem.x
            return elem
          } else return { ...elem, x: firstX }
        } else return elem
      })
    })
  }

  {
    /* COMMANDS */
  }

  const commands = {
    // CANVAS MODE
    "navigate left": { fn: navigateLeft, keys: [16, 65], mode: "canvas" },
    "navigate right": { fn: navigateRight, keys: [16, 68], mode: "canvas" },
    "navigate up": { fn: navigateUp, keys: [16, 87], mode: "canvas" },
    "navigate down": { fn: navigateDown, keys: [16, 83], mode: "canvas" },
    clear: { fn: () => setElements([]), keys: [16, 67], mode: "canvas" },
    "delete last": {
      fn: () => setElements(elements => elements.slice(0, elements.length - 1)),
      keys: [16, 88],
      mode: "canvas",
    },
    "create text field": {
      fn: () => createElement(InfiniteTextArea),
      keys: [16, 32],
      mode: "canvas",
    },
    "create score": {
      fn: () => createElement(InfiniteVexflow),
      keys: [16, 86],
      mode: "canvas",
    },
    "create youtube embed": {
      fn: () => createElement(InfiniteYoutube),
      keys: [16, 89],
      mode: "canvas",
    },
    "create pdf": {
      fn: () => createElement(InfinitePDF),
      keys: [16, 80],
      mode: "canvas",
    },
    "show help": {
      fn: () => setShowHelp(prev => !prev),
      keys: [16, 191],
      mode: "canvas",
    },
    "move left": {
      fn: () => setTranslate(cur => ({ ...cur, x: cur.x + 150 / zoom.scale })),
      keys: [65],
      altKeys: [72],
      mode: "canvas",
    },
    "move up": {
      fn: () => setTranslate(cur => ({ ...cur, y: cur.y + 150 / zoom.scale })),
      keys: [87],
      altKeys: [75],
      mode: "canvas",
    },
    "move right": {
      fn: () => setTranslate(cur => ({ ...cur, x: cur.x - 150 / zoom.scale })),
      keys: [68],
      altKeys: [76],
      mode: "canvas",
    },
    "move down": {
      fn: () => setTranslate(cur => ({ ...cur, y: cur.y - 150 / zoom.scale })),
      keys: [83],
      altKeys: [74],
      mode: "canvas",
    },
    "zoom in mode": {
      fn: () => setZoomMode(zm => (zm !== 1 ? 1 : 0)),
      keys: [90],
      mode: "canvas",
    },
    "zoom out mode": {
      fn: () => setZoomMode(zm => (zm !== -1 ? -1 : 0)),
      keys: [16, 90],
      mode: "canvas",
    },
    "align vertically": {
      fn: () => alignSelected(),
      keys: ["meta", 65],
      mode: "canvas",
    },
    "initiate zoom": {
      fn: () => zoomAccordingToMode(),
      keys: [32],
      mode: "canvas",
    },
    "inspect mode": {
      fn: () => setInspecting(i => !i),
      keys: [73, 16],
      mode: "canvas",
    },
    "delete selected": {
      fn: () =>
        setElements(elements => elements.filter(elem => !elem.selected)),
      keys: [8, 16],
      mode: "any",
    },
    "zen mode": {
      fn: () => setZenMode(zm => !zm),
      keys: [16, 70],
      mode: "canvas",
    },
    "log notes": {
      fn: () => console.log(elements),
      keys: [16, 69],
      mode: "any",
    },
    paste: { fn: paste, keys: ["meta", 86], mode: "any" },
    "activate note mode": {
      fn: () => setNoteMode(nm => !nm),
      keys: [78],
      mode: "canvas",
    },

    // NOTES (commands that rely on an InfiniteCanvas component's state reside in the component!)
    // TODO add octave offset to inputNote so that k and l are notes too
    "decrease octave": {
      fn: () => setOctave(o => (o > 1 ? o - 1 : o)),
      keys: [90],
      mode: "notes",
    },
    "increase octave": {
      fn: () => setOctave(o => (o < 8 ? o + 1 : o)),
      keys: [88],
      mode: "notes",
    },
    "deactivate note mode": {
      fn: () => setNoteMode(nm => !nm),
      keys: [78],
      mode: "notes",
    },

    // ANY
    "deselect all": {
      fn: () => {
        document.activeElement.blur()
        setPropertyForAll({ elements, setElements }, "selected", false)
      },
      keys: [27],
      mode: "any",
    },
  }

  {
    /* EVENT HANDLERS */
  }

  const onKeyDown = useCallback(
    e => {
      // infinite canvas elements call e.captured = true
      // to say that the key event shouldn't apply at the app level.
      // ie a tailored preventDefault system.
      if (e.captured) return

      // if e.keyCode matches a keyCode from the commands list
      // && we are in the right mode
      // execute that command's function
      let mode = "canvas"
      if (
        ["TEXTAREA", "INPUT"].includes(document.activeElement.tagName) ||
        document.activeElement.getAttribute("contenteditable") === "true"
      )
        mode = "edit"
      else if (noteMode) mode = "notes"
      let keys = [e.keyCode]
      if (e.shiftKey) keys.push(16)
      if (e.metaKey) keys.push("meta")

      if (e.keyCode === 27) {
        setNoteMode(false)
        setZoomMode(0)
      }

      // let's get out of zoom mode if we're in it and it's not a zoom event
      if (!keys.includes(90) && !keys.includes(32)) setZoomMode(0)

      for (let key of Object.keys(commands)) {
        let command = commands[key]
        if (
          equals(new Set(keys), new Set(command.keys)) ||
          equals(new Set(keys), new Set(command.altKeys))
        )
          if (
            command.mode === "any" ||
            command.mode === mode ||
            (mode === "notes" && keys.includes(16))
          ) {
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
    const initializeSynth = async () => {
      let sampler = await new Sampler(SAMPLER_FILES).toMaster()
      setSynth(sampler)
    }

    initializeSynth()
  }, [])

  useEffect(() => {
    // so our contenteditable p's don't add divs inside!
    document.execCommand("defaultParagraphSeparator", false, "p")
  }, [])

  // event listeners
  useEffect(() => {
    if (window === undefined) return
    window.addEventListener("keydown", onKeyDown, false)
    window.addEventListener("mousemove", onMouseMove, false)

    return () => {
      if (window === undefined) return
      window.removeEventListener("keydown", onKeyDown, false)
      window.removeEventListener("mousemove", onMouseMove, false)
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
        mouse,
        synth,
        zenMode,
        saveElement,
        saveCanvas,
        octave,
        noteMode,
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
            width: 2,
            height: 2,
            backgroundColor: "black",
            color: "grey",
            position: "fixed",
            left: "calc(50vw - 1px)",
            top: "calc(50vh - 1px)",
          }}
        />
        <h1
          className="noselect"
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            color: "lightgrey",
            fontWeight: 300,
            zIndex: 12,
          }}
        >
          compose
        </h1>
        <span
          className="noselect"
          style={{
            position: "fixed",
            top: 34,
            left: 200,
            color: "#ededed",
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
          onClick={() => saveCanvas()}
        >
          save
        </Button>
        <Button
          style={{
            position: "fixed",
            bottom: 20,
            left: 420,
            color: "grey",
            zIndex: 14,
          }}
          onClick={() => console.log(elements)}
        >
          log
        </Button>

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

const InfiniteTextArea = ({ context, id, scale, selected, x, y, ...props }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null
  const [options, setOptions] = useState({
    scale: 1 / scale,
    color: "black",
    resizable: true,
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
            height: options["distraction free"] && selected ? "100vh" : "100px",
            width:
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
  const [text, setText] = useState(props.text ? props.text : "")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    //document.getElementById(`textarea-${props.id}`).focus()
  }, [])

  const onChange = event => {
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
          width: ${props.distractionFree
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
          border: `1px solid ${props.selected ? "grey" : "white"}`,
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

// so we can JSON stringify/parse the component property of an element,
// which is a function
const NAMES_TO_COMPONENTS = {
  InfiniteVexflow: InfiniteVexflow,
  InfiniteYoutube: InfiniteYoutube,
  InfiniteTextArea: InfiniteTextArea,
}
