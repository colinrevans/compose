import React from "react"
import H2 from "./H2"
import empty from "is-empty"
import { fontFamily } from "./theme"
import P from "./P"

const Bibliography = props => {
  return empty(props.citations) ? null : (
    <>
      <div style={{ textAlign: "center" }}>
        <hr
          style={{
            marginTop: 100,
            marginBottom: 50,
            marginLeft: "25%",
            width: "50%",
          }}
        />
      </div>
      <H2>bibliography</H2>
      <div style={{ marginTop: -20, marginBottom: 100, lineHeight: "1.1em" }}>
        {Object.values(props.citations)
          .sort()
          .map((ct, idx) => (
            <Entry idx={idx} citations={props.citations}>
              {ct}
            </Entry>
          ))}
      </div>
    </>
  )
}

const Entry = props => {
  return (
    <p
      style={{
        fontFamily,
        fontSize: 12,
        paddingLeft: 20,
        textIndent: -20,
        marginBottom: 0,
      }}
    >
      <a name={`${Object.keys(props.citations)[props.idx]}`} />
      {props.children}
      <br />
    </p>
  )
}

export default Bibliography
