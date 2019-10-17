import React from "react"
import {
  setElementPropertyById,
  selectElementAndDeselectRest,
} from "../../lib/infinite-util"
import Inspector from "./inspector"

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
