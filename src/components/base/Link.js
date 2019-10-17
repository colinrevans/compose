import React from "react"
import { Link } from "gatsby"
import { fontFamily } from "./theme"

const MyLink = ({ children, style, to, className }) => (
  <Link style={{ fontFamily, ...style }} to={to} className={className}>
    {children}
  </Link>
)

export default MyLink
