import React from "react"
import { millisToMinutesAndSeconds } from "./utils"
import axios from "axios"
import TableCell from "@material-ui/core/TableCell"
import TableRow from "@material-ui/core/TableRow"
import Button from "@material-ui/core/Button"
import { LyricsOverlay } from "./lyrics-overlay"

export class SpotifyTrackRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      geniusSearchHits: {},
      geniusLyrics: "",
      searchedGenius: false,
      showGeniusLyrics: false,
    }
    this.listArtists = this.listArtists.bind(this)
    this.loadGeniusLyrics = this.loadGeniusLyrics.bind(this)
    this.showHideGeniusLyrics = this.showHideGeniusLyrics.bind(this)
  }

  showHideGeniusLyrics() {
    this.setState({
      showGeniusLyrics: !this.state.showGeniusLyrics,
    })
  }

  loadGeniusLyrics() {
    //search, if successful, get lyrics.
    axios
      .get("https://artist-ref-sheet-generator.herokuapp.com/genius/search", {
        params: {
          q: `${this.props.track.name} ${this.props.primaryArtist}`,
        },
      })
      .then(res => {
        //console.log(`in genius lyrics load (${this.props.track.name}) `, res);
        this.setState({
          geniusSearchHits: res.data,
          searchedGenius: true,
        })
        return axios
          .get(
            "https://artist-ref-sheet-generator.herokuapp.com/genius/lyrics",
            {
              params: {
                id: res.data[0].result.id,
              },
            }
          )
          .then(res => {
            //console.log("got lyrics container obj: ", res.data);
            //console.log("lyrics:");
            //console.log(res.data.lyrics);
            this.setState({ geniusLyrics: res.data.lyrics })
            return res.data.lyrics
          })
          .catch(err => {
            Promise.reject(err)
          })
      })
      .catch(err => {
        //console.log("genius load lyrics failed", err);
      })
  }

  listArtists() {
    let r = ""
    for (let artist of this.props.track.artists) {
      r += `${artist.name} `
    }
    return r
  }

  componentDidMount() {
    this.loadGeniusLyrics()
  }

  render() {
    return (
      <>
        <TableRow>
          <TableCell>{this.props.track["track_number"]}</TableCell>
          <TableCell>{this.props.track.name}</TableCell>
          <TableCell>
            {millisToMinutesAndSeconds(this.props.track["duration_ms"])}
          </TableCell>
          <TableCell>
            <div style={{ minWidth: 120 }}>
              {this.props.track.artists.map(artist => {
                return (
                  <>
                    <span>{artist.name}</span>
                    <br />
                    <br />
                  </>
                )
              })}
            </div>
          </TableCell>
          <TableCell>
            {!this.state.searchedGenius ? null : this.state.geniusLyrics ? (
              /*
            <a href={this.state.geniusSearchHits[0].result.url}
              target="_blank"
              rel="noopener noreferrer">
              lyrics
            </a>
            */
              this.state.showGeniusLyrics ? (
                <LyricsOverlay
                  uri={this.state.geniusSearchHits[0].result.url}
                  title={this.props.track.name}
                  disappear={this.showHideGeniusLyrics}
                >
                  {this.state.geniusLyrics}
                </LyricsOverlay>
              ) : (
                <Button size="small" onClick={this.showHideGeniusLyrics}>
                  lyrics
                </Button>
              )
            ) : null}
          </TableCell>
        </TableRow>
      </>
    )
  }
}
