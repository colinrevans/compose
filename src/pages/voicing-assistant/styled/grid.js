import styled from "styled-components";
import * as theme from "./theme";

export const Grid = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: ${theme.SIDEBAR_WIDTH} ${50 -
      parseInt(theme.SIDEBAR_WIDTH)}vw 50vw;
  grid-template-rows: 1fr 1fr 1fr;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    grid-template-areas:
      "content content content"
      "content content content"
      "content content content";
  }
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    grid-template-areas: ${props =>
      props.fullscreen
        ? `"content content content"
    "content content content"
    "content content content"`
        : `"sidebar content content"
    "sidebar content content"
    "sidebar content content"`};
  }
`;

export const GridSidebar = styled.div`
  grid-area: sidebar;
  width: 100%;
  height: 50px;
  z-index: 9;
`;

export const GridContent = styled.div`
  grid-area: content;
  margin-left: 5%;
  margin-right: ${props => (props.fullscreen ? "5%" : "15%")};
  margin-top: 10px;
  margin-bottom: 100px;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    max-width: ${props => (props.fullscreen ? "100%" : "90%")};
    margin-right: 5%;
  }
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    max-width: ${props => (props.fullscren ? "100%" : "90%")};
  }
  @media screen and (min-width: 800px) {
    width: ${props => (props.fullscreen ? "100%" : "85%")};
  }
  @media screen and (min-width: 1200px) {
    width: ${props => (props.fullscreen ? "100%" : "85%")};
    margin-left: ${props => (props.fullscreen ? "5%" : "0%")};
    margin-right: ${props => (props.fullscreen ? "5%" : "0%")};
  }
`;
