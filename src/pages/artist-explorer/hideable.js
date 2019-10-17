import React from "react"
import { HorizontalLine } from "./styled"
import { Centered } from "./styled/styles"
import Button from "@material-ui/core/Button"
import { MuiThemeProvider } from "@material-ui/core"
import * as theme from "./styled/theme"
import { NoMobile } from "./styled/elements"

export class Hideable extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: this.props.hide,
    }
    this.showHide = this.showHide.bind(this)
  }

  showHide() {
    this.setState({
      hidden: !this.state.hidden,
    })
  }

  render() {
    return (
      <div style={{ display: "block" }}>
        <ShowHideButton onClick={this.showHide}>
          {this.state.hidden ? "show" : "hide"} {this.props.name}
        </ShowHideButton>

        <div
          style={{
            display: this.state.hidden ? "none" : "block",
            width: "100%",
            marginTop: "1px",
          }}
        >
          {this.props.children}
        </div>
        {this.props.atEndToo && !this.state.hidden ? (
          <ShowHideButton onClick={this.showHide} atEnd>
            {this.state.hidden ? "show" : "hide"} {this.props.name}
          </ShowHideButton>
        ) : null}
      </div>
    )
  }
}

const ShowHideButton = props => {
  return (
    <div
      style={{
        width: "100%",
        margin: "0",
        display: "block",
        height: "41px",
        marginTop: "15px",
        marginBottom: 20,
      }}
    >
      <NoMobile>
        <div style={{ width: "33%", float: "left" }}>
          {!props.atEnd ? (
            <HorizontalLine />
          ) : (
            <div style={{ minWidth: "100%", height: "1px" }} />
          )}
        </div>
      </NoMobile>
      <div
        style={{
          width: "33%",
          float: "left",
          whiteSpace: "nowrap",
        }}
      >
        <Centered>
          <Button
            variant="outlined"
            style={{ transform: "scale(0.7)" }}
            size="small"
            onClick={props.onClick}
          >
            {props.children}
          </Button>
        </Centered>
      </div>
      <NoMobile>
        <div style={{ width: "33%", float: "left" }}>
          {!props.atEnd ? <HorizontalLine /> : null}
        </div>
      </NoMobile>
    </div>
  )
}
