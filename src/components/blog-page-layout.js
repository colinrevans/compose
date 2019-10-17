import React from "react"
import { MDXProvider } from "@mdx-js/react"
import SEO from "./seo"
import shortcodes from "./base/shortcodes"
import Breadcrumb from "./base/Breadcrumb"
import Date from "./base/Date"

export default function BlogTemplate({ path, children, pageContext }) {
  console.log("path", path)
  console.log("children", children)
  console.log("page context", pageContext)
  return (
    <>
      <SEO title={path.replace(/\//g, "")} />
      <div
        className="pagediv"
        style={{
          marginTop: "30px",
          verticalAlign: "top",
        }}
      >
        <div style={{ marginBottom: "1.45rem" }}>
          <Breadcrumb
            to="/blog/1"
            br="blog"
            style={{ display: "inline", marginBottom: 0 }}
          >
            {pageContext.frontmatter.title}
          </Breadcrumb>
          <br />
          <div style={{ textAlign: "left" }}>
            <Date style={{ color: "#BBBBBB" }}>
              {pageContext.frontmatter.date.substr(0, 10)}
            </Date>
          </div>
        </div>
        <MDXProvider components={shortcodes}>{children}</MDXProvider>
        <br />
      </div>
    </>
  )
}
