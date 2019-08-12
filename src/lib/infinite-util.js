export const getViewportCoordinates = (
  x,
  y,
  globalTranslate,
  globalZoom,
  zoomOriginX = window.innerWidth / 2,
  zoomOriginY = window.innerHeight / 2
) => {
  let scaledX = globalZoom.scale * x
  let scaledY = globalZoom.scale * y
  let scaledTopLeftX = globalZoom.scale * globalTranslate.x * -1
  let scaledTopLeftY = globalZoom.scale * globalTranslate.y * -1
  let viewportCenterX =
    scaledTopLeftX + Math.floor(zoomOriginX) * globalZoom.scale
  let viewportCenterY =
    scaledTopLeftY + Math.floor(zoomOriginY) * globalZoom.scale
  let newDiffXFromCenter = scaledX - viewportCenterX
  let newDiffYFromCenter = scaledY - viewportCenterY
  let viewportX = newDiffXFromCenter + zoomOriginX
  let viewportY = newDiffYFromCenter + zoomOriginY
  return { viewportX, viewportY }
}

export const setElementPropertyById = (id, context, prop, value) => {
  context.setElements(elements =>
    elements.map(elem => (elem.id === id ? { ...elem, [prop]: value } : elem))
  )
}

export const setPropertyForAll = (context, prop, value) => {
  context.setElements(elements =>
    elements.map(elem => ({ ...elem, [prop]: value }))
  )
}

export const selectElementAndDeselectRest = (id, context) => {
  context.setElements(elements =>
    elements.map(elem =>
      elem.id === id
        ? { ...elem, selected: true }
        : { ...elem, selected: false }
    )
  )
}

export const deleteElementById = (id, context) => {
  context.setElements(elements => elements.filter(elem => elem.id !== id))
}
