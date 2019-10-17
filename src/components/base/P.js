import React from "react"
import { fontFamily } from "./theme"

const P = ({ children, style }) => (
  <p style={{ fontFamily, fontSize: 14, lineHeight: 1.4, ...style }}>
    {children}
  </p>
)

export default P
