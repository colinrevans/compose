import React from "react"
import { Link } from "gatsby"
import Button from "@material-ui/core/Button"

const OverlayUI = ({
  translate,
  setElements,
  setZoom,
  setTranslate,
  setShowHelp,
  saveCanvas,
  elements,
  navigateLeft,
  navigateRight,
  navigateUp,
  navigateDown,
}) => {
  return (
    <>
      <div
        style={{
          width: 2,
          height: 2,
          backgroundColor: "black",
          color: "grey",
          position: "fixed",
          left: "calc(50vw - 1px)",
          top: "calc(50vh - 1px)",
          zIndex: 2000,
        }}
      />
      <h1
        className="noselect"
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          fontSize: 20,
          color: "lightgrey",
          fontWeight: 300,
          zIndex: 12,
        }}
      >
        compose
      </h1>
      <span
        className="noselect"
        style={{
          position: "fixed",
          top: 20,
          left: 120,
          color: "#ededed",
          fontSize: 16,
          fontFamily: "sans-serif",
        }}
      >
        ({Math.round(-1 * translate.x)}, {Math.round(-1 * translate.y)})
      </span>
      {/* CLEAR */}
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          color: "grey",
          zIndex: 14,
          transform: "scale(0.7)",
        }}
        onClick={() => {
          setElements([])
        }}
      >
        clear
      </Button>
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 120,
          color: "grey",
          transform: "scale(0.7)",
          zIndex: 14,
        }}
        onClick={() => {
          setZoom({ scale: 1 })
          setTranslate({ x: 0, y: 0 })
        }}
      >
        origin
      </Button>
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 220,
          color: "grey",
          transform: "scale(0.7)",
          zIndex: 14,
        }}
        onClick={() => setShowHelp(s => !s)}
      >
        help
      </Button>
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 320,
          transform: "scale(0.7)",

          color: "grey",
          zIndex: 14,
        }}
        onClick={() => saveCanvas()}
      >
        save
      </Button>
      <Link to="/" style={{ position: "fixed", top: 1, left: 1, fontSize: 8 }}>
        home
      </Link>
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 390,
          transform: "scale(0.7)",

          color: "grey",
          zIndex: 14,
        }}
        onClick={() => setZoom({ scale: 1 })}
      >
        reset zoom
      </Button>
      <Button
        style={{
          position: "fixed",
          bottom: 20,
          left: 520,
          transform: "scale(0.7)",
          color: "grey",
          zIndex: 14,
        }}
        onClick={() => console.log(elements)}
      >
        log
      </Button>

      <Button
        style={{
          position: "fixed",
          bottom: "50vh",
          transform: "scale(0.7)",
          left: 5,
          color: "grey",
        }}
        onClick={navigateLeft}
      >
        ⟵
      </Button>
      <Button
        style={{
          position: "fixed",
          bottom: "50vh",
          transform: "scale(0.7)",
          right: 5,
          color: "grey",
        }}
        onClick={navigateRight}
      >
        ⟶
      </Button>
      <Button
        style={{
          position: "fixed",
          left: "calc(50vw - 32px)",
          transform: "scale(0.7)",
          top: 5,
          color: "grey",
        }}
        onClick={navigateUp}
      >
        ↑
      </Button>
      <Button
        style={{
          position: "fixed",
          left: "calc(50vw - 32px)",
          bottom: 5,
          transform: "scale(0.7)",
          color: "grey",
        }}
        onClick={navigateDown}
      >
        ↓
      </Button>
    </>
  )
}

export default OverlayUI
