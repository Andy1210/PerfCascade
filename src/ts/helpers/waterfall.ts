/*
Helper to create waterfall timelines 
*/
import svg from "../helpers/svg"
import dom from "../helpers/dom"
import TimeBlock from "../typing/time-block"
import {WaterfallData} from "../typing/waterfall-data"

var waterfall = {
  //model for block and segment

  setupTimeLine: function(data: WaterfallData) {
    const unit = data.durationMs / 100,
      barsToShow = data.blocks
        .filter((block) => (typeof block.start == "number" && typeof block.total == "number"))
        .sort((a, b) => (a.start || 0) - (b.start || 0)),
      maxMarkTextLength = data.marks.length > 0 ? data.marks.reduce((currMax, currValue) => {
        return Math.max((typeof currMax == "number" ? currMax : 0), svg.getNodeTextWidth(svg.newTextEl(currValue.name, 0)))
      }) : 0,
      diagramHeight = (barsToShow.length + 1) * 25,
      chartHolderHeight = diagramHeight + maxMarkTextLength + 35

    var timeLineHolder = svg.newEl("svg:svg", {
      height: Math.floor(chartHolderHeight),
      class: "water-fall-chart"
    }) as SVGSVGElement
    var timeLineLabelHolder = svg.newEl("g", { class: "labels" }) as SVGGElement

    var endline = svg.newEl("line", {
      x1: "0",
      y1: "0",
      x2: "0",
      y2: diagramHeight,
      class: "line-end"
    }) as SVGLineElement

    var startline = svg.newEl("line", {
      x1: "0",
      y1: "0",
      x2: "0",
      y2: diagramHeight,
      class: "line-start"
    }) as SVGLineElement

    var onRectMouseEnter = function(evt) {
      var targetRect = evt.target
      dom.addClass(targetRect, "active")

      const xPosEnd = targetRect.x.baseVal.valueInSpecifiedUnits + targetRect.width.baseVal.valueInSpecifiedUnits + "%"
      const xPosStart = targetRect.x.baseVal.valueInSpecifiedUnits + "%"

      endline.x1.baseVal.valueAsString = xPosEnd
      endline.x2.baseVal.valueAsString = xPosEnd
      startline.x1.baseVal.valueAsString = xPosStart
      startline.x2.baseVal.valueAsString = xPosStart
      dom.addClass(endline, "active")
      dom.addClass(startline, "active")

      targetRect.parentNode.appendChild(endline)
      targetRect.parentNode.appendChild(startline)
    }

    var onRectMouseLeave = function(evt) {
      dom.removeClass(evt.target, "active")
      dom.removeClass(endline, "active")
      dom.removeClass(startline, "active")
    }

    var createRect = function(width: number, height: number, x: number, y: number, cssClass: string, label: string, segments?: Array<TimeBlock>): SVGElement {
      var rectHolder
      var rect = svg.newEl("rect", {
        width: (width / unit) + "%",
        height: height - 1,
        x: Math.round((x / unit) * 100) / 100 + "%",
        y: y,
        class: ((segments && segments.length > 0 ? "time-block" : "segment")) + " " + (cssClass || "block-other")
      })
      if (label) {
        rect.appendChild(svg.newEl("title", {
          text: label
        })) // Add tile to wedge path
      }

      rect.addEventListener("mouseenter", onRectMouseEnter)
      rect.addEventListener("mouseleave", onRectMouseLeave)

      if (segments && segments.length > 0) {
        rectHolder = svg.newEl("g")
        rectHolder.appendChild(rect)
        segments.forEach((segment) => {
          if (segment.total > 0 && typeof segment.start === "number") {
            rectHolder.appendChild(createRect(segment.total, 8, segment.start || 0.001, y, segment.cssClass, segment.name + " (" + Math.round(segment.start) + "ms - " + Math.round(segment.end) + "ms | total: " + Math.round(segment.total) + "ms)"))
          }
        })
        return rectHolder
      } else {
        return rect
      }
    }

    var createBgRect = function(block) {
      var rect = svg.newEl("rect", {
        width: ((block.total || 1) / unit) + "%",
        height: diagramHeight,
        x: ((block.start || 0.001) / unit) + "%",
        y: 0,
        class: block.cssClass || "block-other"
      })

      rect.appendChild(svg.newEl("title", {
        text: block.name
      })) // Add tile to wedge path
      return rect
    }

    var createTimeWrapper = function() {
      var timeHolder = svg.newEl("g", { class: "time-scale full-width" })
      for (let i = 0, secs = data.durationMs / 1000, secPerc = 100 / secs; i <= secs; i++) {
        var lineLabel = svg.newTextEl(i + "sec", diagramHeight)
        if (i > secs - 0.2) {
          lineLabel.setAttribute("x", secPerc * i - 0.5 + "%")
          lineLabel.setAttribute("text-anchor", "end")
        } else {
          lineLabel.setAttribute("x", secPerc * i + 0.5 + "%")
        }

        var lineEl = svg.newEl("line", {
          x1: secPerc * i + "%",
          y1: "0",
          x2: secPerc * i + "%",
          y2: diagramHeight
        })
        timeHolder.appendChild(lineEl)
        timeHolder.appendChild(lineLabel)
      }
      return timeHolder
    }


    var renderMarks = function() {
      var marksHolder = svg.newEl("g", {
        transform: "scale(1, 1)",
        class: "marker-holder"
      })

      data.marks.forEach((mark, i) => {
        var x = mark.startTime / unit
        var markHolder = svg.newEl("g", {
          class: "mark-holder"
        })
        var lineHolder = svg.newEl("g", {
          class: "line-holder"
        })
        var lineLableHolder = svg.newEl("g", {
          class: "line-lable-holder",
          x: x + "%"
        })
        mark.x = x
        var lineLabel = svg.newTextEl(mark.name, diagramHeight + 25)
        //lineLabel.setAttribute("writing-mode", "tb")
        lineLabel.setAttribute("x", x + "%")
        lineLabel.setAttribute("stroke", "")


        lineHolder.appendChild(svg.newEl("line", {
          x1: x + "%",
          y1: 0,
          x2: x + "%",
          y2: diagramHeight
        }))

        if (data.marks[i - 1] && mark.x - data.marks[i - 1].x < 1) {
          lineLabel.setAttribute("x", data.marks[i - 1].x + 1 + "%")
          mark.x = data.marks[i - 1].x + 1
        }

        //would use polyline but can't use percentage for points 
        lineHolder.appendChild(svg.newEl("line", {
          x1: x + "%",
          y1: diagramHeight,
          x2: mark.x + "%",
          y2: diagramHeight + 23
        }))

        var isActive = false
        var onLableMouseEnter = function(evt) {
          if (!isActive) {
            isActive = true
            dom.addClass(lineHolder, "active")
            //firefox has issues with this
            markHolder.parentNode.appendChild(markHolder)
          }
        }

        var onLableMouseLeave = function(evt) {
          isActive = false
          dom.removeClass(lineHolder, "active")
        }

        lineLabel.addEventListener("mouseenter", onLableMouseEnter)
        lineLabel.addEventListener("mouseleave", onLableMouseLeave)
        lineLableHolder.appendChild(lineLabel)

        markHolder.appendChild(svg.newEl("title", {
          text: mark.name + " (" + Math.round(mark.startTime) + "ms)",
        }))
        markHolder.appendChild(lineHolder)
        marksHolder.appendChild(markHolder)
        markHolder.appendChild(lineLableHolder)
      })

      return marksHolder
    }

    timeLineHolder.appendChild(createTimeWrapper())
    timeLineHolder.appendChild(renderMarks())

    data.lines.forEach((block, i) => {
      timeLineHolder.appendChild(createBgRect(block))
    })

    barsToShow.forEach((block, i) => {
      var blockWidth = block.total || 1

      var y = 25 * i
      timeLineHolder.appendChild(createRect(blockWidth, 25, block.start || 0.001, y, block.cssClass, block.name + " (" + block.start + "ms - " + block.end + "ms | total: " + block.total + "ms)", block.segments))
      
      //crop name if longer than 30 characters
      var clipName = (block.name.length > 30 && block.name.indexOf("?") > 0)
      var blockName = (clipName) ? block.name.split("?")[0] + "?...." : block.name

      var blockLabel = svg.newTextEl(blockName + " (" + Math.round(block.total) + "ms)", (y + (block.segments ? 20 : 17)))
      blockLabel.appendChild(svg.newEl("title", {
        text: block.name
      }))

      if (((block.total || 1) / unit) > 10 && svg.getNodeTextWidth(blockLabel) < 200) {
        blockLabel.setAttribute("class", "inner-label")
        blockLabel.setAttribute("x", ((block.start || 0.001) / unit) + 0.5 + "%")
        blockLabel.setAttribute("width", (blockWidth / unit) + "%")
      } else if (((block.start || 0.001) / unit) + (blockWidth / unit) < 80) {
        blockLabel.setAttribute("x", ((block.start || 0.001) / unit) + (blockWidth / unit) + 0.5 + "%")
      } else {
        blockLabel.setAttribute("x", (block.start || 0.001) / unit - 0.5 + "%")
        blockLabel.setAttribute("text-anchor", "end")
      }
      blockLabel.style.opacity = block.name.match(/js.map$/) ? "0.5" : "1"
      timeLineLabelHolder.appendChild(blockLabel)
    })

    timeLineHolder.appendChild(timeLineLabelHolder)


    return timeLineHolder
  }
}

export default waterfall
