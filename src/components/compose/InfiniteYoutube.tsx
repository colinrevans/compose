import React, { useState, useCallback } from "react"
import { Youtube } from "../embeds"
import { viewport } from "../../lib/infinite-util"
import { dragging, wheeling } from "../../pages/compose"
import {
 HoverButtons,
 Crosshair,
 selection,
 shouldHide,
 inspectorForElement,
 InfiniteComponentProps,
 options,
} from "./common"

interface InfiniteYoutubeProps extends InfiniteComponentProps {
 options?: InfiniteYoutubeOptions
}

interface InfiniteYoutubeOptions extends options {
 scale: number
 src: string
}

const InfiniteYoutube = (props: InfiniteYoutubeProps) => {
 const { context, scale, x, y, id, selected, ...save } = props
 const { viewportX, viewportY } = viewport(x, y, context)

 const [isHovering, setIsHovering] = useState(false)
 const [loaded, setLoaded] = useState(false)
 const [options, setOptions] = useState<InfiniteYoutubeOptions>(
  save.options
   ? save.options
   : {
    scale: 1 / scale,
    src: "",
   }
 )

 const pushStateToCanvas = useCallback(
  (opts?: InfiniteYoutubeOptions) => {
   context.saveElement(id, { options: opts ? opts : options })
  },
  [id, context, options]
 )

 const onClick = (e: any) => selection(e, id, context, selected)

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

   <HoverButtons
    id={id}
    context={context}
    hovering={isHovering}
    setHovering={setIsHovering}
    dragging={dragging}
    viewportX={viewportX}
    viewportY={viewportY}
    adjustX={20}
    adjustY={20}
    selected={selected}
    options={options}
   />

   <div
    style={{
     position: "fixed",
     top: viewportY,
     left: viewportX,
     width: 340,
     height: 240,
     transform: `scale(${context.zoom.scale / scale})`,
     transformOrigin: "top left",
    }}
    onMouseEnter={() => setIsHovering(true)}
    onMouseLeave={() => setIsHovering(false)}
    onClick={onClick}
   >
    <Youtube
     style={{
      position: "fixed",
      top: 20,
      left: 20,
     }}
     src={options.src}
     id={`youtube-${id}`}
     onLoad={() => setLoaded(true)}
    />
    {!loaded ? (
     <p
      style={{
       position: "absolute",
       color: "grey",
       fontFamily: "sans-serif",
       top: 100,
       left: 100,
       zIndex: -1,
      }}
     >
      loading
          </p>
    ) : null}
   </div>
  </>
 )
}

export default InfiniteYoutube
