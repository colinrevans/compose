import React from "react"
import { LoadingAnimation } from "./styled"

export const Waiting = props => (
  <div>
    <LoadingAnimation duration="3s">
      <em style={{ fontSize: 12 }}>waiting for {props.for}...</em>
    </LoadingAnimation>
  </div>
)
