import App from "./app.js"
import { HOST, CLIENT, JOIN_EVENT, DRAW_EVENT, SWITCH_EVENT, CREATE_EVENT, RENAME_EVENT, DELETE_EVENT, HISTORY_EVENT, ROOM_EVENT, QUESTION_EVENT } from "./events.js"

/** Class representing network interactions as a Room. */
export default class Room {

    /**
     * @constructor
     */
    constructor() {

        // Check if this is a reconnect from a teacher.
        if(this.reconnection()) {
            this.reconnect()
        } else {
            // Create the relevant listeners.
            this.documentListeners()
        }

        this.nickname = ""
    }

    /**
     * Join a room as a client.
     */
    joinRoom() {
        try {
            this.checkName()
            this.load(true, "Looking up room (1/3)")
            const serverIp = this.roomToIp(this.getRoomCode())
            const socket = this.createClientSocket(`ws://${serverIp}:3000`)
            this.load(true, "Connecting... (2/3)")

            this.socketSetup(socket, serverIp, CLIENT)
        } catch(e) {
            this.load(false)
            this.showError(e)
        }
    }

    /**
     * Create a room as a host. 
     */
    createRoom() {
        try {
            this.checkName()
            const creatorCode = this.getCreatorCode();
            this.load(true, "Looking up creator code (1/4)")
            // const serverIp = await this.createServer(creatorCode);
            this.load(true, "Connecting... (may take up to 90 seconds) (3/4)")
            const serverIp = '192.168.0.101'
            const socket = this.createHostSocket(`ws://${serverIp}:3000`)

            this.socketSetup(socket, serverIp, HOST)
        } catch(e) {
            this.load(false)
            this.showError(e)
        }
    }

    /**
     * Get the room code to join.
     * @return {String} - The join code.
     */
    getRoomCode() {
        return $('#join-code').val()
    }

    /**
     * Translate a string IP to a room code.
     * @param {String} ip - The IP to translate.
     * @return {String} - The translated room code.
     */
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

    /**
     * Translate a string room code to a server IP.
     * @param {String} roomCode - The room code to translate.
     * @return {String} - The translated IP.
     */
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

    /**
     * Update the room code.
     * @param {String} code 
     */
    showRoomCode(code) {
        $('#room-code').css('display', 'block')
        $('#code').text(code)
    }

    /**
     * Display an error. 
     * @param {String} e - The error message. 
     */
    showError(e) {
        alert(e)
    }

    /**
     * Control the loading animation.
     * @param {boolean} show - Whether or not to show load. 
     * @param {*} loadMessage - A loading message.
     */
    load(show, loadMessage) {
        $('#load').css('display', (show ? 'block' : 'none'));
        $('#load-message').css('display', (show ? 'block' : 'none')).text(loadMessage ? loadMessage : "");
    }

    /**
     * Get the creator code.
     * @return {String} - The creator code.
     */
    getCreatorCode() {
        return $('#creator-code').val()
    }

