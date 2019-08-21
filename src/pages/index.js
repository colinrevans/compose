import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import Compose from "./compose"

const IndexPage = ({ data }) => {
  const { edges: posts } = data.allSitePage
  // temporarily reroute to compose app proper.
  return <Compose />
  return (
    <Layout>
      <SEO title="Home" />
      <Link to="/text-memorizer">text-memorizer</Link>
      <br />
      <Link to="/compose">compose</Link>
      <br />
      {posts.map(({ node: post }) => (
        <>
          <Link key={post.path} to={post.path}>
            {post.path.replace(/\//g, "")}
          </Link>
          <br />
        </>
      ))}
      <br />
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
