import axios from "axios";
import { Client } from "disconnect";

let db = new Client().database();

export function searchWikipedia(artist = "radiohead") {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/wikipedia/search", {
      params: {
        artist: artist
      }
    })
    .then(r => {
      //console.log("wikipedia search:", r);
      return r.data.query.search;
      //setWikipediaSearch(r.data.query.search);
    })
    .catch(err => {
      //console.log("error search wikipedia", err);
    });
}

export function loadWikipediaPage(pageName = "radiohead") {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/wikipedia/page", {
      params: { page: pageName }
    })
    .then(res => {
      //console.log("wikipedia page", res);
      return res.data;

      //setWikipediaArticle(res.data)
    })
    .catch(err => {
      //console.log("error getting wikipedia", err);
    });
}

export function loadSpotifyArtistAlbums(id) {
  return Promise.all(
    ["album", "single", "appears_on", "compilation"].map(type =>
      loadSpotifyArtistAlbumsByType(id, type)
    )
  )
    .then(res => {
      //console.log("pre crash", res);
      return Promise.all(
        res
          .map(albumList => albumList.albums.map(album => album.id))
          .map(albumIdList => {
            //console.log("albumIdList", albumIdList);
            if (albumIdList.length === 0) return Promise.resolve([]);
            return Promise.resolve(
              axios
                .get(
                  "https://artist-ref-sheet-generator.herokuapp.com/spotify/albums",
                  {
                    params: {
                      albums: albumIdList
                    }
                  }
                )
                .then(res => {
                  //console.log("inmaps: ", res.data);
                  return res.data.albums;
                })
                .catch(err => {
                  //console.log(err);
                  return Promise.reject(err);
                })
            );
          })
      );
    })
    .then(res => {
      let types = ["album", "single", "appears_on", "compilation"];
      let r = {};
      res.map((albums, idx) => {
        r[types[idx]] = albums;
      });
      //console.log("%c ALBUMS", "background-color: red", r);
      return r;
      //setSpotifyAlbums(r);
    })
    .catch(err => {
      //console.log(err);
      return Promise.reject(err);
    });
}

export function loadSpotifyArtist(artist = "radiohead") {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/spotify/artist", {
      params: { artist: artist }
    })
    .then(res => {
      return res.data.artists.items[0];
      //setSpotifyArtist(res.data.artists.items[0]);
    })
    .catch(err => {
      return {};
      //console.log("spotify artist search failed", err);
    });
}

export function loadSpotifyArtistAlbumsByType(id, type, base = {}) {
  return axios
    .get(
      "https://artist-ref-sheet-generator.herokuapp.com/spotify/artists-albums",
      {
        params: { type: type, id: id }
      }
    )
    .then(res => {
      let n = {};
      Object.assign(n, base);
      n[type] = res.data.items;
      n["albums"] = res.data.items;
      return n;
    });
}

export function loadLibgenEntries(query = "radiohead") {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/libgen/search", {
      params: {
        query: query,
        count: 20
      }
    })
    .then(res => {
      //console.log("libgen", res);
      return res.data.entries;
    })
    .catch(err => Promise.reject(err));
}

export function searchForDiscogsArtist(name = "radiohead") {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/discogs/search", {
      params: {
        q: name,
        type: "artist"
      }
    })
    .then(returned => {
      let id = returned.data.results[0].id;
      return id;
      //loadDiscogsArtist(id);
      //loadDiscogsArtistReleases(id);
    });
}

export function loadJournalism(artist) {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/journalism", {
      params: {
        artist: artist
      }
    })
    .then(({ data: journalism }) => {
      return journalism;
    });
}

export function loadBandcampAlbumIds(url) {
  return axios
    .get("https://artist-ref-sheet-generator.herokuapp.com/bandcamp/albums", {
      params: {
        url: url
      }
    })
    .then(res => {
      return res.data;
      //setBandcampAlbumIds(res.data);
      //console.log("bandcamp ids: ", res.data);
    })
    .catch(err => {
      //console.log("error getting bandcamp album ids", err);
      Promise.reject(err);
    });
}

export async function loadBandcampHomepage(artist) {
  try {
    let res = await axios.get(
      "https://artist-ref-sheet-generator.herokuapp.com/bandcamp/homepage",
      {
        params: {
          artist: artist
        }
      }
    );
    let ids = res.data;
    return Promise.resolve(ids);
  } catch (err) {
    //console.log("error getting bandcamp homepage and ids", err);
    return Promise.reject(err);
  }
}

export async function loadGoodreadsBooks(artist) {
  try {
    let { data: works } = await axios.get(
      "https://artist-ref-sheet-generator.herokuapp.com/goodreads/books",
      {
        params: {
          artist: artist
        }
      }
    );
    return Promise.resolve(works);
  } catch (err) {
    //console.log(`error loading goodreads books`, err);
    return Promise.reject(err);
  }
}

export async function loadImslpWorksTable(artist) {
  try {
    let { data: table } = await axios.get(
      "https://artist-ref-sheet-generator.herokuapp.com/imslp/works",
      {
        params: {
          artist: artist
        }
      }
    );
    return Promise.resolve(table);
  } catch (err) {
    //console.log("error getting imslp works table", err);
    return Promise.reject(err);
  }
}
export function loadDiscogsArtist(id) {
  return db
    .getArtist(id)
    .then(artist => {
      //console.log("discogs artist", artist);
      return artist;
      //setDiscogsArtist(artist);
    })
    .catch(err => {
      Promise.reject(err);
      //setTimeout(loadDiscogsArtist, 61000);
    });
}

export function loadDiscogsArtistReleases(id) {
  return db
    .getArtistReleases(id)
    .then(rlss => {
      //console.log("rlss: ", rlss);
      return rlss;
    })
    .catch(err => {
      Promise.reject(err);
      //setTimeout(loadDiscogsArtistReleases, 61000);
    });
}
