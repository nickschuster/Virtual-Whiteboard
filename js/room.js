// Create / Join a room.
import { devserver } from "./devserver.js"
import App from "./app.js"
import { HOST, CLIENT, JOIN_EVENT, DRAW_EVENT, SWITCH_EVENT, CREATE_EVENT, RENAME_EVENT, DELETE_EVENT, HISTORY_EVENT } from "./events.js"

export default class Room {

    constructor() {

        // Check if this is a reconnect from a teacher.
        if(this.reconnection()) {
            this.reconnect()
        } else {
            // Create the relevant listeners.
            this.setUpListeners()
        }
    }

    // Creates the room control listeners.
    setUpListeners() {
        $("#create-room").on('click', async (event) => {
    
            try {
    
                const creatorCode = this.getCreatorCode();
                this.load(true, "Looking up creator code (1/4)")
                // const serverIp = await this.createRoom(creatorCode);
                this.load(true, "Connecting... (may take up to 90 seconds) (3/4)")
                const serverIp = '192.168.0.101'
                const socket = this.createHostSocket(`ws://${serverIp}:3000`)
    
                this.hostSocketSetup(socket, serverIp)

            } catch(e) {
                this.load(false)
                this.showError(e)
            }
            
            
        })
    
        // Join a room.
        $("#join-room").on("click", event => {
            try {
                this.load(true, "Looking up room (1/3)")
                const roomCode = this.roomToIp(this.getRoomCode())
                const socket = this.createClientSocket(`ws://${roomCode}:3000`)
                this.load(true, "Connecting... (2/3)")
    
                socket.on('connect', () => {
                    this.deleteSavedConnection()
                    this.load(true, "Getting room history (3/3)")
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

    // Translate from ip to room code.
    ipToRoom(ip) {
        let numbers = ip.split(".")
        let roomCode = ""
        for(let number of numbers) {
            let hex = parseInt(number).toString(16)
            if(hex.length < 2) {
                hex = "0"+hex
            }
            roomCode += hex
        }
        return roomCode
    }

    // Translate from room code to ip.
    roomToIp(roomCode) {
        let hexes = []
        let temp = ""
        for(let i = 0; i < roomCode.length; i++) {
            temp += roomCode[i]
            if(temp.length == 2) {
                hexes.push(temp)
                temp = ""
            }
        }

        let ip = []
        for(let hex of hexes) {
            ip.push(parseInt(hex, 16))
        }

        return ip.join(".")
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
    load(show, loadMessage) {
        $('#load').css('display', (show ? 'block' : 'none'));
        $('#load-message').css('display', (show ? 'block' : 'none')).text(loadMessage ? loadMessage : "");
    }

    // Get the creator code from the relevant form field.
    getCreatorCode() {
        return $('#creator-code').val()
    }

    // Call CreateRoom API and get a public IP.
    async createRoom(creatorCode) {
        this.load(true, "Launching instance (2/4)")
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

    // Check if this is a reconnect.
    reconnection() {
        console.log(document.cookie)
        if(document.cookie === "") {
            return false
        }
        return true
    }

    // Reconnect to the room that experienced a service interuption.
    reconnect() {
        let serverIp = document.cookie.split("=")[1]
        $("#room-code-disconnect").text(this.ipToRoom(serverIp))
        $("#reconnect-wrapper").show();
        $("#reconnect").on("click", event => {
            try {
                let socket = this.createHostSocket(`ws://${serverIp}:3000`)
                this.hostSocketSetup(socket, serverIp)
                socket.emit(HISTORY_EVENT)
            } catch (e) {
                this.load(false)
                this.showError(e)
            }   
            $("#reconnect-wrapper").hide();
            $( this ).off( event );
        })
        $("#cancel-reconnect").on("click", event => {
            this.setUpListeners()
            $("#reconnect-wrapper").hide();
            $( this ).off( event );
        })
    }

    // Save the connection details incase of a service interuption.
    saveConnection(serverIp) {
        var date = new Date();
        date.setTime(date.getTime()+(5*60*1000))
        document.cookie = "serverIp="+serverIp+"; expires="+date.toGMTString()
    }

    // If you joined a room delete any saved connections.
    deleteSavedConnection() {
        let date = new Date();
        document.cookie = "serverIp=;" +"expires="+date.toGMTString()
    }

    // Create the inital socket listners.
    hostSocketSetup(socket, serverIp) {
        socket.on('connect', () => {
            // Save connection in case there is a service interuption.
            this.saveConnection(serverIp)

            this.load(true, "Connected. (4/4)")

            this.load(false)
            this.showRoomCode(this.ipToRoom(serverIp))
            
            socket.emit(JOIN_EVENT, HOST);
            $("#login").css("display", "none")

            let app = new App(HOST)
            this.setUpHostSocket(socket)
            // Add the same listners as the client for reconnections/interuptions
            this.setUpClientSocket(socket, app, true)
        })

        socket.on("connect_error", error => {
            console.log(error)
        })
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

        document.addEventListener(RENAME_EVENT, event => {
            socket.emit(RENAME_EVENT, event.detail)
        })

        document.addEventListener(DELETE_EVENT, event => {
            socket.emit(DELETE_EVENT, event.detail.canvasId)
        })
    }

    // Setup listeners for revieving host transmissions.
    setUpClientSocket(socket, app, reconnect) {
        socket.on(CREATE_EVENT, () => {
            app.createCanvas(null, reconnect)
        })

        socket.on(SWITCH_EVENT, canvasId => {
            app.hideAllExceptOne(canvasId, reconnect)
        })

        socket.on(DRAW_EVENT, clickData => {
            app.canvasList.forEach(canvas => {
                if(canvas.canvasId === clickData.canvasId) {
                    canvas.addClick(clickData.mouseX, clickData.mouseY, clickData.dragging, clickData.tool, reconnect)
                }
            })
            app.activeCanvas.reDraw()
        })

        socket.on(RENAME_EVENT, renameDetails => {
            app.editCanvasName(renameDetails.canvasId, renameDetails.newName);
        })

        socket.on(DELETE_EVENT, canvasId => {
            app.deleteCanvas(canvasId)
        })
    }
}