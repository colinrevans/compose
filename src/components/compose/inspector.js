import React, { useState } from "react"
import empty from "is-empty"
import Button from "@material-ui/core/Button"
import Checkbox from "@material-ui/core/Checkbox"
import TextField from "@material-ui/core/TextField"

export const Inspector = ({ options, setOptions }) => {
  const [tempOptions, setTempOptions] = useState(options)

  const handleChange = (e, key) => {
    setTempOptions(opt => ({ ...opt, [key]: e.target.value }))
  }
  return (
    <div
      style={{
        width: "30vw",
        position: "fixed",
        color: "black",
        outline: "1px solid black",
        backgroundColor: "white",
        right: 0,
        top: 0,
        height: "100vh",
        zIndex: 100,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ margin: 20 }}>
        inspector
        <hr />
        {!empty(tempOptions)
          ? Object.keys(tempOptions).map(key => (
              <div style={{ height: 46 }} key={key}>
                <div style={{ float: "left" }}>{key}: </div>
                <div style={{ float: "right" }}>
                  {React.createElement(
                    typeof tempOptions[key] === "boolean"
                      ? OptionsToggle
                      : OptionsTextField,
                    {
                      optionKey: key,
                      optionValue: tempOptions[key],
                      setOptions,
                    }
                  )}
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}

const OptionsToggle = ({ optionKey, optionValue, setOptions }) => {
  const [toggleValue, setToggleValue] = useState(optionValue)
  return (
    <Checkbox
      color="default"
      onClick={e => {
        setToggleValue(v => !v)
        setOptions(options => ({
          ...options,
          [optionKey]: !options[optionKey],
        }))
        e.stopPropagation()
        e.preventDefault()
      }}
      checked={toggleValue}
    />
  )
}

const OptionsTextField = ({ optionKey, optionValue, setOptions }) => {
  const [textFieldValue, setTextFieldValue] = useState(optionValue)
  return (
    <TextField
      value={textFieldValue}
      onChange={e => {
        setTextFieldValue(e.target.value)
      }}
      onKeyDown={e => {
        if (e.keyCode === 13) {
          setOptions(options => ({
            ...options,
            [optionKey]: textFieldValue,
          }))
          e.stopPropagation()
          e.preventDefault()
        }
      }}
    />
  )
}

export default Inspector
