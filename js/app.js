// Main javascript file for Virtual Whiteboard.
import Canvas from './canvas.js';

window.onload = () => {

    // Canvas control.
    let canvasList = [];
    let activeCanvas;

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

    function hideAllExceptOne(canvasToShow) {
        canvasList.forEach(canvas => {
            if(canvas.canvasId == canvasToShow) {
                activeCanvas = canvas
                canvas.context.canvas.style.display = "block";
            } else {
                canvas.context.canvas.style.display = "none";
            }
        })
    }

    function switchCanvas(event) {
        hideAllExceptOne(event.target.getAttribute("id"));
    }

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

    function updateMousePosition(event) {
        mouseX = event.pageX;
        mouseY = event.pageY;
    }

    function updateMousePositionManual(xPos, yPos) {
        mouseY = yPos;
        mouseX = xPos;
    }

    function startPaint(event) {
        let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
        let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

        paint = true;
        activeCanvas.addClick(paintX, paintY, false);
        activeCanvas.reDraw();
    }

    function trackPaint(event) {
        if(paint){
            let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
            let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

            activeCanvas.addClick(paintX, paintY, true);
            activeCanvas.reDraw();
        }
    }

    function stopPaint(event) {
        paint = false
    }

    // HTML Button listeners.
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

    // Same listeners as above but for mobile.
    $(document).on("touchstart", "canvas", (event) => {
        if(event.touches.length > 1) {
            let x = 0;
            let y = 0;

            event.touches.forEach(touch => {
                x += touch.screenX;
                y += touch.screenY;
            })

            lastScrolledLeft = x/event.touches.length;
            lastScrolledTop = y/event.touches.length;
        } else {
            updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
            startPaint(event);
        }

    })

    $(document).on("touchmove", "canvas", (event) => {
        if(event.touches.length > 1) {
            let x = 0;
            let y = 0;

            event.touches.forEach(touch => {
                x += touch.screenX;
                y += touch.screenY;
            })

            let moveX = x/event.touches.length - lastScrolledLeft;
            let moveY = y/event.touches.length - lastScrolledTop;

            let newX = $('#root').offset().left + moveX;
            let newY = $('#root').offset().top + moveY;

            $('#root').offset({top: newY, left: newX});

            lastScrolledLeft = x/event.touches.length;
            lastScrolledTop = y/event.touches.length;
        } else {
            updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
            trackPaint(event);
        }
    })

    $(document).on("touchend", "canvas", (event) => {
        event.preventDefault();

        stopPaint();
    })
};