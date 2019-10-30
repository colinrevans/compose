import Duration from "./duration"
import { isTemporal } from "./util"

/**
 * Rest --
 * ie just a duration, or
 * a verticality with no notes or
 * a duration with Voice interop
 *
 * a rest is a 'temporal', our name for a rest or a verticality
 * ie something with a duration that gets put on a staff.
 */

class Rest {
  constructor(duration = new Duration(1)) {
    this.duration = duration
    this.canonical = this
    this.owner = null
    this._next = null
    this._prev = null
  }

  set duration(duration) {
    if (typeof duration === "number") duration = new Duration(duration)
    if (!(duration instanceof Duration))
      throw new TypeError("Rest constructor given a non-Duration")
    this._duration = duration
  }

  get duration() {
    return this._duration
  }

  set next(temporal) {
    if (temporal === null || isTemporal(temporal)) this._next = temporal
    else
      throw new TypeError(
        "rest must be linked to Rests or Verticalities (temporals)"
      )
  }
  get next() {
    return this._next
  }
  set prev(temporal) {
    if (temporal === null || isTemporal(temporal)) this._prev = temporal
    else
      throw new TypeError(
        "rest must be linked to Rests or Verticalities (temporals)"
      )
  }
  get prev() {
    return this._prev
  }

  copy() {
    return new Rest(this.duration.copy())
  }

  insertAfter(temporal) {
    if (!this.owner) throw new Error("Rest has no owner. Insert impossible.")
    this.owner.addAfterIdx(temporal, this.owner.indexOf(this.canonical))
  }

  setDOMId(id) {
    this.DOMId = id
    return this
  }

  deleteFromOwningVoice(addMakeCurrentFlag = false) {
    if (!this.owner) throw new Error("Rest has no owner. Delete impossible.")
    if (this.owner.temporals.length === 1) {
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
      return
    }
    if (this === this.canonical) {
      this.owner.deleteAtIdx(
        this.owner.indexOf(this.canonical),
        addMakeCurrentFlag
      )
    } else {
      this.canonical.duration = this.canonical.duration.minus(this.duration)
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
    }
  }

  get vexflowRepresentation() {
    return {
      duration: this.duration.vexflowRepresentation + "r",
      keys: ["b/4"],
    }
  }

  durationAccordingToTimeSignature(sig) {
    return this.duration.durationAccordingToTimeSignature(sig)
  }

  durationAccordingToTimeSignatureAsRational(sig) {
    return this.duration.durationAccordingToTimeSignatureAsRational(sig)
  }

  associateWithDOMId(id) {
    this.DOMId = id
  }

  addLinks(prev, next) {
    this.prev = prev
    this.next = next
    return this
  }

  get beats() {
    return this.duration.valueOf()
  }

  toString() {
    return `rest : ${this.duration}`
  }

  toJSON() {
    return {
      type: 'rest',
      duration: this.duration.toJSON()
    }
  }
}

export default Rest
