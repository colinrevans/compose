import note from "../music/note.js"
import React from "react"

const noteHeadD = "M50,50 L100,100"

const Note = ({ note, x, y }) => {
  return (
    <path
      strokeWidth="0.3"
      fill="black"
      stroke="black"
      strokeDasharray="none"
      d={noteHeadD}
      onClick={e => alert("clicked")}
    ></path>
  )
}

export default Note
