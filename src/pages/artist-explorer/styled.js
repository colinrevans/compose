import styled, { keyframes } from "styled-components";

const loadingAnimation = keyframes`
  0%{
    opacity: 0
  }
  50%{
    opacity: 1
  }
  100%{
    opacity: 0
  }
`;

export const LoadingAnimation = styled.span`
  animation: ${loadingAnimation} ${props => props.duration} linear infinite;
`;

export const HorizontalLine = styled.div`
  width: 100%;
  margin-top: 20px;
  border-top: 1px solid grey;
  opacity: 0.33;
`;

export const ScrollableTable = styled.div`
  margin-left: 0;
  display: block;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  //white-space: nowrap;
`;

export const Middle = styled.div`
  padding-top: 5vh;
  padding-bottom: 5vh;
  position: fixed;
  right: 20vw;
  width: 60vw;
  top: 10vh;
  height: 70vh;
  background-color: white;
  z-index: 12;
  overflow-y: scroll;
`;

export const PageMask = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 11;
  display: block;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;
