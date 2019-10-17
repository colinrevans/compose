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
        cursor: "pointer",
        fontSize: 8,
        zIndex: 100,
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

export const shouldHide = (id, context) =>
  context.zenMode && context.lastInteractedElemId !== id
