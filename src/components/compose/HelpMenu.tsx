import React from "react"
import keycode from "keycode"

const HelpMenu = ({ commands }: { commands: any }) => {
  return (
    <>
      //@ts-ignore
      <style jsx>
        {`
          .container {
            overflow-y: scroll;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .container::-webkit-scrollbar {
            width: 0;
            height: 0;
          }
        `}
      </style>
      <div
        className="container"
        style={{
          position: "fixed",
          backgroundColor: "white",
          right: "calc(50vw - 200px)",
          top: "10vh",
          width: 400,
          height: "80vh",
          overflow: "hidden",
          color: "grey",
          border: "1px solid grey",
          fontFamily: "sans-serif",
          fontSize: "80%",
          zIndex: 2,
        }}
      >
        <p style={{ padding: 30, textTransform: "capitalize" }}>
          Keyboard Shortcuts
          <hr />
          {Object.keys(commands).map(commandName => {
            let command = commands[commandName]
            return (
              <>
                <span style={{ float: "left" }}>{commandName}: </span>
                <span style={{ marginLeft: "80px" }}> </span>
                <span style={{ float: "right" }}>
                  {command.keys
                    .map((key: string) =>
                      keycode(key)
                        ? keycode(key)
                            .toString()
                            .toUpperCase()
                        : ""
                    )
                    .reduce((a: string, b: string) => a + " + " + b)}
                </span>
                <br />
              </>
            )
          })}
        </p>
      </div>
    </>
  )
}

export default HelpMenu
