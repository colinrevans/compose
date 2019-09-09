import React from "react"

export const SVGContext = props => {
  return (
    <svg width={props.width} height={props.height}>
      {props.children}
    </svg>
  )
}

export default SVGContext
