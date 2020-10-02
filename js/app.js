// Main javascript file for Virtual Whiteboard.
import Canvas from './canvas.js';

window.onload = () => {

    // Canvas control.
    let canvasList = [];
    let activeCanvas;

    // Active tool.
    let activeTool;

    // Mouse/Finger scrolling.
    let lastScrolledLeft = 0;
    let lastScrolledTop = 0;

    // Mouse/Finger position.
    let mouseX;
    let mouseY;

    // When to record clicks for painting.
    let paint;

    // Button listener for creating a new canvas.
    function createCanvas() {
        // Get and create the required elements.
        let canvasContainer = document.getElementById("canvas-container");
        let buttonContainer = document.getElementById("button-container");
        let newCanvas = document.createElement("canvas");
        let switchButton = document.createElement("button");
        let canvasId = "canvas" + canvasList.length;

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
        canvasList.push(newCanvasObject);
        activeCanvas = newCanvasObject;
        activeCanvas.resize();

        // Hide all other canvases.
        hideAllExceptOne(canvasId);
    }

    // Hide all canvases except the one specified.
    //
    // Takes an ID of a canvas to show.
    function hideAllExceptOne(canvasToShow) {
        canvasList.forEach(canvas => {
            if(canvas.canvasId == canvasToShow) {
                activeCanvas = canvas;
                canvas.context.canvas.style.display = "block";
            } else {
                canvas.context.canvas.style.display = "none";
            }
        })
    }

    // Switch to a specific canvas.
    //
    // Takes a click event.
    function switchCanvas(event) {
        hideAllExceptOne(event.target.getAttribute("id"));
    }

    // Keep track of scroll position to make sure that
    // the drawing position is accurate.
    function updateScrollOffset(event) {
        if(lastScrolledLeft != $(document).scrollLeft()){
            mouseX -= lastScrolledLeft;
            lastScrolledLeft = $(document).scrollLeft();
            mouseX += lastScrolledLeft;
        }
        if(lastScrolledTop != $(document).scrollTop()){
            mouseY -= lastScrolledTop;
            lastScrolledTop = $(document).scrollTop();
            mouseY += lastScrolledTop;
        }
    }

    // Update the current mouse position.
    function updateMousePosition(event) {
        mouseX = event.pageX;
        mouseY = event.pageY;
    }

    // Manually specify the current mouse position.
    function updateMousePositionManual(xPos, yPos) {
        mouseY = yPos;
        mouseX = xPos;
    }

    // Record a click and start painting.
    function startPaint(event) {
        let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
        let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

        paint = true;
        activeCanvas.addClick(paintX, paintY, false);
        activeCanvas.reDraw();
    }

    // Record click move and paint.
    function trackPaint(event) {
        if(paint){
            let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
            let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

            activeCanvas.addClick(paintX, paintY, true);
            activeCanvas.reDraw();
        }
    }

    // Stop painting.
    function stopPaint(event) {
        paint = false
    }

    // Switch the currently active tool.
    function switchTool(event) {
        activeTool = event.target.getAttribute("id");
        console.log(activeTool)
    }

    $(document).on("click", "button.tool", switchTool)

    // HTML switch canvas button listeners.
    $(document).on("click", "button.switch-canvas", switchCanvas);
    $('#create-canvas').on("click", createCanvas);

    // Update mouse position in case of scroll.
    $(window).on("scroll", (event) => {
        updateScrollOffset(event)
    });

    // Keep track of the mouse position.
    $(document).on("mousemove", (event) => {
        event.preventDefault();

        updateMousePosition(event);
    });

    // Listener for mousedown event. Start drawing.
    $(document).on("mousedown", "canvas", (event) => {
        event.preventDefault();

        startPaint(event);
    });

    // Listener for mousemove event. If the mouse is being clicked
    // start adding drag locations to be drawn.
    $(document).on("mousemove", "canvas", (event) => {
        event.preventDefault();

        trackPaint(event);
    });

    // Listener for mouseleave and mouseup. Stop drawing when mouse
    // stops being on canvas or stops being clicked.
    $(document).on("mouseup mouseleave", "canvas", (event) => {
        event.preventDefault();

        stopPaint(event);
    });

    /// MOBILE ///

    // Same listeners as above but for mobile.
    $(document).on("touchstart", "canvas", (event) => {
        updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
        if(activeTool == "grab-tool") {
            $("#root").css("touch-action", "");
        } else if(activeTool == "draw-tool") {
            $("#root").css("touch-action", "none");
            startPaint(event);
        }
    })

    $(document).on("touchmove", "canvas", (event) => {
        updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
        if(activeTool == "grab-tool") {
            $("#root").css("touch-action", "");
        } else if(activeTool == "draw-tool") {
            $("#root").css("touch-action", "none");
            trackPaint(event);
        }
    })

    $(document).on("touchend", "canvas", (event) => {
        if(activeTool == "grab-tool") {
            $("#root").css("touch-action", "");
        } else if(activeTool == "draw-tool") {
            $("#root").css("touch-action", "none");
            stopPaint(event);
        }
    })
};