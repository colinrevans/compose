import Verticality from "./verticality"
import Rest from "./rest"

export const isTemporal = x => x instanceof Verticality || x instanceof Rest

export const repeat = (x, n) => {
  if (!Array.isArray(x)) x = [x]
  let ret = []
  for (let i = n; i > 0; i--) {
    ret = [...ret, ...x]
  }
  return ret
}
