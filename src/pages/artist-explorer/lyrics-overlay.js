import React from "react"
import { PageMask, Middle, HorizontalLine } from "./styled"
import { Centered } from "./styled/styles"

export const LyricsOverlay = props => {
  return (
    <PageMask onTouchStart={props.disappear} onClick={props.disappear}>
      <Centered>
        <Middle
          onTouchStart={() => {}}
          onClick={() => {}}
          style={{ zIndex: 11 }}
        >
          <div style={{ marginLeft: 15, marginRight: 15 }}>
            <h3>{props.title}</h3>
            <HorizontalLine />
            <br />
            <br />

            {props.children.split("\n").map(line =>
              line ? (
                <>
                  {line}
                  <br />
                </>
              ) : (
                <br />
              )
            )}
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            <em>
              lyrics page at{" "}
              <a href={props.uri} target="_blank" rel="noopener noreferrer">
                Genius
              </a>
            </em>
            <br />
            <br />
          </div>
        </Middle>
      </Centered>
    </PageMask>
  )
}
