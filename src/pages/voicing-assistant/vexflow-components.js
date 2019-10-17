import React, { useState, useEffect } from "react";
import { easyScoreToExactNotes, voicingToEasyScore } from "./music.js";
import { FadeIn } from "./styled/animations";
import * as theme from "./styled/theme";
import Vex from "vexflow";
import styled, { keyframes } from "styled-components";

const DownTriangle = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  bottom: 7px;
  right: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid black;
`;

const fadeInOutKeyframe = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-300px);
  }
  50% {
    opacity: 0.4;
    transform: translateX(0px);
  }
  100% {
    opacity: 0;
    transform: translateX(200px);
  }
`;

const dashKeyframe = keyframes`
  80% {
    stroke-dashoffset: 0;
  }
`;

export const VexflowFadeInOut = styled.div`
  display: inline;
  animation: ${fadeInOutKeyframe} 2s linear forwards;
  [stroke="#999999"] {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: ${dashKeyframe} 4s linear forwards;
  }
  svg {
    animation: ${fadeInOutKeyframe} 2s linear forwards;
  }
`;

export const VexflowAnimation = props => {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!rendered) {
      renderScore(props.name);
      setRendered(true);
    }
  });

  const renderScore = (id, width = 400, height = 400) => {
    const VF = Vex.Flow;
    let vf = new VF.Factory({
      renderer: { elementId: id, width: width, height: height }
    });

    let score = vf.EasyScore();
    let system = vf.System();

    system
      .addStave({
        voices: [
          score.voice(score.notes("C#5/q, B4, A4, G#4", { stem: "up" })),
          score.voice(score.notes("C#4/h, C#4", { stem: "down" }))
        ]
      })
      .addClef("treble")
      .addTimeSignature("6/8");

    system
      .addStave({
        voices: [
          score.voice(score.notes("C5/q, B4, A4, G4", { stem: "up" })),
          score.voice(score.notes("C4/h, C4", { stem: "down" }))
        ]
      })
      .addClef("bass")
      .addTimeSignature("6/8");

    vf.draw();
  };
  return (
    <VexflowFadeInOut>
      <div style={{ display: "inline" }}>
        <div id={props.name} />
      </div>
    </VexflowFadeInOut>
  );
};

const VexPlaybackButton = styled.button`
  position: absolute;
  margin-top: 25px;
  transition: 0.2s;
  box-shadow: 0px 1px 2px #888888;
  background-color: rgb(250, 248, 248);
  :hover {
    border-color: rgb(126, 126, 126);
    transition: 0.2s;
  }
`;

const VexHover = styled.span`
  position: absolute;
  bottom: 10px;
  text-align: center;
  transition: 3s;
  //width: 200px;
  right: 0px;
  height: 0;
  svg {
    position: absolute;
    background-color: white;
    height: ${props => (props.twoStave ? "240px" : "115px")};
    width: 135px;
    outline: 1px solid rgb(41, 41, 41);
    box-shadow: 0px 1px 5px rgb(41, 41, 41);
    z-index: 12;
    margin: 0;
    padding: 0;
    bottom: 15px;
    @media screen and (max-width: ${theme.RESPONSIVE_WIDTH}) {
      position: absolute;
      right: -68px;
    }
    @media (hover: none) {
      position: fixed;
      right: calc(50vw - 135px / 2);
      bottom: 50vh;
    }
    @media screen and (min-width: ${theme.RESPONSIVE_WIDTH}) {
      right: -68px;
    }
  }
  svg > * {
    display: inline;
    position: absolute;
    margin: 0;
    padding: 0;
    transform: translateY(-17px);
  }
  * {
    display: inline;
    position: absolute;
  }
`;

const VexHoverSpan = styled.span`
  display: inline;
  margin: 0;
  padding: 0;
  text-align: center;
  color: ${theme.POST_FONT_COLOR};
  transition: 0.5s;
  text-decoration: underline double;
  :hover {
    transition: 0.5s;
    color: ${theme.LINK_UP_COLOR};
  }
  ${props => props.textStyle}
`;

const VexHoverPositioner = styled.span`
  position: relative;
  width: 0;
  margin: 0;
`;

export const PageMask = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 11;
  display: none;
  @media (hover: none) {
    display: block;
  }
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;

export const VexflowHover = props => {
  const [isHovering, setIsHovering] = useState(false);
  const [twoStave, setTwoStave] = useState(false);

  const handleMouseHover = () => {
    setIsHovering(!isHovering);
  };

  const removeMask = () => {
    setIsHovering(false);
  };

  const handleTwoStave = bool => {
    setTwoStave(bool);
  };

  return (
    <>
      <VexHoverPositioner
        onMouseEnter={handleMouseHover}
        onMouseLeave={removeMask}
      >
        <VexHoverSpan textStyle={props.textStyle}>{props.voicing}</VexHoverSpan>
        {isHovering ? (
          <VexHover twoStave={twoStave}>
            <FadeIn duration="0.2s">
              <Vexflow
                width={20}
                name={"vex-" + props.voicing}
                easyscore={voicingToEasyScore(props.voicing)}
                playback={false}
                onTwoStave={handleTwoStave}
              />
              <DownTriangle />
              <PageMask onTouchStart={removeMask} />
            </FadeIn>
          </VexHover>
        ) : (
          <></>
        )}
      </VexHoverPositioner>
    </>
  );
};

