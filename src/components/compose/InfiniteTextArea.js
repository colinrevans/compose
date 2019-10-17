import React, { useState, useCallback, useEffect } from "react"
import { viewport } from "../../lib/infinite-util"
import { dragging } from "../../pages/compose.js"
import {
  DeleteButton,
  MoveButton,
  inspectorForElement,
  selection,
  shouldHide,
} from "./common"

const InfiniteTextArea = ({ context, id, scale, selected, x, y, ...save }) => {
  if (shouldHide(id, context)) return null
  const { viewportX, viewportY } = viewport(x, y, context)

  const [text, setText] = useState(save.text ? save.text : "")
  const [bounding, setBounding] = useState(
    save.bounding ? save.bounding : { width: 100, height: 70 }
  )
  const [hovering, setHovering] = useState(false)
  const [options, setOptions] = useState({
    scale: 1 / scale,
    color: "black",
    resizable: true,
  })

  const pushStateToCanvas = useCallback(() => {
    context.saveElement(id, { text, bounding, options })
  }, [text, options, bounding])

  useEffect(() => {
    pushStateToCanvas()
  }, [text, bounding])

  const onChange = event => {
    context.setLastInteractedElemId(id)
    setText(event.target.value)
  }

  const onClick = e => selection(e, id, context, selected)

  const onMouseDown = e => {
    if (e.shiftKey) {
      e.preventDefault()
      document.activeElement.blur()
    }
  }

  const onMouseUp = e => {
    let { width, height } = document
      .getElementById(`textarea-${id}`)
      .getBoundingClientRect()
    width /= context.zoom.scale * options.scale
    height /= context.zoom.scale * options.scale
    setBounding({ width, height })
  }

  return (
    <>
      {inspectorForElement(id, context, selected, options, setOptions)}
      <div
        style={{
          position: "fixed",
          fontFamily: "georgia",
          backgroundColor: "transparent",
          top: viewportY,
          left: viewportX,
          overflow: "visible",
        }}
        id={`textarea-container-${id}`}
      >
        <textarea
          style={{
            cursor: (() => {
              const zm = context.zoomMode
              if (zm === 1) return "zoom-in"
              if (zm === -1) return "zoom-out"
              if (zm === 0) return "text"
            })(),
            resize: options.resizable ? "both" : "none",
            marginBottom: 0,
            border: `1px solid ${hovering || selected ? "grey" : "white"}`,
            width: bounding.width,
            height: bounding.height,
            color: options.color,
            lineHeight: "1.1em",
            fontSize: 14,
            transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
            transformOrigin: "top left",
            padding: 0,
          }}
          id={`textarea-${id}`}
          value={text}
          onChange={onChange}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        />
      </div>
      {hovering || selected || dragging.id === id ? (
        <>
          <DeleteButton
            id={id}
            context={context}
            style={{ left: viewportX - 18, top: viewportY - 10 }}
          />
          <MoveButton
            id={id}
            context={context}
            style={{ left: viewportX - 18, top: viewportY }}
          />
        </>
      ) : null}
    </>
  )
}

export default InfiniteTextArea
