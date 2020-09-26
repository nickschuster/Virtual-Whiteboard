// Main javascript file for Virtual Whiteboard.

window.onload = () => {

    // Reference to the canvas for drawing on.
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');

    // Arrays that contain a list of mouse positions that need to be drawn.
    let clickX = [];
    let clickY = [];
    let clickDrag = [];

    // Variable that tells drawing functions if it should be drawing right now.
    // E.g. dont draw if the mouse is outside of the canvas.
    let paint;

    // Resize the canvas.
    function resize() {
        context.canvas.width = window.innerWidth;
        context.canvas.height = window.innerHeight;

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
    window.addEventListener("resize", resize);

    // Listener for mousedown event. Start drawing.
    $('#canvas').on("mousedown", (event) => {
        let mouseX = event.clientX - canvas.offsetLeft;
        let mouseY = event.clientY - canvas.offsetTop;

        paint = true;
        addClick(mouseX, mouseY, false);
        reDraw();
    });

    // Listener for mousemove event. If the mouse is being clicked
    // start adding drag locations to be drawn.
    $('#canvas').on("mousemove", (event) => {
        if(paint){
            let mouseX = event.pageX - canvas.offsetLeft;
            let mouseY = event.pageY - canvas.offsetTop;

            addClick(mouseX, mouseY, true);
            reDraw();
        }
    });

    // Listener for mouseleave and mouseup. Stop drawing when mouse
    // stops being on canvas or stops being clicked.
    $('#canvas').on("mouseleave mouseup", (event) => {
        paint = false;
    });
};