export const Vexflow = props => {
  useEffect(() => {
    removeSVGs();
    renderEasyScore(props.name, props.easyscore);
  });

  let onTwoStave = props.onTwoStave !== undefined ? props.onTwoStave : () => {};

  const tone = () => {
    if (props.easyscore === "D5/w/r") return;
    if (!props.synth.loaded) {
      return;
    }
    let notes = [];

    if (needBassClef(props.easyscore)) {
      let [bass, treble] = splitToPianoStave(
        dropNotesByOctaves(
          props.easyscore,
          2 + Math.floor((needBassClef(props.easyscore) - 6) / 2)
        )
      );
      let bassNotes = easyScoreToExactNotes(bass);
      let trebleNotes = easyScoreToExactNotes(treble);
      notes = bassNotes.concat(trebleNotes);
    } else {
      notes = easyScoreToExactNotes(props.easyscore);
    }

    props.synth.triggerAttackRelease(notes, "2n");
  };

  const needBassClef = scr => {
    let lastNote = scr.replace(/.+ (.+)\)\/w$/, "$1");
    //if highest note is higher than G6
    let oct = parseInt(lastNote.match(/\d+$/));
    if (oct >= 6) return oct;
    //if (oct === 5 && ["G", "F", "E", "D"].includes(lastNote[0])) return oct;
    else return false;
  };

  const dropNotesByOctaves = (scr, numOctaves = 1) => {
    //rest?
    if (scr === "D5/w/r") return scr;

    //single note?
    if (!scr.match(/\(/)) {
      let oct = parseInt(scr.match(/\d+/)) - numOctaves;
      return scr.replace(/.(?=\/)/, oct);
    }

    //chord
    scr = notesInEasyScore(scr)
      .map(x => {
        let oct = parseInt(x.match(/\d+$/)) - numOctaves;
        if (oct < 0) return "";
        return x.replace(/\d+$/, oct);
      })
      .join(" ")
      .trim();
    return "(" + scr + ")/w";
  };

  const notesInEasyScore = scr => {
    return scr.replace(/^\((.+)\)\/w$/, "$1").split(" ");
  };

  const splitToPianoStave = scr => {
    let notes = notesInEasyScore(scr);
    let idx = notes.findIndex(x => parseInt(x.substr(-1)) >= 4);
    // if nothing fits well in a treble clef, split w/ notes an octave higher
    if (idx === -1) return splitToPianoStave(dropNotesByOctaves(scr, -1));
    return [notes.slice(0, idx), notes.slice(idx)].map(x => {
      if (x.length === 1) return x + "/w";
      return "(" + x.join(" ") + ")/w";
    });
  };

  const renderEasyScore = (
    id,
    easyscore,
    width = props.width,
    height = props.height
  ) => {
    const VF = Vex.Flow;
    let vf = new VF.Factory({
      renderer: { elementId: id, width: width, height: height }
    });

    let score = vf.EasyScore();
    let system = vf.System();

    if (needBassClef(easyscore)) {
      let [bass, treble] = splitToPianoStave(
        dropNotesByOctaves(
          easyscore,
          2 + Math.floor((needBassClef(easyscore) - 6) / 2)
        )
      );
      system
        .addStave({
          voices: [score.voice(score.notes(treble, { stem: "up" }))]
        })
        .addClef("treble");

      system
        .addStave({
          voices: [score.voice(score.notes(bass, { clef: "bass", stem: "up" }))]
        })
        .addClef("bass");

      system.addConnector();
      onTwoStave(true);
    } else {
      system
        .addStave({
          voices: [score.voice(score.notes(easyscore, { stem: "up" }))]
        })
        .addClef(props.overrideClef || "treble");

      system.addConnector();
      onTwoStave(false);
    }

    vf.draw();
  };

  const removeSVGs = () => {
    if (document.getElementById(props.name) === null) return;
    let svgList = document
      .getElementById(props.name)
      .getElementsByTagName("svg");
    for (let i = 0; i < svgList.length; i++) {
      svgList[i].remove();
    }
  };

  return (
    <>
      <div id={props.name} />
      {props.playback ? (
        <VexPlaybackButton disabled={props.synth ? false : true} onClick={tone}>
          play
        </VexPlaybackButton>
      ) : (
        <></>
      )}
    </>
  );
};
