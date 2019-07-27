import React, { useEffect, useState, useCallback } from "react"
import { Link } from "gatsby"
import { Vexflow } from "../components/vexflow-components.js"
import Button from "@material-ui/core/Button"
import { equals } from "ramda"
import { Spotify, Youtube } from "../components/embeds"
import keycode from "keycode"
import empty from "is-empty"

const ComposeContext = React.createContext({})

// idCount is never reset to zero. Every element gets a unique id.
// the most recent element is always the one with the highest id.
let idCount = 0

const Compose = () => {
  const [mouse, setMouse] = useState({ x: 100, y: 100 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState({ scale: 1 })
  const [elements, setElements] = useState([])
  const [showHelp, setShowHelp] = useState(false)
  // 1 is zoom in, -1 is zoom out, 0 is reg
  const [zoomMode, setZoomMode] = useState(0)

  {
    /* FUNCTIONS FOR COMMANDS */
  }

  const createElement = component => {
    setElements(elements => [
      ...elements,
      {
        x: mouse.x,
        y: mouse.y,
        scale: zoom.scale,
        id: idCount,
        component,
      },
    ])
    idCount += 1
  }

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

  const zoomIn = () =>
    setZoom(zoom => ({
      scale: zoom.scale + 0.5 * zoom.scale,
    }))
  const zoomOut = () =>
    setZoom(zoom => ({
      scale: zoom.scale - 0.5 * zoom.scale,
    }))

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
    'show help': { fn: (() => setShowHelp(prev => !prev)), keys: [16, 191], mode: 'noedit'},
    'move left': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x + 150 / zoom.scale}))),
                   keys: [65], mode: 'noedit'},
    'move up': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y + 150 / zoom.scale}))),
                 keys: [87], mode: 'noedit'},
    'move right': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x - 150 / zoom.scale}))),
                    keys: [68], mode: 'noedit'},
    'move down': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y - 150 / zoom.scale}))),
                   keys: [83], mode: 'noedit'},
    'unfocus all': { fn: (() => document.activeElement.blur()), keys: [27], mode: 'any'},
    'zoom in mode': { fn: (() => setZoomMode(zm => zm !== 1 ? 1 : 0)), keys: [90], mode: 'noedit'},
    'zoom out mode': { fn: (() => setZoomMode(zm => zm !== -1 ? -1 : 0)), keys: [16, 90], mode: 'noedit'}
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
        document.activeElement.tagName !== "TEXTAREA" ? "noedit" : "edit"
      let keys = [e.keyCode]
      if (e.shiftKey) keys.push(16)

      // let's get out of zoom mode if we're in it and it's not a zoom event
      if (!keys.includes(90)) setZoomMode(0)

      for (let key of Object.keys(commands)) {
        let command = commands[key]
        if (equals(new Set(keys), new Set(command.keys)))
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
      value={{ zoom, translate, elements, setElements, zoomMode }}
    >
      <div
        onWheel={e => {
          e.preventDefault()
          e.stopPropagation()
          let dx = e.deltaX / zoom.scale
          let dy = e.deltaY / zoom.scale
          setTranslate(translate => ({
            x: translate.x - dx,
            y: translate.y - dy,
          }))
        }}
        onClick={e => {
          if (zoomMode === 1) zoomIn()
          if (zoomMode === -1) zoomOut()
          if (zoomMode !== 0) e.preventDefault()
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
          ({Math.round(-1 * translate.x)}, {Math.round(-1 * translate.y)}) x
          {Math.round(zoom.scale * 100) / 100}
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

        {/* NAVIGATION */}
        <Button
          style={{ position: "fixed", bottom: "50vh", left: 5, color: "grey" }}
          onClick={navigateLeft}
        >
          ⟵
        </Button>
        <Button
          style={{ position: "fixed", bottom: "50vh", right: 5, color: "grey" }}
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
          <p
            style={{
              position: "fixed",
              backgroundColor: "white",
              right: "40vw",
              top: "10vh",
              color: "grey",
              fontFamily: "sans-serif",
              fontSize: "80%",
              zIndex: 2,
            }}
          >
            keys
            <br />
            <br />
            {Object.keys(commands).map(commandName => {
              let command = commands[commandName]
              return (
                <>
                  {commandName}:{" "}
                  {command.keys.map(keyCode => keycode(keyCode) + " ")}
                  <br />
                </>
              )
            })}
          </p>
        ) : null}

        <Link
          to="/"
          style={{
            position: "fixed",
            top: 80,
            left: 20,
            color: "#ededed",
            textDecoration: "none",
            fontFamily: "sans-serif",
          }}
        >
          home
        </Link>
        <div
          style={{
            width: "100vw",
            height: "100vh",
          }}
        >
          {elements.map(({ x, y, scale, component, id }) => (
            <ComposeContext.Consumer key={`consumer-${id}`}>
              {context =>
                React.createElement(
                  component,
                  { x, y, context, scale, id },
                  null
                )
              }
            </ComposeContext.Consumer>
          ))}
        </div>
      </div>
    </ComposeContext.Provider>
  )
}

