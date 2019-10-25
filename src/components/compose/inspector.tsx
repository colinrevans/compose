import React, { useState } from "react"
import empty from "is-empty"
import Button from "@material-ui/core/Button"
import Checkbox from "@material-ui/core/Checkbox"
import TextField from "@material-ui/core/TextField"
import { options } from "./common"

interface InspectorProps<T extends options> {
  options: T
  setOptions: React.Dispatch<React.SetStateAction<T>>
  pushState: (opts?: T) => void
}

/* Typing Tests
interface As extends options {
 a: string
 b: string
}

interface Bs {
 asdf: string
 g: string
}

const testFunct = (a: options) => { }
testFunct({ a: "asd", b: "asd" })

interface J {
 ifjd: string
 id: string
}

const TypeTests = () => {
 const [a, setA] = useState<As>({ a: "asdf", b: "cdef" })
 const pushA = (opts: As) => { }
 const [c, setC] = useState({ asdf: "e", g: "fes" })
 const [b, setB] = useState<Bs>({ asdf: "e", g: "fes" })
 const [d, setD] = useState({ ...a, ...c })
 const pushC = (opts: Bs) => { }
 const [j, setJ] = useState({ ifjd: "a", id: "asd" })
 const [f, setF] = useState(3)
 const pushF = (opts: number) => { }
 return (
  <>
   <Inspector options={a} setOptions={setA} pushState={pushA} />
   <Inspector options={b} setOptions={setB} pushState={pushC} /> // should
   <Inspector options={f} setOptions={setF} pushState={pushF} /> // should
   <Inspector options={c} setOptions={setA} pushState={pushA} /> // should
   <Inspector options={d} setOptions={setA} pushState={pushA} /> // should
   <Inspector options={c} setOptions={setC} pushState={pushC} />
  </>
 )
}
*/

export const Inspector = <T extends options>({
  options,
  setOptions,
  pushState,
}: InspectorProps<T>) => {
  const [tempOptions, setTempOptions] = useState<T>(options)
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
          ? Object.keys(tempOptions).map(key => {
              let optionProps = {
                options,
                optionKey: key,
                optionValue: tempOptions[key],
                setOptions,
                pushState,
              }
              return (
                <div style={{ height: 46 }} key={key}>
                  <div style={{ float: "left" }}>{key}: </div>
                  <div style={{ float: "right" }}>
                    {typeof tempOptions[key] === "boolean"
                      ? // really involved fix that isn't worth it
                        // @ts-ignore
                        React.createElement(OptionsToggle, {
                          ...optionProps,
                          optionValue: tempOptions[key] as boolean,
                        })
                      : // same story
                        // @ts-ignore
                        React.createElement(OptionsTextField, {
                          ...optionProps,
                          optionValue: tempOptions[key] as string,
                        })}
                  </div>
                </div>
              )
            })
          : null}
      </div>
    </div>
  )
}

interface OptionsToggleProps<T extends options> extends InspectorProps<T> {
  optionKey: string
  optionValue: boolean
}

const OptionsToggle = <T extends options>({
  options,
  optionKey,
  optionValue,
  setOptions,
  pushState,
}: OptionsToggleProps<T>) => {
  const [toggleValue, setToggleValue] = useState(optionValue)
  return (
    <Checkbox
      color="default"
      onClick={e => {
        setToggleValue((v: boolean) => !v)
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

interface OptionsTextFieldProps<T extends options> extends InspectorProps<T> {
  optionKey: string
  optionValue: string
}

const OptionsTextField = <T extends options>({
  options,
  optionKey,
  optionValue,
  setOptions,
  pushState,
}: OptionsTextFieldProps<T>) => {
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
