import React from "react";
import axios from "axios";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";
import { LyricsOverlay } from "./lyrics-overlay";

export class DiscogsTrackRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      youtubeEmbedLoaded: false,
      searchedGenius: false,
      geniusSearchHits: {},
      geniusLyrics: "",
      showGeniusLyrics: false
    };
    this.loadYoutubeEmbed = this.loadYoutubeEmbed.bind(this);
    this.loadGeniusLyrics = this.loadGeniusLyrics.bind(this);
    this.showHideGeniusLyrics = this.showHideGeniusLyrics.bind(this);
  }

  loadYoutubeEmbed() {
    this.setState({ youtubeEmbedLoaded: true });
  }

  showHideGeniusLyrics() {
    this.setState({
      showGeniusLyrics: !this.state.showGeniusLyrics
    });
  }

  loadGeniusLyrics() {
    //search, if successful, get lyrics.
    axios
      .get("https://artist-ref-sheet-generator.herokuapp.com/genius/search", {
        params: {
          q: `${this.props.track.title} ${this.props.primaryArtist}`
        }
      })
      .then(res => {
        //console.log(`in genius lyrics load (${this.props.track.name}) `, res);
        this.setState({
          geniusSearchHits: res.data,
          searchedGenius: true
        });
        return axios
          .get(
            "https://artist-ref-sheet-generator.herokuapp.com/genius/lyrics",
            {
              params: {
                id: res.data[0].result.id
              }
            }
          )
          .then(res => {
            //console.log("got lyrics container obj: ", res.data);
            //console.log("lyrics:");
            //console.log(res.data.lyrics);
            //this.setState({ geniusLyrics: res.data.lyrics });
            return res.data.lyrics;
          })
          .catch(err => {
            Promise.reject(err);
          });
      })
      .catch(err => {
        //console.log("genius load lyrics failed", err);
      });
  }

  componentDidMount() {
    this.loadGeniusLyrics();
  }

  render() {
    return (
      <TableRow>
        <TableCell>{this.props.track.position}</TableCell>
        <TableCell>{this.props.track.title}</TableCell>
        <TableCell>{this.props.track.duration}</TableCell>
        <TableCell>
          {this.props.track.artists ? this.props.track.artists[0].name : ""}
        </TableCell>

        <TableCell />
        <TableCell>
          {/*!empty(this.props.parent.videos) ? (
            <Button size="small" onClick={this.loadYoutubeEmbed}>
              load video
            </Button>
          ) : null */}

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
                title={this.props.track.title}
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
    );
  }
}
