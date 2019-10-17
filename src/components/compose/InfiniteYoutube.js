import React, { useState } from "react"
import { Youtube } from "../embeds"
import {
  getViewportCoordinates,
  setElementPropertyById,
  deleteElementById,
} from "../../lib/infinite-util.js"
import { inspectorForElement } from "./common"

const InfiniteYoutube = ({ context, scale, x, y, id, selected, ...props }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({ src: props.src ? props.src : "" })
  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <>
      {inspectorForElement(id, context, selected, options, setOptions)}

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
        onMouseEnter={e => setIsHovering(true)}
        onMouseLeave={e => setIsHovering(false)}
      >
        {isHovering ? (
          <div
            style={{
              position: "absolute",
              width: 10,
              height: 20,
              top: 5,
              right: 5,
              color: "black",
            }}
            onClick={e => {
              if (!context.zoomMode) {
                e.stopPropagation()
                if (selected && !context.inspecting)
                  setElementPropertyById(id, context, "selected", false)
                if (selected && context.inspecting)
                  context.setLastInteractedElemId(id)
                if (!selected) {
                  setElementPropertyById(id, context, "selected", true)
                  context.setLastInteractedElemId(id)
                }
              }
            }}
          >
            <span
              onClick={e => {
                deleteElementById(id, context)
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              x
            </span>
          </div>
        ) : null}
        <Youtube
          style={{
            position: "fixed",
            top: 20,
            left: 20,
          }}
          src={options.src}
          id={`youtube-${id}`}
          onLoad={e => setLoaded(true)}
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
