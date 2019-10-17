// shortcodes for MDX provider
import React from "react"
import { Youtube, Spotify } from "../embeds"
import h1 from "./H1"
import { Link } from "gatsby"
import Breadcrumb from "./Breadcrumb"
import h2 from "./H2"
import li from "./Li"
import h3 from "./H3"
import h4 from "./H4"
import Popup from "./Popup"
import A from "./A"
import p from "./P"
import blockquote from "./Blockquote.js"
import Marginalia from "./Marginalia"
import Answers from "./Answers"
import Cite from "./Cite"
import Bibliography from "./Bibliography"
import CitationManager from "./CitationManager"
import Answer from "./Answer"
import { InlineMath, BlockMath } from "react-katex"
import Date from "./Date"
import "katex/dist/katex.min.css"

const None = () => null

export const shortcodes = {
  Youtube,
  Spotify,
  Marginalia,
  Answers,
  qstn: props => <Answer>{props.children}</Answer>,
  m: props => <InlineMath math={props.children ? props.children : props.m} />,
  bm: props => (
    <>
      <BlockMath math={props.children ? props.children : props.m} />
      <br />
    </>
  ),
  h1: Breadcrumb,
  h2,
  Popup,
  h3,
  h4,
  li,
  CitationManager,
  blockquote,
  Date,
  p,
  None,
  Bibliography,
  Cite,
  A,
  e: props => <span style={{ color: "maroon" }}>{props.children}</span>,
}

export default shortcodes
