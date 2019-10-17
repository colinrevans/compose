import styled from "styled-components";
import * as theme from "./theme";

export const HangIndent = styled.div`
  display: inline;
  * {
    text-indent: -1.7em;
    padding-left: 1.7em;
  }
`;

export const Centered = styled.div`
  margin: auto;
  width: 100%;
  text-align: center;
`;

export const NoSpace = styled.div`
  margin: 0px;
  padding: 0px;
  position: absolute;
`;
