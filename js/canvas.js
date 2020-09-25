// Main javascript file for Virtual Whiteboard.

window.onload = () => {

    // Reference to the canvas for drawing on.
    let context = document.getElementById("canvas").getContext('2d');

    // Arrays that contain a list of mouse positions that need to be drawn.
    let clickX = [];
    let clickY = [];
    let clickDrag = [];

    // Variable that tells drawing functions if it should be drawing right now.
    // E.g. dont draw if the mouse is outside of the canvas.
    let paint;

    // Add mouse positions to drawing arrays.
    function addClick(mouseX, mouseY, dragging) {
        clickX.push(mouseX);
        clickY.push(mouseY);
        clickDrag.push(dragging);
    }

    // Draw all the positions to be drawn to the canvas.
    function reDraw() {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        context.strokeStyle = "#0076ff";
        context.lineJoin = "round";
        context.lineWidth = 5;

        console.log(context);

        for(let i = 0; i < clickX.length; i++) {
            if(clickDrag[i] && i) {
                context.moveTo(clickX[i-1], clickY[i-1]);
            } else {
                context.moveTo(clickX[i], clickY[i]);
            }
            context.lineTo(clickX[i], clickY[i]);
            context.stroke();
        }

    }

    // Listener for mousedown event. Start drawing.
    $('#canvas').on("mousedown", (event) => {
        let mouseX = event.pageX - this.offsetLeft;
        let mouseY = event.pageY - this.offsetTop;

        paint = true;
        addClick(mouseX, mouseY, false);
        reDraw();
    });

    // Listener for mousemove event. If the mouse is being clicked
    // start adding drag locations to be drawn.
    $('#canvas').on("mousemove", (event) => {
        if(paint){
            let mouseX = event.pageX - this.offsetLeft;
            let mouseY = event.pageY - this.offsetTop;

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