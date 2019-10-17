import React from "react"
import { Link } from "gatsby"
import H1 from "./H1"

const Breadcrumb = ({ children, style, to, br }) => (
  <H1 style={style}>
    <Link
      className="underline-hover"
      style={{ textDecoration: "none", color: to ? "#CCCCCC" : "grey" }}
      to="/"
    >
      home
    </Link>
    {" / "}
    {to && br ? (
      <>
        <Link
          className="underline-hover"
          style={{ textDecoration: "none", color: "grey" }}
          to={to}
        >
          {br}
        </Link>
        {" / "}
      </>
    ) : null}
    {children}
  </H1>
)

export default Breadcrumb
