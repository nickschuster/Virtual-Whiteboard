// Create / Join a room.

window.onload = () => {


    $("#create-room").on('click', (event) => {

        const socket = io("ws://localhost:3000")

        socket.send("hello");
        console.log("here");
    })

}