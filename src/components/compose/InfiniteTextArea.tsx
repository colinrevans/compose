import React, { useState, useCallback, useEffect } from "react"
import { viewport } from "../../lib/infinite-util"
import { dragging, wheeling } from "../../pages/compose"
import { clone } from "ramda"
import {
 HoverButtons,
 inspectorForElement,
 selection,
 shouldHide,
 options,
 InfiniteComponentProps,
} from "./common"

interface InfiniteTextAreaProps extends InfiniteComponentProps {
 options?: InfiniteTextAreaOptions
 bounding: { width: number; height: number }
 text: string
}

interface InfiniteTextAreaOptions extends options {
 scale: number
 color: string
 resizable: boolean
}

const defaultOptions = {
 scale: 1,
 color: "black",
 resizable: true,
}

let mouseDown = false

const InfiniteTextArea = (props: InfiniteTextAreaProps) => {
 let { context, id, scale, selected, x, y, ...save } = props
 const { viewportX, viewportY } = viewport(x, y, context)

 const [text, setText] = useState(save.text ? save.text : "")
 const [bounding, setBounding] = useState(
  save.bounding ? save.bounding : { width: 100, height: 70 }
 )
 const [hovering, setHovering] = useState(false)
 const [options, setOptions] = useState(
  save.options
   ? save.options
   : {
    ...defaultOptions,
    scale: 1 / scale,
   }
 )

 const pushStateToCanvas = useCallback(
  (opts?: InfiniteTextAreaOptions) => {
   context.saveElement(id, {
    text,
    bounding,
    options: opts ? opts : options,
   })
   console.log("saved with ", clone(opts ? opts : options), "id", id)
  },
  [id, context, text, options, bounding]
 )

 useEffect(() => {
  if (!(text === save.text)) pushStateToCanvas()
 }, [text, bounding])

 const onChange = useCallback(
  event => {
   context.setLastInteractedElemId(id)
   setText(event.target.value)
  },
  [context, id]
 )

 const onClick = useCallback(e => selection(e, id, context, selected), [
  id,
  context,
  selected,
 ])

 const onMouseDown = useCallback(e => {
  mouseDown = true
  if (e.shiftKey) {
   e.preventDefault()
   if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur()
  }
 }, [])

 const onMouseUp = useCallback(() => {
  mouseDown = false
  const elem = document.getElementById(`textarea-${id}`)
  if (elem) {
   let { width, height } = elem.getBoundingClientRect()
   width /= context.zoom.scale * options.scale
   height /= context.zoom.scale * options.scale
   setBounding({ width, height })
  }
 }, [id, context, options])

 const scaled = useCallback(n => n * context.zoom.scale * options.scale, [
  context.zoom.scale,
  options.scale,
 ])

 if (shouldHide(id, context)) return null

 return (
  <>
   {inspectorForElement(
    id,
    context,
    selected,
    options,
    setOptions,
    pushStateToCanvas
   )}
   <div
    style={{
     position: "fixed",
     fontFamily: "georgia",
     backgroundColor: "transparent",
     top: viewportY,
     left: viewportX,
     overflow: "visible",
     zIndex: 1,
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
      border: `1px solid ${
       hovering || selected || (dragging && dragging.id === id)
        ? "grey"
        : "transparent"
       }`,
      width: bounding.width,
      height: bounding.height,
      backgroundColor: "transparent",
      color: options.color,
      lineHeight: "1.1em",
      fontSize: 14,
      transform: `scale(${context.zoom.scale / (1 / options.scale)})`,
      transformOrigin: "top left",
      padding: 1,
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
   <HoverButtons
    id={id}
    context={context}
    selected={selected}
    hovering={hovering}
    setHovering={setHovering}
    dragging={dragging}
    mouseDown={mouseDown}
    viewportX={viewportX}
    viewportY={viewportY}
    options={options}
   />
   {/*
          <div
          style={{
          position: "fixed",
          left: viewportX - scaled(12),
          top: viewportY,
          width: scaled(12),
          height: scaled(20),
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
          left: viewportX - 12 * context.zoom.scale * options.scale,
          top: viewportY - 0 * context.zoom.scale * options.scale,
          transform: `scale(${context.zoom.scale * options.scale})`,
          }}
          />
          <MoveButton
          id={id}
          context={context}
          style={{
          left: viewportX - 12 * context.zoom.scale * options.scale,
          top: viewportY + 10 * context.zoom.scale * options.scale,
          transform: `scale(${context.zoom.scale * options.scale})`,
          }}
          />
          </>
          ) : null}
          </div>
        */}
  </>
 )
}

export default InfiniteTextArea
