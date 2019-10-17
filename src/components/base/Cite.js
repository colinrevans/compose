import React, { useEffect, useState } from "react"
import { citationCount, incrementCounter } from "./CitationManager.js"
import Popup from "./Popup"

const Cite = props => {
  const [i, setI] = useState(citationCount + 1)
  useEffect(() => {
    incrementCounter()
    setI(citationCount)
  }, [])

  console.log("cite", citationCount)
  console.log("props", props)
  return (
    <Popup to={props.entry} base={i}>
      {props.from[props.entry]}
    </Popup>
  )
}

export default Cite
