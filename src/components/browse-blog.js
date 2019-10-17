import React from "react"
import Link from "./base/Link"
import P from "./base/P"
import H2 from "./base/H2"
import Date from "./base/Date"
import Breadcrumb from "./base/Breadcrumb"
import empty from "is-empty"

const BrowseBlogPosts = ({ pageContext }) => {
  const { groupedPosts, group, page } = pageContext

  return (
    <div
      className="pagediv"
      style={{
        marginTop: "30px",
        verticalAlign: "top",
      }}
    >
      <Breadcrumb>blog</Breadcrumb>
      {group.map(({ node }) => {
        const { title, date } = node.frontmatter
        let excerpt = node.excerpt
        return (
          <div key={node.id}>
            <H2 style={{ display: "inline-block" }}>
              <Link to={node.fields.slug} className="grey-hover">
                {title}
              </Link>
            </H2>
            <Date style={{ marginLeft: 20 }}>{date.substr(0, 10)}</Date>
            {empty(excerpt) ? null : (
              <P style={{ color: "#444444", marginLeft: 20 }}>
                {excerpt}
                <Link
                  style={{
                    marginLeft: 20,
                    color: "#999999",
                    textDecoration: "none",
                  }}
                  to={node.fields.slug}
                  className="underline-hover"
                >
                  full
                </Link>
              </P>
            )}
          </div>
        )
      })}
      {groupedPosts.length > 1 ? (
        <footer style={{ marginTop: 200 }}>
          Pages:{" "}
          {groupedPosts.map((x, index) => {
            const currentPage = index + 1
            return (
              <Link
                key={index}
                to={`/blog/${currentPage}`}
                className={currentPage === page ? "active" : null}
              >
                {index + 1}
              </Link>
            )
          })}
        </footer>
      ) : null}
    </div>
  )
}

export default BrowseBlogPosts
