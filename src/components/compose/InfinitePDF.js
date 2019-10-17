import React, { useState, useEffect } from "react"
import pdfjsLib from "pdfjs-dist"
import {
  setElementPropertyById,
  getViewportCoordinates,
} from "../../lib/infinite-util.js"
import { inspectorForElement } from "./common"

const InfinitePDF = ({ context, scale, x, y, id, selected, ...save }) => {
  if (context.zenMode && context.lastInteractedElemId !== id) return null

  const [options, setOptions] = useState({
    url: "/helloworld (3).pdf",
    width: "302",
    height: "302",
  })

  useEffect(() => {
    let url = options.url
    var loadingTask = pdfjsLib.getDocument(url)
    loadingTask.promise.then(
      function(pdf) {
        // Fetch the first page
        var pageNumber = 1
        pdf.getPage(pageNumber).then(function(page) {
          var scale = 1.5
          var viewport = page.getViewport({ scale: scale })

          // Prepare canvas using PDF page dimensions
          var canvas = document.getElementById(`pdf-canvas-${id}`)
          var context = canvas.getContext("2d")
          canvas.height = viewport.height
          canvas.width = viewport.width

          // Render PDF page into canvas context
          var renderContext = {
            canvasContext: context,
            viewport: viewport,
          }
          var renderTask = page.render(renderContext)
          renderTask.promise.then(function() {})
        })
      },
      function(reason) {
        // PDF loading error
        console.error(reason)
      }
    )
  }, [options.url, options.width, options.height])

  const { viewportX, viewportY } = getViewportCoordinates(
    x,
    y,
    context.translate,
    context.zoom
  )

  return (
    <>
      {inspectorForElement(id, context, selected, options, setOptions)}

      <canvas
        id={`pdf-canvas-${id}`}
        onClick={e => {
          if (!context.zoomMode) {
            e.stopPropagation()
            if (selected && !context.inspecting)
              setElementPropertyById(id, context, "selected", false)
            if (selected && context.inspecting)
              context.setLastInteractedElemId(id)
            if (!selected) {
              setElementPropertyById(id, context, "selected", true)
              context.setLastInteractedElemId(id)
            }
          }
        }}
        style={{
          border: `1px solid ${selected ? "grey" : "#ededed"}`,
          position: "fixed",
          top: viewportY,
          left: viewportX,
          width: `${options.width}px`,
          height: `${options.height}px`,
          transform: `scale(${context.zoom.scale / scale})`,
          transformOrigin: "top left",
        }}
      />
    </>
  )
}

export default InfinitePDF
