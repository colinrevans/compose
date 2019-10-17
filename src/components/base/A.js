import React from "react"

const A = props => (
  <a style={props.style} href={props.href} target="noopener noreferer">
    {props.children}
  </a>
)

export default A
