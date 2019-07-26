import React, { useEffect, useState, useCallback, useRef } from "react"
import { Link } from "gatsby"
import { Vexflow } from "../components/vexflow-components.js"
import Button from "@material-ui/core/Button"
import { equals } from "ramda"
import { Spotify, Youtube } from "../components/embeds"
import keycode from "keycode"
import empty from "is-empty"

const Compose = () => {
  const [mouse, setMouse] = useState({ x: 100, y: 100 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState({ scale: 1 })
  const [elements, setElements] = useState([])
  const [showHelp, setShowHelp] = useState(false)

  {
    /* FUNCTIONS FOR COMMANDS */
  }

  const createElement = type => {
    setElements(elements => [
      ...elements,
      {
        type,
        x: mouse.x,
        y: mouse.y,
        scaleDuringCreation: zoom.scale,
      },
    ])
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
    'zoom in': { fn: zoomIn, keys: [73, 16], mode: 'any' },
    'zoom out': { fn: zoomOut, keys: [79, 16], mode: 'any' },
    'clear': { fn: (() => setElements([])), keys: [16, 67],  mode: 'noedit'},
    'delete last': { fn: () => setElements(elements => elements.slice(0, elements.length - 1)),
                     keys: [16, 88], mode: 'noedit'},
    'create text field': { fn: (() => createElement('textfield')), keys: [16, 32],  mode: 'any'},
    'create score': { fn: (() => createElement('vexflow')), keys: [16, 86],  mode: 'any'},
    'create youtube embed': { fn: (() => createElement('youtube')), keys: [16, 89],  mode: 'any'},
    'create title': { fn: (() => createElement('title')), keys: [16, 84], mode: 'any'},
    'show help': { fn: (() => setShowHelp(prev => !prev)), keys: [16, 191], mode: 'noedit'},
    'move left': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x + 150 / zoom.scale}))),
                   keys: [65], mode: 'noedit'},
    'move up': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y + 150 / zoom.scale}))),
                 keys: [87], mode: 'noedit'},
    'move right': { fn: (() => setTranslate(cur => ({ ...cur, x: cur.x - 150 / zoom.scale}))),
                    keys: [68], mode: 'noedit'},
    'move down': { fn: (() => setTranslate(cur => ({ ...cur, y: cur.y - 150 / zoom.scale}))),
                   keys: [83], mode: 'noedit'},
    'unfocus all': { fn: (() => document.activeElement.blur()), keys: [27], mode: 'any'}

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
      style={{ overflowX: "hidden", overflowY: "hidden" }}
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
        ({-1 * translate.x}, {-1 * translate.y}) x{zoom.scale}
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
        {elements.map(({ x, y, scaleDuringCreation: scale, type }, idx) => {
          if (type === "textarea")
            return <MyP x={x} y={y} globalZoom={zoom} idx={idx} />
          if (type === "title")
            return (
              <MyP
                style={{
                  fontSize: "130%",
                  fontFamily: "helvetica",
                }}
                x={x}
                y={y}
                scale={scale}
                globalZoom={zoom}
                idx={idx}
              />
            )
          if (type === "vexflow")
            return (
              <InfiniteVexflow
                x={x}
                y={y}
                scale={scale}
                globalZoom={zoom}
                idx={idx}
                globalTranslate={translate}
              />
            )
          if (type === "youtube")
            return (
              <InfiniteYoutube
                x={x}
                y={y}
                scale={scale}
                globalZoom={zoom}
                idx={idx}
              />
            )
          if (type === "voicing-assistant")
            return (
              <InfiniteVoicingAssistant
                x={x}
                y={y}
                scale={scale}
                globalZoom={zoom}
                idx={idx}
              />
            )
        })}
      </div>
    </div>
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

const InfiniteYoutube = props => {
  let zoom = props.zoom + props.globalZoom
  if (zoom < -1) zoom = -1
  return (
    <Youtube
      style={{
        position: "fixed",
        top: props.y + props.translateY - 100,
        left: props.x + props.translateX,
        transform: `scale(${zoom})`,
      }}
      src={props.src}
      id={`youtube-${props.idx}`}
    />
  )
}

const InfiniteVexflow = ({ globalZoom, scale, globalTranslate, x, y, idx }) => {
  let scaledX = globalZoom.scale * x
  let scaledY = globalZoom.scale * y
  let scaledTopLeftX = globalZoom.scale * globalTranslate.x * -1
  let scaledTopLeftY = globalZoom.scale * globalTranslate.y * -1
  let viewportCenterX =
    scaledTopLeftX + Math.floor(window.innerWidth / 2) * globalZoom.scale
  let viewportCenterY =
    scaledTopLeftY + Math.floor(window.innerHeight / 2) * globalZoom.scale
  let newDiffXFromCenter = scaledX - viewportCenterX
  let newDiffYFromCenter = scaledY - viewportCenterY
  let viewportX = newDiffXFromCenter + window.innerWidth / 2
  let viewportY = newDiffYFromCenter + window.innerHeight / 2

  return (
    <Vexflow
      style={{
        position: "fixed",
        top: viewportY - 75,
        left: viewportX - 150,
        transform: `scale(${globalZoom.scale / scale})`,
      }}
      name={`vex-${idx}`}
      easyscore={"G#4/w"}
    />
  )
}

const MyP = props => {
  let zoom = props.zoom + props.globalZoom
  if (zoom < -1) zoom = -1

  return (
    <MyTextField
      style={{
        ...props.style,
        position: "fixed",
        top: props.y + props.translateY,
        left: props.x + props.translateX,
        transform: `scale(${zoom})`,
        border: "1px solid #ededed",
        minHeight: "30px",
        minWidth: "70px",
      }}
      idx={props.idx}
    />
  )
}

const MyTextField = props => {
  const [text, setText] = useState("")
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    document.getElementById(`textarea-${props.idx}`).focus()
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
        id={`textarea-${props.idx}`}
        value={text}
        onChange={onChange}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />
    </>
  )
}
