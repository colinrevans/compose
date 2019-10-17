import React from "react";
import axios from "axios";

export class YoutubeTitleLinkFromID extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: null,
      available: true
    };

    this.loadTitle = this.loadTitle.bind(this);
  }

  componentDidMount() {
    this.loadTitle();
  }

  loadTitle() {
    axios
      .get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          key: "AIzaSyDWNU9HIr5p0_wxOty-k4nV_SpiM8dRIVY",
          part: "snippet",
          id: this.props.id
        }
      })
      .then(res => {
        if (res.data.items[0] === undefined) {
          this.setState({
            available: false
          });
        } else
          this.setState({
            title: res.data.items[0].snippet.title
          });
      });
  }

  render() {
    return (
      <a
        style={{ marginTop: 5, marginBottom: 5 }}
        target="_blank"
        rel="noopener noreferrer"
        href={this.props.uri}
      >
        {this.state.available ? this.state.title || this.props.uri : null}
      </a>
    );
  }
}
