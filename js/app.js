// Controls the tools and canvas interactions.
import Canvas from './canvas.js';
import { CREATE_EVENT, SWITCH_EVENT, CLIENT, HOST } from "./events.js"

export default class App {

    constructor(type) {
        // Canvas control.
        this.canvasList = [];
        this.activeCanvas;

        // Scrolling control on mobile.
        this.scroll = false;
        this.scrollLeft = 0;
        this.scrollTop = 0;

        // When to record clicks for painting.
        this.paint;

        // Create the listeners that make the app work.
        this.setUpListeners(type)
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

    // Record a click and start painting.
    startPaint(event) {
        let paintX = event.pageX + $('#canvas-container').scrollLeft();
        let paintY = event.pageY + $('#canvas-container').scrollTop();

        this.paint = true;
        this.activeCanvas.addClick(paintX, paintY, false);
        this.activeCanvas.reDraw();
    }

    // Record click move and paint.
    trackPaint(event) {
        if(this.paint){
            let paintX = event.pageX + $('#canvas-container').scrollLeft();
            let paintY = event.pageY + $('#canvas-container').scrollTop();

            this.activeCanvas.addClick(paintX, paintY, true);
            this.activeCanvas.reDraw();
        }
    }

    // Stop painting.
    stopPaint(event) {
        this.paint = false
    }

    // Sets up the JQuery listeners based on type of app (Host or Client).
    setUpListeners(type) {

        if(type === HOST) {
            // HTML switch canvas button listeners.
            $(document).on("click", "button.switch-canvas", event => {
                this.switchCanvas(event)
            });
            $('#create-canvas').on("click", event => {
                this.createCanvas(event)
            });

            // Listener for mousedown event. Start drawing.
            $(document).on("mousedown", "canvas", (event) => {
                event.preventDefault();

                this.startPaint(event);
            });

            // Listener for mousemove event. If the mouse is being clicked
            // start adding drag locations to be drawn.
            $(document).on("mousemove", "canvas", (event) => {
                event.preventDefault();

                this.trackPaint(event);
            });

            // Listener for mouseleave and mouseup. Stop drawing when mouse
            // stops being on canvas or stops being clicked.
            $(document).on("mouseup mouseleave", "canvas", (event) => {
                event.preventDefault();

                this.stopPaint(event);
            });

            /// MOBILE ///

            // Same listeners as above but for mobile.
            $(document).on("touchstart", "canvas", (event) => {
                if(event.touches.length >= 2) {
                    // Enable scroll
                    this.scroll = true;
                    this.scrollLeft = event.touches[0].clientX
                    this.scrollTop = event.touches[0].clientY

                } else {

                    // Disable scroll
                    this.scroll = false;

                    // startPaint expects a mouse event so must transfrom touch event.
                    const transEvent = {
                        pageX: event.touches[0].clientX,
                        pageY: event.touches[0].clientY
                    }

                    this.startPaint(transEvent);
                }
            })

            $(document).on("touchmove", "canvas", (event) => {
                if(this.scroll) {

                    let scrollX = $('#canvas-container').scrollLeft() + (this.scrollLeft - event.touches[0].clientX)/2;
                    let scrollY = $('#canvas-container').scrollTop() + (this.scrollTop - event.touches[0].clientY)/2;

                    document.getElementById('canvas-container').scroll(scrollX, scrollY)
                } else {
                    // startPaint expects a mouse event so must transfrom touch event.
                    const transEvent = {
                        pageX: event.touches[0].clientX,
                        pageY: event.touches[0].clientY
                    }

                    this.trackPaint(transEvent);
                }
            })

            $(document).on("touchend", "canvas", (event) => {
                this.scroll = false;
                this.stopPaint(event)
            })
        } else if (type === CLIENT) {
            $(document).on("click", "button.switch-canvas", event => {
                this.switchCanvas(event)
            });
        }
    }
}