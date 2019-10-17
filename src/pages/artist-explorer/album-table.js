import empty from "is-empty"
import { Hideable } from "./hideable"
import React from "react"
import { SpotifyAlbumRow } from "./spotify-album-row"
import Table from "@material-ui/core/Table"
import TableBody from "@material-ui/core/TableBody"
import H2 from "../../components/base/H2"
import { ScrollableTable } from "./styled"

export const AlbumTable = props => {
  return empty(props.array) ? null : (
    <>
      <H2>{props.name}</H2>
      <Hideable
        atEndToo={props.array.length > 3 ? true : false}
        hide
        name={props.name}
      >
        <div style={{ display: "block", width: "100%" }}>
          <ScrollableTable>
            <Table style={{ width: "100%" }}>
              <TableBody>
                {props.array.map(album => (
                  <SpotifyAlbumRow
                    primaryArtist={props.parentArtist}
                    album={album}
                    height="160"
                  />
                ))}
              </TableBody>
            </Table>
          </ScrollableTable>
        </div>
      </Hideable>
    </>
  )
}
