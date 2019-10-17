import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
`;

export const FadeIn = styled.div`
  display: inline;
  animation: ${fadeIn} ${props => (props.duration ? props.duration : "2.5s")}
    linear forwards;
`;
