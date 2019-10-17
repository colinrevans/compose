import React from "react"
import { MDXProvider } from "@mdx-js/react"
import SEO from "./seo"
import shortcodes from "./base/shortcodes"

export default function PageTemplate({ path, children, pageContext }) {
  console.log("path, ", path)
  console.log("children, ", children)
  console.log("page context", pageContext)
  return (
    <>
      <SEO title={path.replace(/\//g, "")} />
      <div
        className="pagediv"
        style={{
          marginTop: "5vh",
        }}
      >
        <MDXProvider components={shortcodes}>{children}</MDXProvider>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    </>
  )
}
