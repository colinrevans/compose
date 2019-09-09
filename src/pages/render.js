import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import SVGContext from "../lib/render/svg-context.js"
import Notehead from "../lib/render/note.js"

const IndexPage = ({ data }) => {
  return (
    <div
      style={{
        position: "fixed",
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }}
    >
      <SVGContext width={400} height={400}>
        <Notehead />
      </SVGContext>
    </div>
  )
}

export default IndexPage
