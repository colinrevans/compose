import React from "react"
import { fontFamily } from "./theme"

const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily, fontSize: 14, ...style }}>{children}</h2>
)

export default H2
