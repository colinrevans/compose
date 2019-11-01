import React, { useState, useCallback } from "react"
import { Youtube } from "../embeds"
import { viewport } from "../../lib/infinite-util.js"
import { dragging, wheeling } from "../../pages/compose"
import {
  HoverButtons,
  Crosshair,
  selection,
  shouldHide,
  inspectorForElement,
} from "./common"

const InfiniteYoutube = ({ context, scale, x, y, id, selected, ...save }) => {
  const { viewportX, viewportY } = viewport(x, y, context)

  const [isHovering, setIsHovering] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [options, setOptions] = useState(
    save.options
      ? save.options
      : {
          scale: 1 / scale,
          src: "",
        }
  )

  const pushStateToCanvas = useCallback(
    opts => {
      context.saveElement(id, { options: opts ? opts : options })
    },
    [id, context, options]
  )

  const onClick = e => selection(e, id, context, selected)

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
        scale={scale}
        context={context}
        hovering={isHovering}
        setHovering={setIsHovering}
        dragging={dragging}
        viewportX={viewportX}
        viewportY={viewportY}
        adjustX={20}
        adjustY={20}
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
        onMouseEnter={e => setIsHovering(true)}
        onMouseLeave={e => setIsHovering(false)}
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
