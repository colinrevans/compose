import React, { useState } from "react"
import { NoSpace } from "./styled/styles"
import { Waiting } from "./waiting"

export const Youtube = props => {
  let src = "https://youtube.com/embed/" + props.src
  return (
    <iframe
      title={props.src}
      id="ytplayer"
      type="text/html"
      width="300"
      height="200"
      src={src}
      frameborder="0"
    />
  )
}

export const YoutubeLink = props => {
  let src = "https://youtu.be/" + props.src
  return (
    <a href={src} target="_blank" rel="noopener noreferrer">
      <em>youtube</em>
    </a>
  )
}

export const Spotify = props => {
  let trackOrAlbum = props.type
  let src = props.src
  if (props.uri)
    src = props.uri
      .substr("spotify:".length)
      .match(/:.*$/)[0]
      .substr(1)
  let url = "https://open.spotify.com/embed/" + trackOrAlbum + "/" + src
  return (
    <iframe
      title={props.src || props.uri}
      src={url}
      width={props.width || "300"}
      height={props.height || "80"}
      frameBorder="0"
      allow="encrypted-media"
      onLoad={props.passOnLoad ? props.passOnLoad : () => {}}
    />
  )
}

export class BandcampLoader extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
    }
  }

  hideWaiting = () => {
    this.setState({
      loading: false,
    })
  }

  render() {
    return (
      <div style={{ position: "relative" }}>
        {this.state.loading ? (
          <NoSpace style={{ top: 200 }}>
            <Waiting for="bandcamp embed" />
          </NoSpace>
        ) : null}

        <iframe
          style={{
            border: 0,
            width: 400,
            height: 241,
            marginLeft: 20,
            marginRight: 20,
            marginTop: 20,
          }}
          src={`https://bandcamp.com/EmbeddedPlayer/album=${this.props.id}/size=large/bgcol=ffffff/linkcol=63b2cc/artwork=small/transparent=true/`}
          seamless
          title={`bandcamp album ${this.props.id}`}
          onLoad={this.hideWaiting}
        />
      </div>
    )
  }
}

export class SpotifyLoader extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
    }
  }

  hideWaiting = () => {
    this.setState({
      loading: false,
    })
  }

  render() {
    return (
      <div style={{ position: "relative" }}>
        {this.state.loading ? (
          <NoSpace style={{ top: 73 }}>
            <Waiting for="spotify embed" />
          </NoSpace>
        ) : null}
        <Spotify
          uri={this.props.uri}
          src={this.props.src}
          width={this.props.width}
          height={this.props.height}
          type={this.props.type}
          passOnLoad={this.hideWaiting}
          style={{ position: "absolute" }}
        />
      </div>
    )
  }
}
