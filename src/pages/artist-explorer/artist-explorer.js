import React, { useState, useEffect } from "react"
import { OnlyMobile, NoMobile } from "./styled/elements"
import { Centered } from "./styled/styles"
import { Link } from "gatsby"
import { Client } from "disconnect"
import empty from "is-empty"
import TextField from "@material-ui/core/TextField"
import { BandcampLoader } from "./embeds.js"
import Button from "@material-ui/core/Button"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import TableCell from "@material-ui/core/TableCell"
import TableRow from "@material-ui/core/TableRow"
import * as sr from "./server-requests"
import { Hideable } from "./hideable"
import { AlbumTable } from "./album-table"
import { Waiting } from "./waiting"
import { HorizontalLine, LoadingAnimation, ScrollableTable } from "./styled"
import { DiscogsReleaseRow } from "./discogs-release-row"
import { Fullscreen } from "./styled/grid"
import { parse } from "flatted/esm"
import { createBrowserHistory } from "history"
import H2 from "../../components/base/H2"
import H3 from "../../components/base/H3"
import H4 from "../../components/base/H4"
import A from "../../components/base/A"
const has = x => !empty(x)

let db = new Client().database()
const history = createBrowserHistory()

export const ArtistExplorer = props => {
  const [artistFieldValue, setArtistFieldValue] = useState("")
  const [discogsArtist, setDiscogsArtist] = useState({})
  const [discogsReleases, setDiscogsReleases] = useState({})
  const [wikipediaArticle, setWikipediaArticle] = useState([])
  const [wikipediaSearch, setWikipediaSearch] = useState([])
  const [spotifyArtist, setSpotifyArtist] = useState({})
  const [bandcampAlbumIds, setBandcampAlbumIds] = useState([])
  const [discogsErr, setDiscogsErr] = useState(false)
  const [spotifySearch, setSpotifySearch] = useState([])
  const [spotifyAlbums, setSpotifyAlbums] = useState({})
  const [libgenEntries, setLibgenEntries] = useState([])
  const [libgenError, setLibgenError] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [goodReadsBooks, setGoodReadsBooks] = useState([])
  const [journalism, setJournalism] = useState([])
  const [imslpWorksTable, setImslpWorksTable] = useState({})
  const [libgenQuery, setLibgenQuery] = useState("")

  function handleArtistEntry(e) {
    setArtistFieldValue(e.target.value)
  }

  function load(e, artist) {
    if (empty(artistFieldValue) && empty(artist)) return
    //console.log("load " + artistFieldValue);
    artist = artist || artistFieldValue

    setLoading(true)

    if (artist !== loaded) {
      //setDiscogsArtist({});
      //setDiscogsReleases({});
      setSpotifyArtist({})
      setSpotifyAlbums({})
      setLibgenEntries([])
      setJournalism([])
      setBandcampAlbumIds([])
      setImslpWorksTable({})
      setGoodReadsBooks([])

      //searchForDiscogsArtist(artist);
      getLibgenData(artist)
    }
    getSpotifyData(artist)
    setDiscogsErr(false)
    setDiscogsArtist({})
    setDiscogsReleases({})
    getDiscogsId(artist)
    getBandcampData(null, artist)
    getImslpWorksTable(artist)
    getGoodreadsBooks(artist)

    getJournalism(artist)

    setWikipediaArticle([])
    getWikipediaSearch(artist)

    setLoaded(artist)
  }

  // LOADING ARTIST DATA

  async function getJournalism(artist) {
    try {
      let journalism = await sr.loadJournalism(artist)
      setJournalism(journalism)
    } catch (err) {
      //console.log("error getting journalism", err);
    }
  }

  async function getWikipediaSearch(artist = "radiohead") {
    try {
      let search = await sr.searchWikipedia(artist)
      setWikipediaSearch(search)
    } catch (err) {
      //console.log("error getting search wikipedia", err);
    }
  }

  async function getGoodreadsBooks(artist) {
    try {
      let works = await sr.loadGoodreadsBooks(artist)
      setGoodReadsBooks(works)
    } catch (err) {
      //console.log(`error getting goodreads books`, err);
    }
  }

  async function getWikipediaPage(pageName = "radiohead") {
    try {
      let page = await sr.loadWikipediaPage(pageName)
      setWikipediaArticle(page)
    } catch (err) {
      //console.log("error getting wikipedia artile", err);
    }
  }

  async function getSpotifyData(artist = "radiohead") {
    try {
      let spotifyArtist = await sr.loadSpotifyArtist(artist)
      setSpotifyArtist(spotifyArtist)
      setLoading(false)
      let albums = await sr.loadSpotifyArtistAlbums(spotifyArtist.id)
      setSpotifyAlbums(albums)
    } catch (err) {
      setSpotifyArtist({})
    }
  }

  async function getLibgenData(query = "radiohead") {
    try {
      let entries = await sr.loadLibgenEntries(query)
      setLibgenQuery(query)
      setLibgenEntries(entries)
    } catch (err) {
      //console.log(err);
      setLibgenEntries([])
      setLibgenError(err)
      setLibgenQuery(query)
    }
  }

  async function getDiscogsId(name = "radiohead") {
    try {
      let id = await sr.searchForDiscogsArtist(name)
      loadDiscogsArtist(id)
      loadDiscogsArtistReleases(id)
    } catch (err) {
      //console.log("error getting discogs data", err);
      setDiscogsErr(true)
    }
  }

  async function getImslpWorksTable(artist) {
    try {
      let table = await sr.loadImslpWorksTable(artist)
      setImslpWorksTable(parse(table))
    } catch (err) {
      //console.log("error getting imslp table", err);
    }
  }

  function loadDiscogsArtist(id) {
    db.getArtist(id)
      .then(artist => {
        //console.log("discogs artist", artist);
        setDiscogsArtist(artist)

        if (has(artist.urls)) {
          for (let url of artist.urls)
            if (url.match(/bandcamp.com/)) getBandcampData(url)
        }
      })
      .catch(err => {
        setTimeout(loadDiscogsArtist, 61000)
      })
  }
  function loadDiscogsArtistReleases(id) {
    db.getArtistReleases(id)
      .then(rlss => {
        //console.log("SDFSDF", rlss);
        setDiscogsReleases(rlss)
      })
      .catch(err => {
        setTimeout(loadDiscogsArtistReleases, 61000)
      })
  }

  async function getBandcampData(url, artist) {
    try {
      let [methodOneIds, methodTwoIds] = await Promise.all([
        url ? sr.loadBandcampAlbumIds(url) : Promise.resolve(null),
        artist ? sr.loadBandcampHomepage(artist) : Promise.resolve(null),
      ])
      let ids = await sr.loadBandcampAlbumIds(url)
      setBandcampAlbumIds(methodOneIds || methodTwoIds)
    } catch (err) {
      //console.log("error getting bandcamp album ids", err);
      setBandcampAlbumIds([])
    }
  }

  return (
    <>
      <div
        style={{
          display: "inline-block",
          transform: "scale(0.7)",
          width: "50%",
        }}
      >
        <TextField
          autoFocus={false}
          fullWidth={true}
          label="artist"
          name="artist"
          autoComplete="off"
          variant="standard"
          onChange={handleArtistEntry}
          onKeyDown={e => {
            if (e.keyCode === 13) load()
          }}
        />
      </div>

      <div
        style={{
          display: "inline-block",
          width: "27%",
          marginLeft: "20px",
          position: "relative",
          top: "12px",
        }}
      >
        <Button
          style={{ transform: "scale(0.7)" }}
          variant="outlined"
          size="small"
          onClick={load}
        >
          load
        </Button>
      </div>

      {/*!loaded ? null :
          <Hideable hide name="usage notes">
            <p>
              The artist explorer gets information from multiple services. Some,
              like Library Genesis, are often down. Others, like Discogs, limit
              the amount of information that can be transferred per minute. It
              might take a few minutes to get everything ready.
            </p>
          </Hideable>
        */}

      {has(discogsArtist) || has(spotifyArtist) ? (
        <>
          <Centered>
            <HorizontalLine />
            <H2 style={{ marginTop: 20, marginBottom: 20 }}>
              {spotifyArtist.name || discogsArtist.name}
            </H2>
            <HorizontalLine />
            <br />
            <br />
          </Centered>
          {!empty(spotifyArtist.images) ? (
            (() => {
              let n = spotifyArtist.images[1]
              return (
                <Centered>
                  <img
                    src={n.url}
                    width={n.width}
                    height={n.height}
                    alt="artist photos"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </Centered>
              )
            })()
          ) : (
            <></>
          )}
          {has(discogsArtist) && has(discogsArtist.urls) ? (
            <div style={{ marginBottom: 30 }}>
              <Centered>
                {discogsArtist.urls.map(url => (
                  <>
                    <A href={url} target="_blank" rel="noopener noreferrer">
                      <span style={{ fontSize: "12px" }}>
                        <em>{url}</em>
                      </span>
                      <br />
                    </A>
                  </>
                ))}
              </Centered>
            </div>
          ) : null}
          {has(wikipediaSearch) && empty(wikipediaArticle)
            ? (() => {
                let res = []
                for (let i = 0; i < 6 && i < wikipediaSearch.length; i++) {
                  res.push(
                    <Button
                      style={{
                        transform: "scale(0.7)",
                        transformOrigin: "top left",
                      }}
                      size="small"
                      onClick={e => getWikipediaPage(wikipediaSearch[i].title)}
                    >
                      {wikipediaSearch[i].title}
                    </Button>
                  )
                }
                return (
                  <Centered>
                    <H3>select wikipedia article</H3>
                    {res}
                  </Centered>
                )
              })()
            : null}
          {has(wikipediaArticle)
            ? (() => {
                let sections = wikipediaArticle.split(/={2,3}/g)

                sections = sections.map(x => x.trim())
                let idx = sections.findIndex(x => x.match(/Discography/))

                if (idx !== -1) sections = sections.slice(0, idx)
                let [first, ...rest] = sections
                return (
                  <>
                    <Centered>
                      <H3>wikipedia</H3>
                    </Centered>
                    <div style={{ fontSize: "93%" }}>
                      <p>{first}</p>
                      {has(rest) ? (
                        <Hideable hide atEndToo name="rest">
                          {rest.map(section => {
                            if (section.length < 100) return <H4>{section}</H4>
                            if (section.match("\n"))
                              return section.split("\n").map(x => <p>{x}</p>)
                            return <p>{section}</p>
                          })}
                        </Hideable>
                      ) : null}
                    </div>
                  </>
                )
              })()
            : loaded
            ? null /*<Waiting for="wikipedia" />*/
            : null}
          {has(journalism) ? (
            <>
              <H2 style={{ marginTop: 30 }}>journalism/research scrape</H2>
              {/*<p>Debug for phone: {journalism[0]["Redbull Music Academy"]}</p>*/}
              <Hideable hide atEndToo name="Journalism">
                {journalism.map(source => {
                  let name = Object.keys(source)[0]
                  let urls = source[name]
                  return (
                    <div style={{ marginBottom: 20 }}>
                      {has(urls) ? <H4>{name}</H4> : null}
                      {has(urls) &&
                        urls.map(url => (
                          <>
                            <A
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "block",
                                marginBottom: 0,
                                overflowWrap: "break-word",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                            >
                              <span
                                style={{
                                  marginLeft: 20,
                                  display: "block",
                                  marginBottom: 0,
                                  fontSize: 12,
                                }}
                              >
                                {url}
                              </span>
                            </A>
                          </>
                        ))}
                    </div>
                  )
                })}
              </Hideable>
            </>
          ) : null}
          {has(imslpWorksTable) ? (
            <>
              <H2>imslp works list</H2>
              <Hideable hide atEndToo name="imslp works list">
                <ScrollableTable>
                  <Table>
                    <TableBody>
                      {(() => {
                        // we want to keep track of the index of the title column
                        // so that we can use it to link to youtube videos
                        // of a composition later.
                        let titleColumnIndex = null
                        return imslpWorksTable[0].children.map(
                          (row, rowIndex) => (
                            <TableRow>
                              {(() => {
                                let title = ""
                                return [...row.children, "TITLE"].map(
                                  (cell, cellIndex) => (
                                    <TableCell>
                                      {(() => {
                                        let recurseDown = node => {
                                          if (!node || empty(node)) return []
                                          if (
                                            Array.isArray(node) &&
                                            node.length === 1
                                          ) {
                                            return [recurseDown(node[0])]
                                          }
                                          if (Array.isArray(node)) {
                                            return [
                                              recurseDown(node[0]),
                                              ...recurseDown(node.slice(1)),
                                            ]
                                          }
                                          //fix attribs
                                          let attrs = node.attribs
                                          if (attrs) {
                                            if (attrs.style) delete attrs.style
                                            if (attrs.href) {
                                              attrs.target = "_blank"
                                              attrs.rel = "noopener noreferrer"
                                              if (attrs.href[0] === "/")
                                                attrs.href =
                                                  "https://imslp.org" +
                                                  attrs.href
                                            }
                                          }

                                          if (node.type === "text") {
                                            let text = node.data.replace(
                                              /&#39;/g,
                                              "'"
                                            )
                                            text = text.replace(/&quot;/g, '"')
                                            text = text.replace(
                                              /&#x266d;/g,
                                              "b"
                                            )
                                            text = text.replace(
                                              /&#x266f;/g,
                                              "#"
                                            )
                                            if (
                                              text === "Title" &&
                                              rowIndex === 0
                                            ) {
                                              titleColumnIndex = cellIndex
                                            }
                                            if (
                                              cellIndex === titleColumnIndex &&
                                              rowIndex > 0
                                            ) {
                                              title += text
                                            }
                                            return text
                                          } else if (
                                            node.name === "br" ||
                                            node.name === "hr"
                                          ) {
                                            return React.createElement(
                                              node.name
                                            )
                                          }
                                          return React.createElement(
                                            node.name,
                                            attrs ? attrs : {},
                                            node.children
                                              ? recurseDown(node.children)
                                              : null
                                          )
                                        }
                                        if (cell === "TITLE") {
                                          if (title)
                                            return (
                                              <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURI(
                                                  `${loaded} ${title})}`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                search youtube
                                              </a>
                                            )
                                          else return null
                                        }
                                        return recurseDown(cell.children)
                                      })()}
                                    </TableCell>
                                  )
                                )
                              })()}
                            </TableRow>
                          )
                        )
                      })()}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              </Hideable>
            </>
          ) : null}
          {!empty(spotifyAlbums) ? (
            [
              ["album", "Spotify Albums"],
              ["single", "Spotify Singles"],
              //["appears_on", "Spotify Appearances"],
              //["compilation", "Spotify Compilations"]
            ].map(([prop, title]) => {
              return (
                <>
                  {spotifyAlbums[prop] ? (
                    <AlbumTable
                      parentArtist={loaded}
                      name={title.toLowerCase()}
                      array={spotifyAlbums[prop]}
                    />
                  ) : null
                  //<Centered>empty</Centered>
                  }
                </>
              )
            })
          ) : (
            <Waiting for="spotify" />
          )}
          {has(bandcampAlbumIds) ? (
            <>
              <H2>bandcamp releases</H2>
              <Hideable hide atEndToo name="bandcamp releases">
                <Centered>
                  {bandcampAlbumIds.map(id => (
                    <Centered>
                      <BandcampLoader id={id} />
                    </Centered>
                  ))}
                </Centered>
              </Hideable>
            </>
          ) : null}
          <H2>discogs releases</H2>
          {!empty(discogsReleases.releases) ? (
            <Hideable hide atEndToo name="discogs releases">
              <ScrollableTable>
                <Table style={{ width: "100%" }}>
                  <TableBody>
                    {discogsReleases.releases.map(release => {
                      if (release.artist !== "Various")
                        return (
                          <DiscogsReleaseRow
                            db={db}
                            primaryArtist={loaded}
                            parent={release}
                          />
                        )
                      else return <></>
                    })}
                  </TableBody>
                </Table>
              </ScrollableTable>
            </Hideable>
          ) : discogsErr ? (
            <Centered>
              Discogs requests were rate limited. Try again in a moment.
            </Centered>
          ) : (
            <Waiting for="discogs" />
          )}
          {has(goodReadsBooks) ? (
            <>
              <H2>goodreads search</H2>
              <Hideable hide name="goodreads search">
                <ScrollableTable>
                  <Table>
                    <TableBody>
                      {(() => {
                        let render = book => {
                          return (
                            <TableRow>
                              <TableCell>
                                {book["original_publication_year"]._text}
                              </TableCell>
                              <TableCell>
                                {book["best_book"].author.name._text}
                              </TableCell>
                              <TableCell>
                                {book["best_book"].title._text}
                              </TableCell>
                              <TableCell>
                                <img
                                  alt="cover"
                                  style={{ maxWidth: "50px" }}
                                  src={
                                    book["best_book"]["small_image_url"]
                                      ._text ||
                                    book["best_book"]["image_url"]._text
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  onClick={e =>
                                    getLibgenData(book["best_book"].title._text)
                                  }
                                >
                                  search libgen
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        }

                        if (goodReadsBooks.length > 1)
                          return goodReadsBooks.map(render)
                        else return render(goodReadsBooks)
                      })()}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              </Hideable>
            </>
          ) : null}
          {has(libgenEntries) ? (
            <>
              <H2>library genesis search ("{libgenQuery}")</H2>
              <Hideable hide name="library genesis search">
                <ScrollableTable>
                  <Table>
                    <TableBody>
                      {libgenEntries.map(entry => (
                        <TableRow>
                          <TableCell>{entry.year}</TableCell>
                          <TableCell>{entry.title}</TableCell>
                          <TableCell>{entry.author}</TableCell>

                          <TableCell>{entry.language}</TableCell>
                          <TableCell>{entry.publisher}</TableCell>
                          <TableCell>
                            <a
                              href={`https://b-ok.org/md5/${entry.md5}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {entry.extension}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              </Hideable>
            </>
          ) : empty(libgenError) ? (
            <>
              <H2>library genesis search ("{libgenQuery}")</H2>
              <Waiting for="library genesis" />
            </>
          ) : (
            <H2>library genesis search ("{libgenQuery}")</H2>
          )}
        </>
      ) : !loading ? (
        <>
          <br />
          <br />
          <span style={{ fontSize: 12 }}>
            <LoadingAnimation duration="3s">enter artist....</LoadingAnimation>
          </span>
        </>
      ) : (
        <>
          <br />
          <br />
          <Waiting for="server" />
        </>
      )}
      {/*</NoMobile>*/}
    </>
  )
}

export default ArtistExplorer
