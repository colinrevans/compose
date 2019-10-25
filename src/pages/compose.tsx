import React, { useEffect, useState, useCallback } from "react"
import { equals, clone } from "ramda"
import { Sampler } from "tone"
import { setPropertyForAll } from "../lib/infinite-util"
import Inspector from "../components/compose/inspector"
import InfiniteVexflow from "../components/compose/InfiniteVexflow2"
import InfiniteTextArea from "../components/compose/InfiniteTextArea"
import HelpMenu from "../components/compose/HelpMenu"
import OverlayUI from "../components/compose/OverlayUI"
import InfiniteYoutube from "../components/compose/InfiniteYoutube"
import empty from "is-empty"
import InfinitePDF from "../components/compose/InfinitePDF"
import "../components/layout.css"

let wheelTimeout = null
export let wheeling = false

export interface draggingType {
 id: number
 x: number
 y: number
}
export let dragging: null | draggingType = null
export const setDragging = (d: draggingType): void => {
 dragging = d
}

// so we can JSON parse a stringified component property of an element,
// which is a function
const NAMES_TO_COMPONENTS = {
 InfiniteVexflow: InfiniteVexflow,
 InfiniteYoutube: InfiniteYoutube,
 InfiniteTextArea: InfiniteTextArea,
}

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
let rawMouseX: number | null = null
let rawMouseY: number | null = null

export interface point {
 x: number
 y: number
}

