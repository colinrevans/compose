import Voice from "./voice"
import { flatten } from "ramda"
import Rest from "./rest"
import Rational from "./rational"
import Duration from "./duration"
import Verticality from "./verticality"
import TimeSignature from "./time-signature"
import empty from "is-empty"

/**
 * Staff - a collection of the music objects that'd be on a single staff.
 * music objects can be many things (the idea is to keep things flexible and extensible),
 * but the main ones are:
 * - Voices
 * - clefs
 * - key signatures
 * - time signatures
 * - barlines
 * - newlines (when the staff breaks to a new line)
 *
 *
 * when it comes time to render, the staff finds the duration of each item and creates
 * a new representation of the data that's more appropriate for renderina.
 *
 * note that a grand staff, in our taxonomy, is actually a System object with two staves.
 */

class TimingError extends Error {}

export class LineBreak {
  at(n) {
    this.position = n
    return this
  }
}

// staff uses instanceof on these to make sure an object is valid
const permissibleObjects = [Voice, TimeSignature, LineBreak]

class Staff {
  constructor(entities) {
    this.entities = entities
  }

  set entities(entities) {
    if (!Array.isArray(entities))
      throw new TypeError("Staff requires an Array of music objects")
    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i]
      if (
        !permissibleObjects.some(obj => {
          return entity instanceof obj
        })
      ) {
        throw new TypeError(
          `Staff was given an invalid musical object. Must be one of ${permissibleObjects.map(
            x => x.name
          )}`
        )
      }
      if (!entity.position) entity.position = 0
    }
    this._entities = entities.sort((a, b) => a.position - b.position)
  }

  get entities() {
    return this._entities
  }

  locate(obj) {
    if (!this.entities.includes(obj)) throw new Error("object not in staff.")
  }

  includes(obj) {
    return this.entities.includes(obj)
  }

  get timeSignatures() {
    return this.entities.filter(obj => obj instanceof TimeSignature)
  }

  get lineBreaks() {
    return this.entities.filter(obj => obj instanceof LineBreak)
  }

  get voices() {
    return this.entities.filter(obj => obj instanceof Voice)
  }

  get measures() {
    return this.splitVoices()
  }

  splitVoices() {
    let splittedVoices = this.voices.map(v => this.splitVoice(v, v.position))
    let ret = []
    for (let voice of splittedVoices) {
      for (let i = 0; i < voice.length; i++) {
        let measure = voice[i]
        if (ret[i] === undefined)
          ret[i] = { timeSignature: measure.timeSignature, voices: [] }
        ret[i].voices.push({ owner: measure.owner, voice: measure.voice })
      }
    }
    return ret
  }

  // positions of voice's temporals relative to staff's measures.
  positionsOfVoice(voice) {
    if (voice.position === undefined) throw new Error("voice has no position")
    let measures = this.splitVoice(voice, voice.position)
    return flatten(
      measures.map((measure, idx) =>
        measure.voice.positions.map(
          pos => pos / measure.timeSignature.numerator + idx + voice.position
        )
      )
    )
  }

  splitVoice(voice, startingPos) {
    let log
    if (voice.temporals[0].notes)
      if (voice.temporals[0].notes[0].toString() === "E6") {
        log = true

        console.log("LOGGING")
      }
    if (!(voice instanceof Voice))
      throw new TypeError("splitVoice method requires a Voice")
    if (!startingPos) startingPos = voice.position ? voice.position : 0

    let curPos = new Rational(0, 1)
    let splitVoices = []
    let currentMeasure = []
    let sig = this.timeSignatureOfNthMeasure(splitVoices.length + 1)
    for (let temporal of voice.temporals) {
      if (log) console.log("START FOR: ", temporal.toString())
      let durInSig = temporal.durationAccordingToTimeSignatureAsRational(sig)
      if (log) console.log(curPos.plus(durInSig).toString())
      if (curPos.plus(durInSig) <= 1) {
        // this temporal fits inside the current measure.
        curPos = curPos.plus(durInSig)
        if (currentMeasure.length > 0) {
          currentMeasure[currentMeasure.length - 1].next = temporal
          temporal.prev = currentMeasure[currentMeasure.length - 1]
        }

        currentMeasure = [...currentMeasure, temporal]

        if (curPos.numerator % curPos.denominator === 0) {
          // voice durations match the measure cleanly.
          // start a new measure with the next temporal
          let newVoice = new Voice([...currentMeasure])
          newVoice.position = splitVoices.length + startingPos
          splitVoices = [
            ...splitVoices,
            { timeSignature: sig, owner: voice, voice: newVoice },
          ]
          currentMeasure = []
          sig = this.timeSignatureOfNthMeasure(splitVoices.length + 1)
          curPos = new Rational(0, 1)
        }
      } else if (curPos.plus(durInSig) > 1) {
        curPos = curPos.plus(durInSig)
        // we've overshot the barline.
        // split the temporal into two:
        // one temporal before the barline
        // and one after. (from here on out, their 'canonical'
        // will refer to the original temporal)
        // split the note into two. add a tie.
        // add what's left over to next measure.
        let overShotDur = durInSig
        let nextMeasureSig = this.timeSignatureOfNthMeasure(
          splitVoices.length + 2
        )
        let curMeasureSig = sig
        let durInCurMeasure = overShotDur.minus(curPos.minus(1, 1))
        // we have to convert back to beat-wise duration from measure-wise duration
        if (log) console.log("durincurmeasure: ", durInCurMeasure)
        let preDuration = durInCurMeasure.times(
          new Rational(curMeasureSig.numerator, 1)
        )
        if (log) console.log("pre duration: ", preDuration.toString())
        if (log) console.log("temporal duration: ", temporal.duration)
        let postDuration = temporal.duration.duration.minus(preDuration)
        if (log) console.log("post duration: ", postDuration)
        // account for timesignature changes like 4/4 -> 2/2
        postDuration = postDuration.times(
          new Rational(
            1,
            curMeasureSig.denominator / nextMeasureSig.denominator
          )
        )
        if (log) {
          console.log("predur: ", preDuration)
          console.log("postdur: ", postDuration)
        }
        preDuration = new Duration(
          preDuration.numerator,
          preDuration.denominator
        )
        postDuration = new Duration(
          postDuration.numerator,
          postDuration.denominator
        )
        if (log) console.log("didd")
        let firstTemporal
        if (temporal instanceof Verticality) {
          firstTemporal = new Verticality(temporal.notes, preDuration)
          firstTemporal.tie = true
        } else if (temporal instanceof Rest)
          firstTemporal = new Rest(preDuration)
        firstTemporal.canonical = temporal
        firstTemporal.makeCurrent = temporal.makeCurrent
        let secondTemporal
        if (temporal instanceof Verticality) {
          secondTemporal = new Verticality(temporal.notes, postDuration)
          secondTemporal.endTie = true
        } else if (temporal instanceof Rest)
          secondTemporal = new Rest(postDuration)
        secondTemporal.canonical = temporal
        secondTemporal.next = firstTemporal.next
        secondTemporal.prev = firstTemporal
        firstTemporal.next = secondTemporal
        let prevTemporal = currentMeasure[currentMeasure.length - 1]
        prevTemporal.next = firstTemporal
        firstTemporal.prev = prevTemporal
        currentMeasure = [...currentMeasure, firstTemporal]
        let newVoice = new Voice([...currentMeasure])
        currentMeasure = [secondTemporal]
        if (log) console.log("sec: ", secondTemporal)
        newVoice.position = splitVoices.length + startingPos
        splitVoices = [
          ...splitVoices,
          { timeSignature: curMeasureSig, owner: voice, voice: newVoice },
        ]
        sig = nextMeasureSig
        curPos = curPos.minus(1, 1)
      }
    }
    if (log) console.log(currentMeasure)
    if (!empty(currentMeasure)) {
      // we've got some stragglers. add the final measure w/ rests at the end
      let coveredDuration = currentMeasure
        .map(temp => temp.duration)
        .reduce((a, b) => a.plus(b))
      let restLength = new Duration(sig.numerator).minus(coveredDuration)
      if (log) console.log("leftovers")
      splitVoices = [
        ...splitVoices,
        {
          timeSignature: sig,
          owner: voice,
          voice: new Voice([...currentMeasure, new Rest(restLength)]).at(
            splitVoices.length
          ),
        },
      ]
    }
    // preserve links
    for (let i = 1; i < splitVoices.length; i++) {
      let last = x => x[x.length - 1]
      let first = x => x[0]
      last(splitVoices[i - 1].voice.temporals).next = first(
        splitVoices[i].voice.temporals
      )
      first(splitVoices[i].voice.temporals).prev = last(
        splitVoices[i - 1].voice.temporals
      )
    }
    if (log) splitVoices.forEach(v => console.log(v.voice.toString()))
    return splitVoices
  }

  above(voice1, voice2) {
    //console.log("voice1: ", voice1.temporals.map(vert => vert.toString()))
    //console.log("voice2: ", voice2.temporals.map(vert => vert.toString()))
    let voice1positions = this.positionsOfVoice(voice1)
    let voice2positions = this.positionsOfVoice(voice2)
    if (empty(voice1positions) || empty(voice2positions))
      throw new Error("one of the voices given to above is empty")
    let voice2idx = 1
    for (let idx = 0; idx < voice1positions.length; idx++) {
      let voice1position = voice1positions[idx]
      while (voice2positions[voice2idx] < voice1position) {
        voice2idx += 1
      }
      if (
        voice1.temporals[idx] instanceof Rest ||
        voice2.temporals[voice2idx - 1] instanceof Rest
      )
        continue
      let voice1lowest = voice1.temporals[idx].notes[0]
      let voice2highest =
        voice2.temporals[voice2idx - 1].notes[
          voice2.temporals[voice2idx - 1].notes.length - 1
        ]
      if (voice1lowest.midiNoteNumber < voice2highest.midiNoteNumber)
        return false
    }

    return true
  }

  timeSignatureOfNthMeasure(n) {
    if (n <= 0)
      throw new RangeError(
        "invalid measure access. no zeroth or negative measure."
      )
    let signatures = this.timeSignatures
    if (empty(signatures)) throw new Error("no time signatures on staff")
    let positions = signatures.map(sig => {
      if (!Number.isInteger(sig.position))
        throw new TimingError("time signature not at measure boundary")
      return sig.position
    })

    if (positions[0] !== 0)
      throw new TimingError("no time signature at the beginning of the staff.")
    if (n === 1) return signatures[0]

    for (let i = 1; i < positions.length; i++) {
      if (n > positions[i - 1] && n < positions[i]) {
        return signatures[i - 1]
      }
    }
    return signatures[signatures.length - 1]
  }
}

export default Staff
