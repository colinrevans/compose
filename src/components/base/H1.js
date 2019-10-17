import React from "react"
import { fontFamily } from "./theme"

const H1 = ({ children, style }) => (
  <h1 style={{ fontFamily, fontSize: 16, ...style }}>{children}</h1>
)

export default H1
