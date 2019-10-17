import React from "react"

const Marginalia = ({ children, left }) => {
  return (
    <div className="nomobile" style={{ position: "relative", width: "100%" }}>
      <p
        style={Object.assign(
          left
            ? { right: "calc(100% + 2.5vw)" }
            : { left: "calc(100% + 2.5vw)" },
          {
            position: "absolute",
            right: "calc(100% + 2.5vw)",
            top: 0,
            width: "15vw",
            fontSize: left ? 12 : 10,
            fontStyle: "italic",
            lineHeight: 1.2,
          }
        )}
      >
        {children}
      </p>
    </div>
  )
}

export default Marginalia
