import React, { useState } from "react"
import { fontFamily } from "../../components/base/theme"

const Popup = props => {
  const [hovering, setHovering] = useState(null)
  return (
    <>
      <span
        className="noselect"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          color: "#003344",
          fontFamily: "georgia",
          borderBottom: "1px solid #CCCCCC",
          fontWeight: 200,
          marginLeft: 2,
          marginRight: 3,
          position: "relative",
          bottom: 6,
          fontSize: 10,
        }}
      >
        {props.to ? (
          <a
            href={`#${props.to}`}
            style={{
              textDecoration: "none",
              marginLeft: -3,
            }}
          >
            {" "}
            {props.base
              ? props.base
              : props.idx !== undefined
              ? props.idx + 1
              : "i"}
          </a>
        ) : props.base ? (
          props.base
        ) : props.idx !== undefined ? (
          props.idx + 1
        ) : (
          "i"
        )}
      </span>
      {hovering ? (
        <span style={{ position: "relative" }} className="noselect">
          <style jsx>{`
            .fade-in {
              animation-name: fade-in;
              animation-duration: 0.3s;
            }

            @keyframes fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
          <div
            className="fade-in select"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
              backgroundColor: "white",
              border: "1px solid black",
              position: "absolute",
              bottom: 15,
              overflow: "auto",
              overflowY: "auto",
              display: "inline-block",
              width: 200,
              left: -15,
              fontSize: 12,
              fontFamily,
              fontWeight: 200,
              padding: 10,
              boxShadow: "3px 5px 25px 2px rgba(0,0,0,0.51)",
            }}
          >
            {props.children}
          </div>
        </span>
      ) : null}
    </>
  )
}

export default Popup
