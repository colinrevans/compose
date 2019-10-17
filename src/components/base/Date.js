import React from "react"

const Date = props => {
  return (
    <span
      style={{
        fontSize: 13,
        fontStyle: "italic",
        color: "#999999",
        ...props.style,
      }}
    >
      {props.children}
    </span>
  )
}

export default Date
