import React from "react"
import TableRow from "@material-ui/core/TableRow"
import TableCell from "@material-ui/core/TableCell"
import { fontFamily } from "./theme"

const Answer = ({ children, style }) => {
  if (children.length === 0) return ""
  return (
    <TableRow style={style}>
      <TableCell
        style={{
          width: "30%",
          verticalAlign: "top",
          fontSize: 12,
          fontFamily,
        }}
      >
        {children[0]}
      </TableCell>
      <TableCell style={{ fontSize: 12, fontFamily }}>
        {children.slice(1).map
          ? children.slice(1).map(child => (
              <>
                {child.props && child.props.originalType === "p" ? (
                  <>
                    {child.props.children}
                    <br />
                    <br />
                  </>
                ) : (
                  <>
                    {child}
                    <br />
                  </>
                )}
              </>
            ))
          : null}
      </TableCell>
    </TableRow>
  )
}

export default Answer
