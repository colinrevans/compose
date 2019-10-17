import TimeSignature from "../../../lib/music/system"
import Staff from "../../../lib/music/staff"
import Voice from "../../../lib/music/voice"
import Rest from "../../../lib/music/rest"
import Note from "../../../lib/music/note"
import Verticality from "../../../lib/music/verticality.js"
import Duration from "../../../lib/music/duration.js"
import Clef from "../../../lib/music/clef"
import System from "../../../lib/music/system.js"

export const applyFnToElemAndChildren = (fn, elem) => {
  if (elem.children.length > 0) {
    fn(elem)
    for (let child of elem.children) {
      applyFnToElemAndChildren(fn, child)
    }
  } else {
    fn(elem)
  }
}

export const convertSavedMusicFromJSON = json => {
  let saved = []
  for (let ent of json.music) {
    if (ent.type === "time-signature")
      saved.push(
        new TimeSignature(ent.numerator, ent.denominator).at(ent.position)
      )
    else if (ent.type === "clef") {
      saved.push(new Clef(ent.clefType).at(ent.position))
    } else if (ent.type === "voice")
      saved.push(
        new Voice(
          ent.temporals.map(temp => {
            if (temp.type === "rest")
              return new Rest(
                new Duration(temp.duration.numerator, temp.duration.denominator)
              )
            else if (temp.type === "verticality")
              return new Verticality(
                temp.notes.map(n => new Note(n.letter, n.accidental, n.octave)),
                new Duration(temp.duration.numerator, temp.duration.denominator)
              )
          })
        ).at(ent.position)
      )
  }
  return new System(new Staff(saved))
}
