import React from "react"
import { fontFamily } from "./theme"

const Li = ({ children, style }) => (
  <li style={{ fontFamily, fontSize: 14, lineHeight: 1.4, ...style }}>
    {children}
  </li>
)

export default Li
