import React, { useState } from "react"
import empty from "is-empty"
import Button from "@material-ui/core/Button"
import Checkbox from "@material-ui/core/Checkbox"
import TextField from "@material-ui/core/TextField"

export const Inspector = ({ options, setOptions, pushState }) => {
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
                      options,
                      optionKey: key,
                      optionValue: tempOptions[key],
                      setOptions,
                      pushState,
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

const OptionsToggle = ({
  options,
  optionKey,
  optionValue,
  setOptions,
  pushState,
}) => {
  const [toggleValue, setToggleValue] = useState(optionValue)
  return (
    <Checkbox
      color="default"
      onClick={e => {
        setToggleValue(v => !v)
        let newOpts = { ...options, [optionKey]: !options[optionKey] }
        setOptions(options => ({
          ...options,
          [optionKey]: !options[optionKey],
        }))
        e.stopPropagation()
        e.preventDefault()
        pushState(newOpts)
      }}
      checked={toggleValue}
    />
  )
}

const OptionsTextField = ({
  options,
  optionKey,
  optionValue,
  setOptions,
  pushState,
}) => {
  const [textFieldValue, setTextFieldValue] = useState(optionValue)
  return (
    <TextField
      value={textFieldValue}
      onChange={e => {
        setTextFieldValue(e.target.value)
      }}
      onKeyDown={e => {
        if (e.keyCode === 13) {
          let newOpts = { ...options, [optionKey]: textFieldValue }
          setOptions(options => ({
            ...options,
            [optionKey]: textFieldValue,
          }))
          e.stopPropagation()
          e.preventDefault()
          pushState(newOpts)
        }
      }}
    />
  )
}

export default Inspector
