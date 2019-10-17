import React from "react"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableHead from "@material-ui/core/TableHead"
import TableRow from "@material-ui/core/TableRow"
import empty from "is-empty"
import Button from "@material-ui/core/Button"
import { YoutubeTitleLinkFromID } from "./youtube-title-link-from-id"
import { DiscogsTrackRow } from "./discogs-track-row"
import { Waiting } from "./waiting"
import { Client } from "disconnect"
const has = x => !empty(x)

export class DiscogsReleaseRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showTracklist: false,
      youtubeEmbed: false,
      release: {},
      loadingInitiated: false,
    }
    this.showHideTracklist = this.showHideTracklist.bind(this)
    this.loadYoutubeEmbed = this.loadYoutubeEmbed.bind(this)
    this.loadRelease = this.loadRelease.bind(this)

    //this.loadRelease();
  }

  componentDidMount() {
    this.loadRelease()
  }

  loadRelease() {
    this.props.db
      .getRelease(
        this.props.parent.type === "master"
          ? this.props.parent.main_release
          : this.props.parent.id
      )
      .then(rls => {
        this.setState({
          release: rls,
        })
      })
      .catch(err => {
        setTimeout(this.loadRelease, 61000)
        //console.log("tracklist throttled", err);
      })
  }

  showHideTracklist() {
    /*
    if (!this.state.loadingInitiated) {
      this.loadRelease();
      this.setState({
        loadingInitiated: true
      });
    }
    */
    this.setState({
      showTracklist: !this.state.showTracklist,
    })
  }

  loadYoutubeEmbed() {
    this.setState({
      youtubeEmbed: true,
    })
  }

  render() {
    return (
      <>
        <TableRow>
          <TableCell>
            {empty(this.state.release) ? (
              this.props.parent.title
            ) : (
              <a
                href={this.state.release.uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "100%" }}
              >
                {this.props.parent.title}
              </a>
            )}
          </TableCell>

          <TableCell>{this.props.parent.artist}</TableCell>

          <TableCell>{this.props.parent.year} </TableCell>
          <TableCell>{this.props.parent.label} </TableCell>
          {/*<TableCell>{this.props.parent.format}</TableCell>*/}

          <TableCell>
            {has(this.state.release) && has(this.state.release.videos)
              ? //             <iframe
                //                title={this.state.release.videos[0].uri}
                //                width="280"
                //                height="165"
                //                src={
                //                  "https://youtube.com/embed/" +
                //                  this.state.release.videos[0].uri.match(/(?<=v\=).*/)[0]
                //                }
                //                frameborder="0"
                //                allowFullscreen="allowFullscreen"
                //              />
                this.state.release.videos.map(x => {
                  return (
                    <>
                      <YoutubeTitleLinkFromID
                        id={x.uri.match(/v=.*/)[0].substr(2)}
                        uri={x.uri}
                      />
                      <br />
                      <br />
                    </>
                  )
                })
              : /*<a href={this.state.release.videos[0].uri} target="_blank" rel="noopener noreferrer">
                video
              </a>*/
                null}
          </TableCell>
          <TableCell>
            <Button size="small" onClick={this.showHideTracklist}>
              toggle tracklist
            </Button>
          </TableCell>
        </TableRow>

        {this.state.showTracklist ? (
          empty(this.state.release) ? (
            <TableRow>
              <TableCell>
                <Waiting for="discogs" />
              </TableCell>
            </TableRow>
          ) : (
            this.state.release.tracklist.map(track => (
              <DiscogsTrackRow
                track={track}
                primaryArtist={this.props.primaryArtist}
                parent={this.state.release}
              />
            ))
          )
        ) : (
          <></>
        )}
      </>
    )
  }
}
