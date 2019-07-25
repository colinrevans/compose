import React, { useState } from "react"

const Loader = props => {
  const [loaded, setLoaded] = useState(false)

  if (loaded) return props.component
  else return react.createElement(props.load, { ...props })
}

export const Youtube = props => {
  let src = "https://youtube.com/embed/" + props.src
  return (
    <div style={{ ...props.style }}>
      <iframe
        title={props.src}
        id="ytplayer"
        type="text/html"
        width="300"
        height="200"
        src={src}
        frameBorder="0"
      />
    </div>
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
    <div style={{ ...props.style }}>
      <iframe
        title={props.src || props.uri}
        src={url}
        width={props.width || "300"}
        height={props.height || "80"}
        frameBorder="0"
        allow="encrypted-media"
        onLoad={props.passOnLoad ? props.passOnLoad : () => {}}
      />
    </div>
  )
}
