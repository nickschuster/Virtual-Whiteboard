// Create / Join a room.
import { devserver } from "./devserver.js"
import App from "./app.js"
import { HOST, CLIENT, JOIN_EVENT, DRAW_EVENT, SWITCH_EVENT, CREATE_EVENT } from "./events.js"

export default class Room {

    constructor() {

        // Create the relevant listeners.
        this.setUpListeners()
    }

    // Creates the room control listeners.
    setUpListeners() {
        $("#create-room").on('click', async (event) => {
    
            try {
                this.load(true)
    
                const creatorCode = this.getCreatorCode();
                
                //const serverIp = await createRoom(creatorCode);
                const serverIp = '192.168.0.101'
                const socket = this.createHostSocket(`ws://${serverIp}:443`)
    
                socket.on('connect', () => {
                    console.log("Connected.")
    
                    this.load(false)
                    this.showRoomCode(serverIp)
                    
                    socket.emit(JOIN_EVENT, HOST);
                    $("#login").css("display", "none")
    
                    let app = new App(HOST)
                    this.setUpHostSocket(socket)
                })

                socket.on("connect_error", error => {
                    alert(error)
                })

            } catch(e) {
                this.load(false)
                this.showError(e)
            }
            
            
        })
    
        // Join a room.
        $("#join-room").on("click", event => {
            try {
                this.load(true)
                const roomCode = this.getRoomCode()
                const socket = this.createClientSocket(`ws://${roomCode}:443`)
    
                socket.on('connect', () => {
                    console.log("Connected client")
    
                    this.load(false)
    
                    socket.emit(JOIN_EVENT, CLIENT)
                    $("#login").css("display", "none")
    
                    let app = new App(CLIENT)
                    this.setUpClientSocket(socket, app)
                })
    
                socket.on('connect_error', error => {
                    this.load(false)
                    alert("Could not connect to room: " + error)
                })
            } catch(e) {
                this.load(false)
                this.showError(e)
            }
        })
    }

    // Get the entered room code.
    getRoomCode() {
        return $('#join-code').val()
    }

    // Show the current room code.
    showRoomCode(code) {
        $('#room-code').css('display', 'block')
        $('#code').text(code)
    }

    // Show an error.
    showError(e) {
        alert(e)
    }

    // Turn the loading animation on or off.
    load(show) {
        $('#load').css('display', (show ? 'block' : 'none'))
    }

    // Get the creator code from the relevant form field.
    getCreatorCode() {
        return $('#creator-code').val()
    }

    // Call CreateRoom API and get a public IP.
    async createRoom(creatorCode) {
        let response = await fetch("https://n4x7cjm3ul.execute-api.us-east-1.amazonaws.com/production/createRoom", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: creatorCode })
        })
        if(!response.ok) throw new Error(await response.text())
        let publicIp = await response.text()
        return publicIp
    }

    // Create the client socket.
    createClientSocket(serverIp) {
        let socket = io(serverIp, {
            rejectUnauthorized: false,
            reconnection: false
        })
        return socket
    }

    // Create the host socket.
    createHostSocket(serverIp) {
        let socket = io(serverIp, {
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        })
        return socket
    }

    // Setup listeners for transmission events.
    setUpHostSocket(socket) {
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
    setUpClientSocket(socket, app) {
        socket.on(CREATE_EVENT, () => {
            app.createCanvas(null)
        })

        socket.on(SWITCH_EVENT, canvasId => {
            app.hideAllExceptOne(canvasId)
        })

        socket.on(DRAW_EVENT, clickData => {
            app.canvasList.forEach(canvas => {
                if(canvas.canvasId === clickData.canvasId) {
                    canvas.addClick(clickData.mouseX, clickData.mouseY, clickData.dragging, clickData.tool)
                }
            })
            app.activeCanvas.reDraw()
        })
    }
}