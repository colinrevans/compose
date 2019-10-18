import React from "react"
import {
  setElementPropertyById,
  deleteElementById,
  selectElementAndDeselectRest,
} from "../../lib/infinite-util"
import Inspector from "./inspector"
import { setDragging } from "../../pages/compose"

export const selection = (e, id, context, selected) => {
  if (!context.zoomMode) {
    e.stopPropagation()
    if (selected && !context.inspecting)
      setElementPropertyById(id, context, "selected", false)
    if (selected && context.inspecting) context.setLastInteractedElemId(id)
    if (!selected) {
      if (e.shiftKey) setElementPropertyById(id, context, "selected", true)
      else selectElementAndDeselectRest(id, context)
      context.setLastInteractedElemId(id)
    }
  }
}

export const inspectorForElement = (
  id,
  context,
  selected,
  options,
  setOptions
) => {
  return id === context.lastInteractedElemId &&
    context.inspecting &&
    selected ? (
    <Inspector options={options} setOptions={setOptions} />
  ) : null
}

export const DeleteButton = ({ id, context, style, ...rest }) => {
  return (
    <span
      className="noselect"
      style={{
        position: "fixed",
        cursor: "pointer",
        fontSize: 8,
        zIndex: 100,
        lineHeight: "1em",
        transformOrigin: "top left",
        ...style,
      }}
      onClick={e => {
        deleteElementById(id, context)
        e.preventDefault()
        e.stopPropagation()
      }}
      {...rest}
    >
      x
    </span>
  )
}

export const MoveButton = ({ id, context, style, ...rest }) => {
  return (
    <span
      className="noselect"
      style={{
        position: "fixed",
        cursor: "all-scroll",
        fontSize: 8,
        zIndex: 100,
        lineHeight: "1em",
        transformOrigin: "top left",
        ...style,
      }}
      onMouseDown={e => {
        setDragging({ id, x: e.pageX, y: e.pageY })
      }}
    >
      m
    </span>
  )
}

export const HoverButtons = ({
  id,
  context,
  selected,
  hovering,
  setHovering,
  dragging,
  mouseDown,
  viewportX,
  viewportY,
  options,
  adjustX,
  adjustY,
}) => {
  if (!adjustX) {
    adjustX = 0
  }
  if (!adjustY) {
    adjustY = 0
  }
  const scaled = n => n * context.zoom.scale * options.scale
  return (
    <>
      <div
        style={{
          position: "fixed",
          left: viewportX - scaled(12) + scaled(adjustX),
          top: viewportY - scaled(5) + scaled(adjustY),
          width: scaled(12),
          height: scaled(30),
          zIndex: 1,
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {hovering || selected || dragging.id === id || mouseDown ? (
          <>
            <DeleteButton
              id={id}
              context={context}
              style={{
                left:
                  viewportX -
                  12 * context.zoom.scale * options.scale +
                  scaled(adjustX),
                top:
                  viewportY -
                  0 * context.zoom.scale * options.scale +
                  scaled(adjustY),
                transform: `scale(${context.zoom.scale * options.scale})`,
              }}
            />
            <MoveButton
              id={id}
              context={context}
              style={{
                left:
                  viewportX -
                  12 * context.zoom.scale * options.scale +
                  scaled(adjustX),
                top:
                  viewportY +
                  10 * context.zoom.scale * options.scale +
                  scaled(adjustY),
                transform: `scale(${context.zoom.scale * options.scale})`,
              }}
            />
          </>
        ) : null}
      </div>
    </>
  )
}

export const shouldHide = (id, context) =>
  context.zenMode && context.lastInteractedElemId !== id