export default Compose

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

const InfiniteYoutube = ({ context, scale, x, y, id, src }) => {
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <Youtube
      style={{
        position: "fixed",
        top: viewportY - 100,
        left: viewportX - 150,
        transform: `scale(${context.zoom.scale / scale})`,
      }}
      src={src}
      id={`youtube-${id}`}
    />
  )
}

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

const InfiniteVexflow = ({ context, scale, x, y, id }) => {
  const [selected, setSelected] = useState(false)

  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <div
      style={{
        position: "fixed",
        top: viewportY - 75 - (selected ? 1 : 0),
        left: viewportX - 150 - (selected ? 1 : 0),
        transform: `scale(${context.zoom.scale / scale})`,
        border: `${selected ? "1px dotted grey" : ""}`,
      }}
      onClick={() => {
        if (!context.zoomMode) setSelected(selected => !selected)
      }}
    >
      {selected ? (
        <span
          style={{
            position: "absolute",
            right: 1,
            top: -7,
            fontFamily: "sans-serif",
          }}
          onClick={e => {
            context.setElements(elements =>
              elements.filter(elem => elem.id !== id)
            )
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          x
        </span>
      ) : null}
      <Vexflow name={`vex-${id}`} easyscore={"G#4/w"} />
    </div>
  )
}

const InfiniteTextArea = props => {
  const { viewportX, viewportY } = getViewportCoordinates(
    props.x,
    props.y,
    props.context.translate,
    props.context.zoom
  )

  return (
    <div id={`textarea-container-${props.id}`}>
      <MyTextField
        {...props}
        style={{
          ...props.style,
          position: "fixed",
          top: viewportY - 19,
          left: viewportX - 80,
          transform: `scale(${props.context.zoom.scale / props.scale})`,
          border: "1px solid #ededed",
          minHeight: "30px",
          minWidth: "70px",
        }}
        idx={props.id}
      />
    </div>
  )
}

const MyTextField = props => {
  const [text, setText] = useState("")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    document.getElementById(`textarea-${props.id}`).focus()
  }, [])

  const onChange = event => {
    const field = event.target

    //auto-expand so there isn't a vertical scrollbar
    let computed = window.getComputedStyle(field)
    let height =
      parseInt(computed.getPropertyValue("border-top-width"), 10) +
      field.scrollHeight +
      parseInt(computed.getPropertyValue("border-bottom-width"), 10)
    field.style.height = height + "px"

    setText(event.target.value)
  }

  return (
    <>
      <textarea
        {...props}
        style={{
          fontSize: "80%",
          fontFamily: "georgia",
          ...props.style,
          border: `1px solid ${
            empty(text) ? "grey" : hovering ? "#ededed" : "white"
          }`,
          lineHeight: "120%",
          zIndex: 1,
        }}
        id={`textarea-${props.id}`}
        value={text}
        onChange={onChange}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />
    </>
  )
}
