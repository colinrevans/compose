import React from "react"
import { fontFamily } from "./theme"

const H3 = ({ children, style }) => (
  <h3 style={{ fontFamily, fontSize: 13, ...style }}>{children}</h3>
)

export default H3
