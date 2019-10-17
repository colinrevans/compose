import React from "react"
import { fontFamily } from "./theme"

const H4 = ({ children, style }) => (
  <h4 style={{ fontFamily, fontSize: 13, ...style }}>{children}</h4>
)

export default H4
