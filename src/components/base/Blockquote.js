import React from "react"

const Blockquote = ({ children, style }) => (
  <blockquote
    style={{
      fontSize: 13,
      fontStyle: "italic",
      fontFamily: "georgia",
      lineHeight: "1.4em",
      ...style,
    }}
  >
    {children}
  </blockquote>
)

export default Blockquote
