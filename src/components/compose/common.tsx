import React from "react"
import {
 setElementPropertyById,
 deleteElementById,
 selectElementAndDeselectRest,
} from "../../lib/infinite-util"
import Inspector from "./inspector"
import { options } from "./common"
import { setDragging, draggingType } from "../../pages/compose"

export interface InfiniteComponentProps {
 context: any
 x: number
 y: number
 id: number
 selected: boolean
 scale: number
}

export interface options {
 [key: string]: string | boolean | number
}

export const selection = (
 e: MouseEvent,
 id: number,
 context: any,
 selected: boolean
) => {
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

export const inspectorForElement = <T extends options>(
 id: number,
 context: any,
 selected: boolean,
 options: T,
 setOptions: React.Dispatch<React.SetStateAction<T>>,
 pushStateToCanvas: (opts?: T) => void
) => {
 return id === context.lastInteractedElemId &&
  context.inspecting &&
  selected ? (
   <Inspector
    options={options}
    setOptions={setOptions}
    pushState={pushStateToCanvas}
   />
  ) : null
}

interface HoverButtonProps {
 id: number
 context: any
 style: any
}

export const DeleteButton = (props: HoverButtonProps) => {
 let {
  id,
  context,
  style,
  ...rest
 }: { id: number; context: any; style: any } = props
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

export const MoveButton = (props: HoverButtonProps) => {
 let {
  id,
  context,
  style,
  ...rest
 }: { id: number; context: any; style: any } = props
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
   {...rest}
  >
   m
    </span>
 )
}

interface HoverButtonsProps {
 id: number
 context: any
 selected: boolean
 hovering: boolean
 setHovering: React.Dispatch<React.SetStateAction<boolean>>
 dragging: draggingType | null
 mouseDown?: boolean
 viewportX: number
 viewportY: number
 options: any
 adjustX?: number
 adjustY?: number
}
export const HoverButtons = (props: HoverButtonsProps) => {
 let {
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
 } = props

 if (!adjustX) {
  adjustX = 0
 }
 if (!adjustY) {
  adjustY = 0
 }
 const scaled = (n: number) => n * context.zoom.scale * options.scale
 return (
  <>
   <div
    style={{
     position: "fixed",
     left: viewportX - scaled(12) + scaled(adjustX),
     top: viewportY - scaled(5) + scaled(adjustY),
     width: scaled(12),
     height: scaled(30),
     color: "#999999",
     zIndex: 1,
    }}
    onMouseEnter={() => setHovering(true)}
    onMouseLeave={() => setHovering(false)}
   >
    {hovering ||
     selected ||
     (dragging && dragging.id === id) ||
     mouseDown ? (
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

interface CrosshairProps {
 x: number
 y: number
 scale: number
 adjustX?: number
 adjustY?: number
}

export const Crosshair = (props: CrosshairProps) => {
 let { x, y, scale, adjustX, adjustY } = props
 if (adjustX) x += adjustX * scale
 if (adjustY) y += adjustY * scale
 return (
  <>
   <div
    style={{
     width: Math.max(1, 1 * scale),
     height: Math.max(1, 11 * scale),
     position: "fixed",
     top: y,
     left: x + 5 * scale,
     backgroundColor: "black",
    }}
   />
   <div
    style={{
     width: Math.max(1, 11 * scale),
     height: Math.max(1, 1 * scale),
     position: "fixed",
     top: y + 5 * scale,
     left: x,
     backgroundColor: "black",
    }}
   />
  </>
 )
}

export const shouldHide = (id: number, context: any) =>
 context.zenMode && context.lastInteractedElemId !== id
