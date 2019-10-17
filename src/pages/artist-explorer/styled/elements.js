import * as theme from "./theme";
import styled from "styled-components";

export const Footer = styled.footer`
  color: lightgrey;
  position: fixed;
  bottom: 15px;
  left: 15px;
  font-family: "Helvetica", sans-serif;
  font-weight: lighter;
  font-size: 80%;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH} + 100) {
    display: none;
  }
`;

export const DullP = styled.div`
  display: inline;
  * {
    margin: 0;
    padding: 0;
    display: inline;
    p {
      margin: 0;
      padding: 0;
      display: inline;
    }
    span {
      display: inline;
    }
  }
`;

export const OnlyMobile = styled.div`
  display: inline;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    display: inline-block;
  }
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    display: none;
  }
`;

export const NoMobile = styled.div`
  display: inline;
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    display: none;
  }
`;

export const Topbar = styled.div`
  width: 100%;
  height: 2px;
  background-color: ${theme.TOPBAR_COLOR};
  position: fixed;
  box-shadow: 0px 1px 2px #888888;
  z-index: 10;
`;

export const Embed = styled.div`
  margin-top: 30px;
  margin-bottom: 30px;
  @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
  @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
`;

export const YoutubeLinkEmbed = styled(Embed)`
  margin-top: -20px;
  padding-left: 10px;
  a {
    color: {theme.LINK_UP_COLOR};
  }
`;
