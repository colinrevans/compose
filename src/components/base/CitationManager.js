import React, { useEffect } from "react"

export let citationCount = 0
export const incrementCounter = () => citationCount++

const CitationManager = props => {
  useEffect(() => {
    citationCount = 0
    return () => {
      citationCount = 0
    }
  }, [])

  return null
}

export default CitationManager
