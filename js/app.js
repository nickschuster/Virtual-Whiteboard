// Controls the tools and canvas interactions.
import Canvas from './canvas.js';
import { CREATE_EVENT, SWITCH_EVENT } from "./events.js"

export default class App {

    constructor() {
        // Canvas control.
        this.canvasList = [];
        this.activeCanvas;

        // Mouse/Finger scrolling.
        this.lastScrolledLeft = 0;
        this.lastScrolledTop = 0;

        // Mouse/Finger position.
        this.mouseX;
        this.mouseY;

        // When to record clicks for painting.
        this.paint;
    }

    // Button listener for creating a new canvas.
    createCanvas(event) {
        // Get and create the required elements.
        let canvasContainer = document.getElementById("canvas-container");
        let buttonContainer = document.getElementById("button-container");
        let newCanvas = document.createElement("canvas");
        let switchButton = document.createElement("button");
        let canvasId = "canvas" + this.canvasList.length;

        // Set attributes.
        switchButton.setAttribute("id", canvasId);
        switchButton.setAttribute("class", "switch-canvas");
        switchButton.textContent = canvasId;
        newCanvas.setAttribute("id", canvasId);

        // Append the elements to the DOM.
        canvasContainer.appendChild(newCanvas);
        buttonContainer.appendChild(switchButton);

        // Add the canvas to the list of active canvases
        let newCanvasObject = new Canvas(canvasId);
        this.canvasList.push(newCanvasObject);
        this.activeCanvas = newCanvasObject;
        this.activeCanvas.resize();

        // Hide all other canvases.
        this.hideAllExceptOne(canvasId);

        document.dispatchEvent(new CustomEvent(CREATE_EVENT))
    }

    // Hide all canvases except the one specified.
    //
    // Takes an ID of a canvas to show.
    hideAllExceptOne(canvasToShow) {
        this.canvasList.forEach(canvas => {
            if(canvas.canvasId == canvasToShow) {
                this.activeCanvas = canvas;
                canvas.context.canvas.style.display = "block";
            } else {
                canvas.context.canvas.style.display = "none";
            }
        })
    }

    // Switch to a specific canvas.
    //
    // Takes a click event.
    switchCanvas(event) {
        let canvasId = event.target.getAttribute("id")
        this.hideAllExceptOne(canvasId);
        this.activeCanvas.reDraw();

        document.dispatchEvent(new CustomEvent(SWITCH_EVENT, {
            detail: {
                canvasId: canvasId
            }
        }))
    }

    // Keep track of scroll position to make sure that
    // the drawing position is accurate.
    updateScrollOffset(event) {
        if(this.lastScrolledLeft != $(document).scrollLeft()){
            mouseX -= this.lastScrolledLeft;
            this.lastScrolledLeft = $(document).scrollLeft();
            mouseX += this.lastScrolledLeft;
        }
        if(this.lastScrolledTop != $(document).scrollTop()){
            mouseY -= this.lastScrolledTop;
            this.lastScrolledTop = $(document).scrollTop();
            mouseY += this.lastScrolledTop;
        }
    }

    // Update the current mouse position.
    updateMousePosition(event) {
        this.mouseX = event.pageX;
        this.mouseY = event.pageY;
    }

    // Manually specify the current mouse position.
    updateMousePositionManual(xPos, yPos) {
        this.mouseY = yPos;
        this.mouseX = xPos;
    }

    // Record a click and start painting.
    startPaint(event) {
        let paintX = this.mouseX - this.activeCanvas.context.canvas.offsetLeft;
        let paintY = this.mouseY - this.activeCanvas.context.canvas.offsetTop;

        this.paint = true;
        this.activeCanvas.addClick(paintX, paintY, false);
        this.activeCanvas.reDraw();
    }

    // Record click move and paint.
    trackPaint(event) {
        if(this.paint){
            let paintX = this.mouseX - this.activeCanvas.context.canvas.offsetLeft;
            let paintY = this.mouseY - this.activeCanvas.context.canvas.offsetTop;

            this.activeCanvas.addClick(paintX, paintY, true);
            this.activeCanvas.reDraw();
        }
    }

    // Stop painting.
    stopPaint(event) {
        this.paint = false
    }
}