import React, { useState, useEffect } from "react"
import pdfjsLib from "pdfjs-dist"
import {
 setElementPropertyById,
 getViewportCoordinates,
} from "../../lib/infinite-util"
import { inspectorForElement, InfiniteComponentProps } from "./common"

interface InfinitePDFProps extends InfiniteComponentProps {
 options?: InfinitePDFOptions
}

interface InfinitePDFOptions {
 url: string
 width: string
 height: string
}

const InfinitePDF = (props: InfinitePDFProps) => {
 let { context, scale, x, y, id, selected, ...save } = props
 if (context.zenMode && context.lastInteractedElemId !== id) return null

 const [options, setOptions] = useState<InfinitePDFOptions>({
  url: "/helloworld (3).pdf",
  width: "302",
  height: "302",
 })

 useEffect(() => {
  let url = options.url
  let loadingTask = pdfjsLib.getDocument(url)
  loadingTask.promise.then(
   function(pdf) {
    // Fetch the first page
    let pageNumber = 1
    pdf.getPage(pageNumber).then(function(page) {
     let scale = 1.5
     let viewport = page.getViewport({ scale: scale })

     // Prepare canvas using PDF page dimensions
     let canvas = document.getElementById(`pdf-canvas-${id}`)
     if (canvas instanceof HTMLCanvasElement) {
      let context = canvas.getContext("2d")
      if (context instanceof CanvasRenderingContext2D) {
       canvas.height = viewport.height
       canvas.width = viewport.width

       // Render PDF page into canvas context
       let renderContext = {
        canvasContext: context,
        viewport: viewport,
       }
       let renderTask = page.render(renderContext)
       renderTask.promise.then(function() { })
      }
     }
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
