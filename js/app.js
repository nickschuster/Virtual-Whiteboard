// Main javascript file for Virtual Whiteboard.
import Canvas from './canvas.js';

window.onload = () => {

    let canvasList = [];
    let activeCanvas;
    let lastScrolledLeft = 0;
    let lastScrolledTop = 0;
    let mouseX;
    let mouseY;
    let paint;

    // Button listener for creating a new canvas.
    function createCanvas() {
        let root = document.getElementById("root");
        let newCanvas = document.createElement("canvas");
        newCanvas.setAttribute("id", "canvasOne");
        root.appendChild(newCanvas);

        let newCanvasObject = new Canvas("canvasOne");
        canvasList.push(newCanvasObject);
        activeCanvas = newCanvasObject;
        activeCanvas.resize();
    }

    $('#create-canvas').on("click", createCanvas);

    // Update mouse position in case of scroll.
    $(window).on("scroll", (event) => {
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
    });

    // Keep track of the mouse position.
    $(document).on("mousemove", (event) => {
        mouseX = event.pageX;
        mouseY = event.pageY;
    });

    // Listener for mousedown event. Start drawing.
    $(document).on("mousedown", "canvas", (event) => {
        let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
        let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

        paint = true;
        activeCanvas.addClick(paintX, paintY, false);
        activeCanvas.reDraw();
    });

    // Listener for mousemove event. If the mouse is being clicked
    // start adding drag locations to be drawn.
    $(document).on("mousemove", "canvas", (event) => {
        if(paint){
            let paintX = mouseX - activeCanvas.context.canvas.offsetLeft;
            let paintY = mouseY - activeCanvas.context.canvas.offsetTop;

            activeCanvas.addClick(paintX, paintY, true);
            activeCanvas.reDraw();
        }
    });

    // Listener for mouseleave and mouseup. Stop drawing when mouse
    // stops being on canvas or stops being clicked.
    $(document).on("mouseup mouseleave", "canvas", (event) => {
        paint = false;
    });



    /// TEST ///
    /*
    // Reference to the canvas for drawing on.
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');

    // Arrays that contain a list of mouse positions that need to be drawn.
    let clickX = [];
    let clickY = [];
    let clickDrag = [];

    // Contain the current mouse position relative to the window.
    let mouseX;
    let mouseY;

    // Variable that tells drawing functions if it should be drawing right now.
    // E.g. dont draw if the mouse is outside of the canvas.
    let paint;

    resize();

    // Resize the canvas.
    function resize() {
        context.canvas.width = window.innerWidth*0.9;
        context.canvas.height = window.innerHeight*0.9;

        reDraw();
    }

    // Add mouse positions to drawing arrays.
    function addClick(mouseX, mouseY, dragging) {
        clickX.push(mouseX);
        clickY.push(mouseY);
        clickDrag.push(dragging);
    }

    // Draw all the positions to be drawn to the canvas.
    function reDraw() {
        context.strokeStyle = "#0076ff";
        context.lineJoin = "round";
        context.lineWidth = 5;

        for(let i = 0; i < clickX.length; i++) {
            context.beginPath();
            if(clickDrag[i] && i) {
                context.moveTo(clickX[i-1], clickY[i-1]);
            } else {
                context.moveTo(clickX[i], clickY[i]);
            }
            context.lineTo(clickX[i], clickY[i]);
            context.stroke();
            context.closePath();
        }

    }

    // Resize canvas when window changes size.
    //window.addEventListener("resize", resize);

    // If the window is resized and a scroll ocours.
    $(window).on("scroll", (event) => {
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
    });

    // Keep track of the mouse position.
    $(document).on("mousemove", (event) => {
        mouseX = event.pageX;
        mouseY = event.pageY;
    });

    // Listener for mousedown event. Start drawing.
    $('#canvas').on("mousedown", (event) => {
        let paintX = mouseX - canvas.offsetLeft;
        let paintY = mouseY - canvas.offsetTop;

        paint = true;
        addClick(paintX, paintY, false);
        reDraw();
    });

    // Listener for mousemove event. If the mouse is being clicked
    // start adding drag locations to be drawn.
    $('#canvas').on("mousemove", (event) => {
        if(paint){
            let paintX = mouseX - canvas.offsetLeft;
            let paintY = mouseY - canvas.offsetTop;

            addClick(paintX, paintY, true);
            reDraw();
        }
    });

    // Listener for mouseleave and mouseup. Stop drawing when mouse
    // stops being on canvas or stops being clicked.
    $('#canvas').on("mouseleave mouseup", (event) => {
        paint = false;
    });*/
};