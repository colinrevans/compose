import React, { useState, useCallback, useEffect } from "react"
import {
  getViewportCoordinates,
  deleteElementById,
} from "../../lib/infinite-util"
import { inspectorForElement, selection } from "./common"
import { dragging, setDragging } from "../../pages/compose.js"

const InfiniteTextArea = ({ context, id, scale, selected, x, y, ...save }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null
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

  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  const pushStateToCanvas = useCallback(() => {
    context.saveElement(id, { text, bounding, options })
  }, [text, options, bounding])

  useEffect(() => {
    pushStateToCanvas()
  }, [text, bounding])

  const onChange = event => {
    context.setLastInteractedElemId(id)
    setText(event.target.value)
    /*
       const field = event.target
       let computed = window.getComputedStyle(field)
       console.log("began with", computed)
       let height =
       parseInt(computed.getPropertyValue("border-top-width"), 10) +
       field.scrollHeight
       parseInt(computed.getPropertyValue("border-bottom-width"), 10)
       console.log("ended with", height)
       field.style.height = height + "px"
     */
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
          onClick={e => {
            selection(e, id, context, selected)
          }}
          onMouseDown={e => {
            if (e.shiftKey) {
              e.preventDefault()
              document.activeElement.blur()
            }
          }}
          onMouseUp={e => {
            let { width, height } = document
              .getElementById(`textarea-${id}`)
              .getBoundingClientRect()
            width /= context.zoom.scale * options.scale
            height /= context.zoom.scale * options.scale
            setBounding({ width, height })
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        />
      </div>
      {hovering || selected || dragging.id === id ? (
        <>
          <span
            className="noselect"
            style={{
              position: "fixed",
              left: viewportX - 18,
              top: viewportY - 10,
              cursor: "pointer",
              fontSize: 8,
              zIndex: 100,
            }}
            onClick={e => {
              deleteElementById(id, context)
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            x
          </span>
          <span
            className="noselect"
            style={{
              position: "fixed",
              left: viewportX - 18,
              top: viewportY,
              fontSize: 8,
              cursor: "all-scroll",
              zIndex: 100,
            }}
            onMouseDown={e => {
              setDragging({ id, x: e.pageX, y: e.pageY })
            }}
          >
            m
          </span>
        </>
      ) : null}
    </>
  )
}

export default InfiniteTextArea
