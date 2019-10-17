import React from "react"
import TableCell from "@material-ui/core/TableCell"
import TableRow from "@material-ui/core/TableRow"
import Button from "@material-ui/core/Button"
import { SpotifyTrackRow } from "./spotify-track-row"
import { SpotifyLoader } from "./embeds"

export class SpotifyAlbumRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: true,
    }
    this.showHide = this.showHide.bind(this)
    this.loadTracks = this.loadTracks.bind(this)
  }

  showHide() {
    this.setState({
      hidden: !this.state.hidden,
    })
    if (!this.state.loaded) {
      this.loadTracks()
    }
  }

  loadTracks() {
    this.setState({ loaded: true })
  }

  render() {
    return (
      <>
        <TableRow>
          <TableCell>
            <div style={{ minWidth: 100 }}>{this.props.album.name}</div>
          </TableCell>
          <TableCell>
            <Button variant="outlined" size="small" onClick={this.showHide}>
              toggle tracklist
            </Button>
          </TableCell>
          <TableCell>{this.props.album.release_date}</TableCell>
          <TableCell />
          <TableCell>
            <SpotifyLoader
              type="album"
              uri={this.props.album.uri}
              height={this.props.height || 200}
            />
          </TableCell>
        </TableRow>
        {this.state.hidden
          ? null
          : this.props.album.tracks.items.map(track => (
              <SpotifyTrackRow
                primaryArtist={this.props.primaryArtist}
                track={track}
              />
            ))}
      </>
    )
  }
}
