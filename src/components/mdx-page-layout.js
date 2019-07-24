import React from "react"
import { Link } from "gatsby"
import { MDXProvider } from "@mdx-js/react"
import SEO from "./seo"
import { Youtube, Spotify } from "./embeds"

const shortcodes = { Youtube, Spotify }

export default function PageTemplate({ path, children }) {
  return (
    <>
      <SEO title={path.replace(/\//g, "")} />
      <div style={{ margin: 30 }}>
        <MDXProvider components={shortcodes}>{children}</MDXProvider>
        <Link style={{ marginTop: 50, fontSize: "80%" }} to="/">
          home
        </Link>
      </div>
    </>
  )
}
