import React, { useState } from "react"
import Button from "@material-ui/core/Button"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import { fontFamily } from "./theme"

const Answers = ({ children, section, last, style }) => {
  const [hidden, setHidden] = useState(true)

  return (
    <div style={{ marginBottom: last ? "1.45rem" : 0, ...style }}>
      {section ? (
        <h3
          style={{
            marginLeft: 20,
            display: "inline",
            fontFamily,
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          {section.toLowerCase()}
        </h3>
      ) : null}
      <Button
        style={{ transform: "scale(0.8)" }}
        size="small"
        onClick={() => setHidden(h => !h)}
      >
        {hidden ? "show" : "hide"}
      </Button>
      {!hidden ? (
        <>
          <Table>
            <TableBody>{children}</TableBody>
          </Table>
          <Button
            style={{ transform: "scale(0.8)" }}
            size="small"
            onClick={() => setHidden(h => !h)}
          >
            hide
          </Button>
        </>
      ) : null}
    </div>
  )
}

export default Answers