const Compose = (): React.ReactNode => {
 // this is cumbersome but necessary for Gatsby Build to work.
 // Gatsby has no window object to reference.
 let mouseX = null
 let mouseY = null
 try {
  mouseX = window.innerWidth / 2
  mouseY = window.innerHeight / 2
 } catch (err) {
  mouseX = 0
  mouseY = 0
 }
 const [mouse, setMouse] = useState<point>({ x: mouseX, y: mouseY })

 const [translate, setTranslate] = useState<point>({ x: 0, y: 0 })
 const [zoom, setZoom] = useState({ scale: 1 })
 const [elements, _setElements] = useState([])
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
 const [tick, setTick] = useState(false)
 // toggled every time a component saves.
 // see useEffect below that saves canvas whenever
 // this changes.
 const [saveTicker, _setSaveTicker] = useState(null)
 const setElements = (x, from?: string): void => {
  console.log("setting elements")
  if (from) console.log("from ", from)
  _setElements(x)
 }
 const setSaveTicker = (x, from?: string): void => {
  console.log("setting save ticker")
  if (from) console.log("from ", from)
  _setSaveTicker(x)
 }

 for (const element of elements) {
  if (element.id > idCount) idCount = element.id + 1
 }

 {
  /* LOADING AND SAVING */
 }

 const saveCanvas = (): void => {
  console.log("elements to save: ", elements)
  const saveData = { elements, translate, zoom }
  localStorage.setItem("canvas", JSON.stringify(saveData))
  console.log("SAVED CANVAS")
 }

 // 'pushes' state bottom up -- this is called from within child elements using the provided context
 const saveElement = (id: number, saveState): void => {
  // within options, scale is encoded as its reciprocal
  // for a more intuitive user experience
  let scale: number
  if (saveState.options) {
   if (saveState.options.scale) scale = 1 / saveState.options.scale
  }
  setElements(
   elements =>
    elements.map(elem =>
     elem.id === id
      ? { ...elem, ...saveState, scale: scale || elem.scale }
      : elem
    ),
   "c98"
  )
  setSaveTicker(s => !s, "c112")
 }

 const duplicateElement = (id: number, saveState): void => {
  let scale
  if (saveState.options) {
   if (saveState.options.scale) scale = 1 / saveState.options.scale
  }
  const me = elements.filter(elem => elem.id === id)[0]
  const newMe = clone(me)
  console.log(newMe)
  setElements(
   elems => [
    ...elems,
    {
     ...newMe,
     x: newMe.x - 30 * zoom.scale,
     y: newMe.y - 30 * zoom.scale,
     id: idCount + 1,
    },
   ],
   "c130"
  )
  setSaveTicker(s => !s, "c131")
  idCount += 2
 }

 useEffect(() => {
  if (saveTicker !== null) saveCanvas()
 }, [saveTicker])

 useEffect(() => {
  let saveData = localStorage.getItem("canvas")
  if (!saveData) return
  let parsed = JSON.parse(saveData)
  parsed = {
   ...parsed,
   elements: parsed.elements.map(elem => ({
    ...elem,
    component: NAMES_TO_COMPONENTS[elem.componentName],
    selected: false,
   })),
  }
  const { elements, translate, zoom } = parsed
  setElements(elements, "119")
  if (elements.length > 0) {
   idCount = elements[elements.length - 1].id + 1
   setTranslate(translate)
   setZoom(zoom)
  }
 }, [])

 {
  /* FUNCTIONS FOR COMMANDS . see below for command list. */
 }

 const createElement = (
  component,
  x: number = mouse.x,
  y: number = mouse.y,
  options = {}
 ): void => {
  setElements(
   elements => [
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
   ],
   "c141"
  )
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

 const zoomIn = (): void =>
  setZoom(zoom => ({
   scale: zoom.scale + 0.5 * zoom.scale,
  }))
 const zoomOut = (): void =>
  setZoom(zoom => ({
   scale: zoom.scale - 0.5 * zoom.scale,
  }))
 const zoomAccordingToMode = (): void => {
  if (zoomMode === 1) zoomIn()
  if (zoomMode === -1) zoomOut()
 }

 const paste = async (): Promise<void> => {
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
   .catch(err => console.log(err))
 }
 const alignSelected = (): void => {
  setElements(elems => {
   const ids = elems.filter(elem => elem.selected).map(elem => elem.id)
   let firstX: null | number = null
   return elems.map(elem => {
    if (ids.includes(elem.id)) {
     if (firstX === null) {
      firstX = elem.x
      return elem
     } else return { ...elem, x: firstX }
    } else return elem
   })
  }, "c217")
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
  clear: {
   fn: (): void => setElements([], "clear"),
   keys: [16, 67],
   mode: "canvas",
  },
  "delete last": {
   fn: (): void =>
    setElements(
     elements => elements.slice(0, elements.length - 1),
     "delete last"
    ),
   keys: [16, 88],
   mode: "canvas",
  },
  "create text field": {
   fn: (): void => createElement(InfiniteTextArea),
   keys: [16, 84],
   mode: "canvas",
  },
  "create score": {
   fn: (): void => createElement(InfiniteVexflow),
   keys: [16, 86],
   mode: "canvas",
  },
  "create youtube embed": {
   fn: (): void => createElement(InfiniteYoutube),
   keys: [16, 89],
   mode: "canvas",
  },
  "create pdf": {
   fn: (): void => createElement(InfinitePDF),
   keys: [16, 80],
   mode: "canvas",
  },
  "show help": {
   fn: (): void => setShowHelp(prev => !prev),
   keys: [16, 191],
   mode: "canvas",
  },
  "move left": {
   fn: (): void =>
    setTranslate(cur => ({ ...cur, x: cur.x + 150 / zoom.scale })),
   keys: [65],
   altKeys: [72],
   mode: "canvas",
  },
  "move up": {
   fn: (): void =>
    setTranslate(cur => ({ ...cur, y: cur.y + 150 / zoom.scale })),
   keys: [87],
   altKeys: [75],
   mode: "canvas",
  },
  "move right": {
   fn: (): void =>
    setTranslate(cur => ({ ...cur, x: cur.x - 150 / zoom.scale })),
   keys: [68],
   altKeys: [76],
   mode: "canvas",
  },
  "move down": {
   fn: (): void =>
    setTranslate(cur => ({ ...cur, y: cur.y - 150 / zoom.scale })),
   keys: [83],
   altKeys: [74],
   mode: "canvas",
  },
  "zoom in mode": {
   fn: (): void => setZoomMode(zm => (zm !== 1 ? 1 : 0)),
   keys: [90],
   mode: "canvas",
  },
  "zoom out mode": {
   fn: (): void => setZoomMode(zm => (zm !== -1 ? -1 : 0)),
   keys: [16, 90],
   mode: "canvas",
  },
  "align vertically": {
   fn: (): void => alignSelected(),
   keys: ["meta", 65],
   mode: "canvas",
  },
  "initiate zoom": {
   fn: (): void => zoomAccordingToMode(),
   keys: [32],
   mode: "canvas",
  },
  "inspect mode": {
   fn: (): void => setInspecting(i => !i),
   keys: [73, 16],
   mode: "canvas",
  },
  "delete selected": {
   fn: (): void =>
    setElements(
     elements => elements.filter(elem => !elem.selected),
     "delete selected"
    ),
   keys: [8, 16],
   mode: "any",
  },
  "zen mode": {
   fn: (): void => setZenMode(zm => !zm),
   keys: [16, 70],
   mode: "canvas",
  },
  "log notes": {
   fn: (): void => console.log(elements),
   keys: [16, 69],
   mode: "any",
  },
  paste: { fn: paste, keys: ["meta", 86], mode: "any" },
  "activate note mode": {
   fn: (): void => setNoteMode(nm => !nm),
   keys: [78],
   mode: "canvas",
  },

  // NOTES (commands that rely on an InfiniteCanvas component's state reside in the component!)
  // TODO add octave offset to inputNote so that k and l are notes too
  "decrease octave": {
   fn: (): void => setOctave(o => (o > 1 ? o - 1 : o)),
   keys: [90],
   mode: "notes",
  },
  "increase octave": {
   fn: (): void => setOctave(o => (o < 8 ? o + 1 : o)),
   keys: [88],
   mode: "notes",
  },
  "deactivate note mode": {
   fn: (): void => setNoteMode(nm => !nm),
   keys: [78],
   mode: "notes",
  },

  // ANY
  "deselect all": {
   fn: (): void => {
    if (document.activeElement instanceof HTMLElement)
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
    document.activeElement &&
    (["TEXTAREA", "INPUT"].includes(document.activeElement.tagName) ||
     document.activeElement.getAttribute("contenteditable") === "true")
   )
    mode = "edit"
   else if (noteMode) mode = "notes"
   const keys = [e.keyCode]
   if (e.shiftKey) keys.push(16)
   if (e.metaKey) keys.push("meta")

   if (e.keyCode === 27) {
    setNoteMode(false)
    setZoomMode(0)
   }

   // let's get out of zoom mode if we're in it and it's not a zoom event
   if (!keys.includes(90) && !keys.includes(32)) setZoomMode(0)

   for (const key of Object.keys(commands)) {
    const command = commands[key]
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
      if (document.activeElement instanceof HTMLElement)
       document.activeElement.blur()
     }
   }
  },
  [commands, noteMode]
 )

 const onMouseMove = useCallback(
  ({ x, y }: MouseEvent) => {
   rawMouseX = x
   rawMouseY = y
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
  [translate, zoom]
 )

 {
  /* LIFECYCLE */
 }

 // synth initialization
 useEffect(() => {
  const initializeSynth = async (): Promise<void> => {
   const sampler = await new Sampler(SAMPLER_FILES).toMaster()
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

  return (): void => {
   if (window === undefined) return
   window.removeEventListener("keydown", onKeyDown, false)
   window.removeEventListener("mousemove", onMouseMove, false)
  }
 }, [onKeyDown, onMouseMove, mouse, translate, elements])

 {
  /* RENDER */
 }
 return (
  <>
   <ComposeContext.Provider
    value={{
     zoom,
     translate,
     elements,
     setElements,
     zoomMode,
     duplicateElement,
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
     setNoteMode,
    }}
   >
    <div
     onWheel={e => {
      e.preventDefault()
      //e.stopPropagation()
      if (e.shiftKey) {
       const dy = e.deltaY
       setZoom(z => {
        return { ...z, scale: z.scale + dy * 0.01 * z.scale }
       })
      } else {
       const dx = e.deltaX / zoom.scale
       const dy = e.deltaY / zoom.scale
       setTranslate(translate => ({
        x: translate.x - dx,
        y: translate.y - dy,
       }))
      }
      wheeling = true
      if (wheelTimeout) clearTimeout(wheelTimeout)
      wheelTimeout = setTimeout(() => {
       wheeling = false
       wheelTimeout = null
       // trigger a rerender
       setTick(m => !m)
      }, 200)
     }}
     onClick={e => {
      if (zoomMode === 1) zoomIn()
      if (zoomMode === -1) zoomOut()
      if (zoomMode !== 0) e.preventDefault()
      setElements(
       elements => elements.map(elem => ({ ...elem, selected: false })),
       "c524"
      )
     }}
     style={{
      overflowX: "hidden",
      overflowY: "hidden",
      cursor: ((): string => {
       if (zoomMode === 1) return "zoom-in"
       if (zoomMode === 0) {
        if (!empty(dragging)) return "all-scroll"
       }
       if (zoomMode === -1) return "zoom-out"
       return "default"
      })(),
     }}
     onMouseUp={e => {
      if (!empty(dragging)) {
       const shift = (orig: number, by: number): number => {
        return orig + by / zoom.scale
       }
       const cp = dragging
       setElements(
        es =>
         es.map(elem => {
          return elem.id == cp.id
           ? {
            ...elem,
            selected: true,
            x: shift(elem.x, e.pageX - cp.x),
            y: shift(elem.y, e.pageY - cp.y),
           }
           : elem
         }),
        "c546"
       )
       e.persist()
       dragging = null
      }
     }}
    >
     <OverlayUI
      translate={translate}
      setElements={setElements}
      setTranslate={setTranslate}
      setZoom={setZoom}
      setShowHelp={setShowHelp}
      saveCanvas={saveCanvas}
      elements={elements}
      navigateRight={navigateRight}
      navigateUp={navigateUp}
      navigateDown={navigateDown}
      navigateLeft={navigateLeft}
     />

     {showHelp ? <HelpMenu commands={commands} /> : null}

     <div
      style={{
       overflowY: "hidden",
       width: "100vw",
       height: "100vh",
      }}
     >
      {elements.map(({ component, ...props }) => (
       <ComposeContext.Consumer key={`consumer-${props.id}`}>
        {(context): ReactElement =>
         React.createElement(component, { ...props, context }, null)
        }
       </ComposeContext.Consumer>
      ))}
     </div>
    </div>
   </ComposeContext.Provider>
   {!empty(dragging) ? (
    <>
     <svg
      style={{
       position: "fixed",
       width: "100vw",
       height: "100vh",
       top: 0,
       left: 0,
       zIndex: -2000,
      }}
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      xmlns="http://www.w3.org/2000/svg"
     >
      <line
       x1={dragging.x}
       x2={rawMouseX}
       y1={dragging.y}
       y2={rawMouseY}
       stroke="#999999"
       style={{ zIndex: 2000 }}
      />
     </svg>
    </>
   ) : null}
  </>
 )
}

export default Compose
