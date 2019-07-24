import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"

const IndexPage = ({ data }) => {
  const { edges: posts } = data.allSitePage
  return (
    <Layout>
      <SEO title="Home" />
      <br />
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
