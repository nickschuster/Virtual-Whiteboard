// Create / Join a room.
import { devserver } from "./devserver.js"
import App from "./app.js"
import { HOST, CLIENT, JOIN_EVENT, DRAW_EVENT, SWITCH_EVENT, CREATE_EVENT } from "./events.js"

window.onload = () => {

    $("#create-room").on('click', event => {

        // Verify room code / login
        // Call create room API
        // Connect to returned room
        // Show room code
        // Send drawings
        
        // Three major events
        //  Create new canvas
        //  Switch active canvas
        //  Draw on a canvas

        const socket = io(devserver)

        socket.on('connect', () => {
            console.log("Connected.")
            
            socket.emit(JOIN_EVENT, HOST);
            $("#login").css("display", "none")

            let app = new App()
            setUpHost(app)
            setUpHostSocket(socket)
        })

        socket.on("connect_error", error => {
            console.log(error)
            // Could not connect.
            alert("could not connect to room")
        })
    })

    $("#join-room").on("click", event => {

        // Attempt to connect to room with room code
        // Recieve drawings
        // Cant draw but can scroll and switch canvas

        const socket = io(devserver)

        socket.on('connect', () => {
            console.log("Connected client")

            socket.emit(JOIN_EVENT, CLIENT)
            $("#login").css("display", "none")

            let app = new App()
            setUpClient(app)
            setUpClientSocket(socket, app)
        })

        socket.on('connect_error', error => {
            console.log(error)
            // Could not connect
            alert("Could not connect to room.")
        })
    })

    // Setup listeners for transmission events.
    function setUpHostSocket(socket) {
        document.addEventListener(DRAW_EVENT, event => {
            socket.emit(DRAW_EVENT, event.detail)
        })

        document.addEventListener(SWITCH_EVENT, event => {
            socket.emit(SWITCH_EVENT, event.detail.canvasId)
        })

        document.addEventListener(CREATE_EVENT, event => {
            socket.emit(CREATE_EVENT)
        })
    }

    // Setup listeners for revieving host transmissions.
    function setUpClientSocket(socket, app) {
        socket.on(CREATE_EVENT, () => {
            app.createCanvas(null)
        })

        socket.on(SWITCH_EVENT, canvasId => {
            app.hideAllExceptOne(canvasId)
        })

        socket.on(DRAW_EVENT, clickData => {
            app.canvasList.forEach(canvas => {
                if(canvas.canvasId === clickData.canvasId) {
                    canvas.addClick(clickData.mouseX, clickData.mouseY, clickData.dragging)
                }
            })
            app.activeCanvas.reDraw()
        })
    }

    // Setup all button listeners for operation of the whiteboard.
    function setUpHost(app) {
        // HTML switch canvas button listeners.
        $(document).on("click", "button.switch-canvas", event => {
            app.switchCanvas(event)
        });
        $('#create-canvas').on("click", event => {
            app.createCanvas(event)
        });

        // Update mouse position in case of scroll.
        $(window).on("scroll", (event) => {
            app.updateScrollOffset(event)
        });

        // Keep track of the mouse position.
        $(document).on("mousemove", (event) => {
            event.preventDefault();

            app.updateMousePosition(event);
        });

        // Listener for mousedown event. Start drawing.
        $(document).on("mousedown", "canvas", (event) => {
            event.preventDefault();

            app.startPaint(event);
        });

        // Listener for mousemove event. If the mouse is being clicked
        // start adding drag locations to be drawn.
        $(document).on("mousemove", "canvas", (event) => {
            event.preventDefault();

            app.trackPaint(event);
        });

        // Listener for mouseleave and mouseup. Stop drawing when mouse
        // stops being on canvas or stops being clicked.
        $(document).on("mouseup mouseleave", "canvas", (event) => {
            event.preventDefault();

            app.stopPaint(event);
        });

        /// MOBILE ///

        // Same listeners as above but for mobile.
        $(document).on("touchstart", "canvas", (event) => {
            app.updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
            app.startPaint(event);
        })

        $(document).on("touchmove", "canvas", (event) => {
            app.updateMousePositionManual(event.touches[0].clientX, event.touches[0].clientY);
            app.trackPaint(event);
        })

        $(document).on("touchend", "canvas", (event) => {
            app.stopPaint(event);
        })
    }

    // Setup button listeners for the operation of the whiteboard.
    function setUpClient(app) {   
        $(document).on("click", "button.switch-canvas", event => {
            app.switchCanvas(event)
        });
    }
}