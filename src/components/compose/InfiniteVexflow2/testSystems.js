import Duration from "../../../lib/music/duration"
import TimeSignature from "../../../lib/music/time-signature.js"
import Verticality from "../../../lib/music/verticality.js"
import System from "../../../lib/music/system"
import Staff from "../../../lib/music/staff"
import Voice, { melody } from "../../../lib/music/voice"

const e = new Duration(1, 2)
const q = new Duration(1, 4)
const testSystems = [
  new System(
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "f4", "e4", "d4").at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System(
    new Staff([
      new Voice([new Verticality(["c4", "e4", "g4"])]).at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System(
    new Staff([
      new Voice([new Verticality(["c4", "e4", "g4"])]).at(0),
      new Voice([new Verticality(["d4", "f4", "a4"])]).at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      melody("e4", "f4", "g4", "a4").at(0),
      new TimeSignature(4, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      melody("f4", "e4", "d4", "c4").at(0),
      new TimeSignature(2, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4").at(0),
      new TimeSignature(3, 4).at(0),
    ]),
  ]),
  new System([
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5")
        .withDurations(e)
        .at(0),
      new TimeSignature(4, 4).at(0),
    ]),
  ]),
  new System(
    new Staff([
      melody("c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5")
        .withDurations(e)
        .at(0),
      melody("c5", "b4", "a4", "g4", "a4", "b4", "c5", "d5")
        .withDurations(e)
        .at(0),
      new TimeSignature(4, 4).at(0),
    ])
  ),
]

export default testSystems