    /**
     * Calls the Virtual Whiteboard API and creates a room if provided with a valid room code.
     * @param {String} creatorCode - The password code to create a room. 
     * @return {String} - The IP of the created server/room.
     */
    async createServer(creatorCode) {
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

    /**
     * Check if there exists a saved connection.
     * @return {boolean} - If a saved connection exists or not.
     */
    reconnection() {
        if(document.cookie === "") {
            return false
        }
        return true
    }

    /**
     * Reconnect a host to a disconnected room
     */
    reconnect() {
        let serverIp = document.cookie.split("=")[1]
        $("#room-code-disconnect").text(this.ipToRoom(serverIp))
        $("#reconnect-wrapper").show();
        $("#reconnect").on("click", event => {
            try {
                this.checkName();
                let socket = this.createHostSocket(`ws://${serverIp}:3000`)
                this.socketSetup(socket, serverIp, HOST)
                socket.emit(HISTORY_EVENT)
            } catch (e) {
                this.load(false)
                this.showError(e)
            }   
            $("#reconnect-wrapper").hide();
            $( this ).off( event );
        })
        $("#cancel-reconnect").on("click", event => {
            this.documentListeners()
            $("#reconnect-wrapper").hide();
            $( this ).off( event );
        })
    }

    /**
     * Save a connection to a cookie.
     * @param {String} serverIp 
     */
    saveConnection(serverIp) {
        var date = new Date();
        date.setTime(date.getTime()+(5*60*1000))
        document.cookie = "serverIp="+serverIp+"; expires="+date.toGMTString()
    }

    /**
     * Delete the saved connection cookie.
     */
    deleteSavedConnection() {
        let date = new Date();
        document.cookie = "serverIp=;" +"expires="+date.toGMTString()
    }

    /**
     * Ensure a name is provided.
     */
    checkName() {
        let name = $("#nickname").val();
        if(name == "") throw Error("You must provide a nickname.")
        else {
            this.nickname = name
        }
    }

    /**
     * 
     * @param {SocketIO} socket - The socket which to setup. 
     * @param {String} serverIp - The IP address of the server to connect to.
     * @param {Number} type - The type of user/socket.
     */
    socketSetup(socket, serverIp, type) {
        if(type == HOST) {
            socket.on('connect', () => {
                // Save connection in case there is a service interuption.
                this.saveConnection(serverIp)
    
                this.load(true, "Connected. (4/4)")
    
                this.load(false)
                this.showRoomCode(this.ipToRoom(serverIp))
                
                socket.emit(JOIN_EVENT, {type: HOST, name: this.nickname});
                $("#login").css("display", "none")
    
                let app = new App(HOST)
                this.hostSocketListeners(socket)
                // Add the same listners as the client for reconnections/interuptions
                this.clientSocketListeners(socket, app, true)
            })
        } else if(type == CLIENT) {
            socket.on('connect', () => {
                this.deleteSavedConnection()
                this.load(true, "Getting room history (3/3)")
                this.load(false)
    
                socket.emit(JOIN_EVENT, {type: CLIENT, name: this.nickname})
                $("#login").css("display", "none")
    
                let app = new App(CLIENT)
                this.clientSocketListeners(socket, app)
            })
    
            socket.on('connect_error', error => {
                this.load(false)
                alert("Could not connect to room: " + error)
            })
        }   
    }

    /**
     * Create the client socket with the client configuration.
     * @param {String} serverIp - The IP address of the server to connect to.
     * @return {SocketIO} - The created socket.
     */
    createClientSocket(serverIp) {
        let socket = io(serverIp, {
            rejectUnauthorized: false,
            reconnection: false
        })
        return socket
    }

    /**
     * Create the client socket with the client configuration.
     * @param {String} serverIp - The IP address of the server to connect to.
     * @return {SocketIO} - The created socket.
     */
    createHostSocket(serverIp) {
        let socket = io(serverIp, {
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        })
        return socket
    }

    /**
     * Create the host socket events and listeners.
     * @param {SocketIO} socket - The socket which to register and send events to.
     */
    hostSocketListeners(socket) {
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

    /**
     * Create client socket events and listeners.
     * @param {SocketIO} socket - The socket to register and send events to.
     * @param {App} app - The app to act out events on.
     * @param {boolean} reconnect - Is a reconnection happening.
     */
    clientSocketListeners(socket, app, reconnect) {

        document.addEventListener(QUESTION_EVENT, event => {
            event.detail.name = this.nickname
            socket.emit(QUESTION_EVENT, event.detail)
        })

        socket.on(QUESTION_EVENT, event => {
            app.askQuestion(event.question, event.questionId)
        })

        socket.on(CREATE_EVENT, () => {
            app.createCanvas(reconnect)
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

        socket.on(ROOM_EVENT, roomList => {
            app.updateRoomList(roomList, socket.id)
        })
    }

    /**
     * Creates the event delegators.
     */
    documentListeners() {
        // Room click event delegator.
        $(document).on("click", event => {
            if(event.target.matches("#create-room")) {
                this.createRoom()
            }

            if(event.target.matches("#join-room")) {
                this.joinRoom()
            }
        })
    }
}