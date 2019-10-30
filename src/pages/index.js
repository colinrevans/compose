import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import Compose from "./compose"

const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const IndexPage = ({ data }) => {
  const { edges: posts } = data.allSitePage
  // temporarily reroute to compose app proper.
  return (
    <Layout>
      <style jsx>{`
        a {
          font-size: 13px;
          color: black;
          text-decoration: none;
          border-bottom: none;
        }
        span {
          font-size: 13px;
        }

        a:hover {
          transition: 0.5s;
          color: #999999;
        }
      `}</style>
      <SEO title="Home" />
      <div
        style={{
          position: "fixed",
          left: "20vw",
          top: "20vh",
          fontFamily,
          lineHeight: "2.5em",
        }}
      >
        <Link to="/blog/1">blog</Link>
        <br />
        <Link to="/compose">compose</Link>
        <br />

        {posts
          .filter(({ node: post }) => !post.path.match(/blog/))
          .map(({ node: post }) => (
            <>
              <Link key={post.path} to={post.path}>
                {post.path.replace(/\//g, "").replace(/-/g, " ")}
              </Link>
              <br />
            </>
          ))}
        <div style={{ width: 50, display: "inline-block" }} />
      </div>
      <span style={{ position: "fixed", left: 20, bottom: 20, fontFamily }}>
        colin evans
      </span>
    </Layout>
  )
}

export const pageQuery = graphql`
  query indexPage {
    allSitePage(filter: { componentPath: { regex: "/mdx/" } }) {
      edges {
        node {
          path
        }
      }
    }
  }
`

export default IndexPage
