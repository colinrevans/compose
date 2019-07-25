import React, { useEffect, useState, useCallback, useRef } from "react"
import { Link } from "gatsby"
import { Vexflow } from "../components/vexflow-components.js"
import Button from "@material-ui/core/Button"
import { Spotify, Youtube } from "../components/embeds"
import empty from "is-empty"

const Compose = () => {
  const [mouse, setMouse] = useState({ x: 100, y: 100 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [elements, setElements] = useState([])

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("mousemove", onMouseMove, true)

    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("mousemove", onMouseMove, true)
    }
  }, [onKeyDown, onMouseMove, mouse, translate, elements])

  const onKeyDown = useCallback(
    e => {
      if ([38, 39, 37, 40].includes(e.keyCode)) e.preventDefault()
      // SHIFT SPACE
      if (e.keyCode === 32 && e.shiftKey) {
        setElements(elements => [
          ...elements,
          {
            component: (
              <p x={mouse.x} y={mouse.y}>
                boo
              </p>
            ),
            type: "textarea",
          },
        ])

        e.preventDefault()
      }
      // SHIFT V
      if (e.keyCode === 86 && e.shiftKey) {
        setElements(elements => [
          ...elements,
          {
            component: <Vexflow x={mouse.x} y={mouse.y} />,
            type: "vexflow",
          },
        ])
        e.preventDefault()
        document.activeElement.blur()
      }
      // SHIFT X
      if (e.keyCode === 88 && e.shiftKey) {
        setElements(elements => elements.slice(0, elements.length - 1))
        e.preventDefault()
      }
      // SHIFT Y
      if (e.keyCode === 89 && e.shiftKey) {
        setElements(elements => [
          ...elements,
          {
            component: <Youtube src={"1234"} x={mouse.x} y={mouse.y} />,
            type: "youtube",
          },
        ])
        e.preventDefault()
        document.activeElement.blur()
      }
      // SHIFT I
      if (e.keyCode === 73 && e.shiftKey) {
        setElements(elements => [
          ...elements,
          {
            component: (
              <iframe
                src="https://musicianlookup.netlify.com/voicing-assistant"
                x={mouse.x}
                y={mouse.y}
              />
            ),
            type: "voicing-assistant",
          },
        ])
        e.preventDefault()
        document.activeElement.blur()
      }
      if (e.keyCode === 76 && e.shiftKey) {
        setElements(elements => [
          ...elements,
          {
            component: (
              <iframe
                src="https://musicianlookup.netlify.com/lookup"
                x={mouse.x}
                y={mouse.y}
              />
            ),
            type: "voicing-assistant",
          },
        ])
        e.preventDefault()
        document.activeElement.blur()
      }
      if (e.keyCode === 87 && e.shiftKey) {
        navigateUp()
        e.preventDefault
        document.activeElement.blur()
      }
      if (e.keyCode === 65 && e.shiftKey) {
        navigateLeft()
        e.preventDefault
        document.activeElement.blur()
      }
      if (e.keyCode === 83 && e.shiftKey) {
        navigateDown()
        e.preventDefault
        document.activeElement.blur()
      }
      if (e.keyCode === 68 && e.shiftKey) {
        navigateRight()
        e.preventDefault
        document.activeElement.blur()
      }
      if (e.keyCode === 27) document.activeElement.blur()
      if (e.keyCode === 38)
        setTranslate(translate => ({ ...translate, y: translate.y + 150 }))
      if (e.keyCode === 40)
        setTranslate(translate => ({ ...translate, y: translate.y - 150 }))
      if (e.keyCode === 39)
        setTranslate(translate => ({ ...translate, x: translate.x - 150 }))
      if (e.keyCode === 37)
        setTranslate(translate => ({ ...translate, x: translate.x + 150 }))
    },
    [mouse]
  )

  const onMouseMove = useCallback(
    ({ x, y }) => {
      setMouse({ x: x - translate.x, y: y - translate.y })
    },
    [mouse, translate]
  )

  const navigateRight = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      x: translate.x - window.innerWidth,
    }))
  }, [])

  const navigateLeft = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      x: translate.x + window.innerWidth,
    }))
  }, [])

  const navigateDown = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      y: translate.y - window.innerHeight,
    }))
  }, [])

  const navigateUp = useCallback(() => {
    setTranslate(translate => ({
      ...translate,
      y: translate.y + window.innerHeight,
    }))
  }, [])

  return (
    <div style={{ overflowX: "hidden", overflowY: "hidden" }}>
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
        ({-1 * translate.x}, {-1 * translate.y})
      </span>
      {/* CLEAR */}
      <Button
        style={{ position: "fixed", bottom: 20, left: 20 }}
        onClick={() => {
          setElements([])
        }}
      >
        clear
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
      <p
        style={{
          position: "fixed",
          right: 20,
          top: 20,
          color: "grey",
          fontFamily: "sans-serif",
          fontSize: "80%",
        }}
      >
        keys
        <br />
        arrows to move
        <br />
        shift-WASD to navigate by screen lengths
        <br />
        shift-V for sheet music
        <br />
        shift-SPACE for text
        <br />
        shift-Y for youtube
        <br />
        shift-X to delete last element
      </p>

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
        {elements.map(({ component, type }, idx) => {
          if (type === "textarea")
            return (
              <MyP
                {...component.props}
                translateX={translate.x}
                translateY={translate.y}
                idx={idx}
              />
            )
          if (type === "vexflow")
            return (
              <InfiniteVexflow
                {...component.props}
                translateX={translate.x}
                translateY={translate.y}
                idx={idx}
              />
            )
          if (type === "youtube")
            return (
              <InfiniteYoutube
                {...component.props}
                translateX={translate.x}
                translateY={translate.y}
                idx={idx}
              />
            )
          if (type === "voicing-assistant")
            return (
              <InfiniteVoicingAssistant
                {...component.props}
                translateX={translate.x}
                translateY={translate.y}
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
  return (
    <iframe
      style={{
        position: "fixed",
        top: props.y + props.translateY - 150,
        left: props.x + props.translateX,
        minWidth: 500,
        minHeight: 600,
      }}
      src={props.src}
      id={`voicing-assistant-${props.idx}`}
    />
  )
}

const InfiniteYoutube = props => {
  return (
    <Youtube
      style={{
        position: "fixed",
        top: props.y + props.translateY - 100,
        left: props.x + props.translateX,
      }}
      src={props.src}
      id={`youtube-${props.idx}`}
    />
  )
}

const InfiniteVexflow = props => {
  return (
    <Vexflow
      style={{
        position: "fixed",
        top: props.y + props.translateY - 75,
        left: props.x + props.translateX,
      }}
      name={`vex-${props.idx}`}
      easyscore={"G#4/w"}
    />
  )
}

const MyP = props => {
  return (
    <MyTextField
      style={{
        position: "fixed",
        top: props.y + props.translateY,
        left: props.x + props.translateX,
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
          ...props.style,
          border: `1px solid ${empty(text) || hovering ? "grey" : "white"}`,
          fontSize: "80%",
          lineHeight: "120%",
          fontFamily: "georgia",
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
