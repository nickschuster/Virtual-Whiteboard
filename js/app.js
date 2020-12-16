import Canvas from './canvas.js';
import { CREATE_EVENT, SWITCH_EVENT, CLIENT, HOST, RENAME_EVENT, DELETE_EVENT, QUESTION_EVENT } from "./events.js"
import { Tool } from './tool.js'
import Notif from "./notify.js"

/** Represents the user controlling an App. */
export default class App {

    /**
     * @constructor
     * @param {Number} type - The type of user. 
     */
    constructor(type) {
        // Canvas control.
        this.canvasList = [];
        this.activeCanvas;
        this.canvasCount = 0;

        // Scrolling control on mobile.
        this.scroll = false;
        this.scrollLeft = 0;
        this.scrollTop = 0;

        // When to record clicks for painting.
        this.paint = false

        // Create the listeners that make the app work.
        this.type = type;
        this.documentListeners(this.type)
        if(this.type === CLIENT) {
            this.hideHostControls()
        }

        // The currently active tool.
        this.activeTool = Tool.draw

        // Copy paste location information.
        this.cpLeft = 0;
        this.cpTop = 0;
        this.moveCp = false;
        this.resizeCp = false;
        this.canResize = true;

        // Current copy content.
        this.copyCoords = []
        this.cpLocTop = 0;
        this.cpLocLeft = 0;

        // Contains the current room list.
        this.roomList = [];

        // Question container location information.
        this.questionTop = 0;
        this.questionLeft = 0;
        this.moveQuestion = false;
    
        // Keep track of current questions.
        this.questions = []
    }

    /**
     * Hide all the host specific controls. 
     */
    hideHostControls() {
        $('#tool-container').hide()
        $('#ask-question-container').show()
    }

    /**
     * Create all the elements for a new canvas.
     * @param {String} canvasId - Canvas ID to bind everything to.
     */
    createCanvasButtons(canvasId) {
        
        // Get and create the required elements.
        let buttonContainer = document.getElementById("button-container");
        let container = document.createElement('div');
        let switchButton = document.createElement('button');
        let editImg = document.createElement('img');
        let deleteImg = document.createElement('img');
        let contentBreak = document.createElement('br')

        // Set the attributes.
        container.setAttribute('class', 'canvas-button-container')
        container.setAttribute('id', canvasId)

        switchButton.setAttribute('class', 'switch-canvas')
        switchButton.setAttribute('id', canvasId)
        switchButton.textContent = "Whiteboard " + this.canvasCount

        editImg.setAttribute('class', 'edit-canvas')
        editImg.setAttribute('src', './img/edit.png')
        editImg.setAttribute('alt', 'Edit canvas name.')
        editImg.setAttribute('id', canvasId)

        deleteImg.setAttribute('class', 'delete-canvas')
        deleteImg.setAttribute('src', './img/delete.png')
        deleteImg.setAttribute('alt', "Delete canvas.")
        deleteImg.setAttribute('id', canvasId)

        // Have to set this here because the elements are created dynamically.
        if(this.type === CLIENT) {
            deleteImg.setAttribute("style", "cursor: not-allowed");
            editImg.setAttribute("style", "cursor: not-allowed");
        }

        // Set up DOM structure.
        container.appendChild(switchButton)
        container.appendChild(editImg)
        container.appendChild(deleteImg)
        container.appendChild(contentBreak)

        buttonContainer.appendChild(container)
    }

    /**
     * Create a new canvas.
     * @param {boolean} [reconnect] - Whether or not this is a reconnection event.
     */
    createCanvas(reconnect) {
        // Get and create the required elements.

        // Create the canvas
        let canvasContainer = document.getElementById("canvas-container");
        let newCanvas = document.createElement("canvas");
        let canvasId = "canvas" + ++this.canvasCount;

        // Create the canvas controls.
        this.createCanvasButtons(canvasId)

        // Set attributes.
        newCanvas.setAttribute("id", canvasId);

        // Append the elements to the DOM.
        canvasContainer.appendChild(newCanvas);

        // Add the canvas to the list of active canvases
        let newCanvasObject = new Canvas(canvasId, this.activeTool);
        this.canvasList.push(newCanvasObject);
        this.activeCanvas = newCanvasObject;
        this.activeCanvas.resize();

        // Hide all other canvases.
        this.hideAllExceptOne(canvasId);

        if(!reconnect) {
            document.dispatchEvent(new CustomEvent(CREATE_EVENT))
        }
    }

    /**
     * Hide all canvases except a specific canvas.
     * @param {String} canvasToShow - Canvas to show... 
     */
    hideAllExceptOne(canvasToShow) {
        this.showQuestions(canvasToShow);
        this.changeTitle(canvasToShow);
        this.canvasList.forEach(canvas => {
            if(canvas.canvasId === canvasToShow) {
                this.activeCanvas = canvas;
                canvas.context.canvas.style.display = "block";
            } else {
                canvas.context.canvas.style.display = "none";
            }
        })
    }

    /**
     * 
     * @param {Event} event - Event that caused the canvas switch. 
     * @param {boolean} [reconnect] - Whether or not this event is a reconnection.
     */
    switchCanvas(event, reconnect) {
        let canvasId = event.target.id;
        this.hideAllExceptOne(canvasId);
        this.activeCanvas.reDraw();

        if(!reconnect) {
            document.dispatchEvent(new CustomEvent(SWITCH_EVENT, {
                detail: {
                    canvasId: canvasId
                }
            }))
        }
    }

    /**
     * Start recording mouse/touch movements to be drawn (starting point).
     * @param {Event} event - Event that started the painting. 
     */
    startPaint(event) {
        let paintX = ((event.clientX ? event.clientX : event.touches[0].clientX)
             + $('#canvas-container').scrollLeft());
        let paintY = ((event.clientY ? event.clientY : event.touches[0].clientY) 
             + $('#canvas-container').scrollTop());

        this.paint = true;
        this.activeCanvas.addClick(paintX, paintY, false, this.activeTool);

        requestAnimationFrame(() => this.activeCanvas.reDraw())
    }

    /**
     * Record a mouse/touch movement as being in the middle of a drawing (line).
     * @param {Event} event - Event that started the paint track. 
     */
    trackPaint(event) {
        if(this.paint){
            let paintX = ((event.clientX ? event.clientX : event.touches[0].clientX)
                 + $('#canvas-container').scrollLeft());
            let paintY = ((event.clientY ? event.clientY : event.touches[0].clientY) 
                 + $('#canvas-container').scrollTop());

            this.activeCanvas.addClick(paintX, paintY, true, this.activeTool);

            requestAnimationFrame(() => this.activeCanvas.reDraw())
        }
    }

    /**
     * Stop recording mouse movements to be drawn.
     */
    stopPaint() {
        this.paint = false
    }

    /**
     * Change which tool is currently active.
     * @param {Event} event - Tool change event. 
     */
    switchTool(event) {
        if(this.activeCanvas) {
            this.activeTool = Tool[event.target.id]
            $('#tool-color').val(this.activeTool.strokeStyle)
            $('#tool-size').val(this.activeTool.lineWidth)
            if(this.activeTool.color && this.activeTool.size) {
                $('#tool-size').prop("disabled", false)
                $('#tool-size').css("cursor", "pointer");
                $('#tool-color').prop("disabled", false)
                $('#tool-color').css("cursor", "pointer");
            } else if(this.activeTool.color) {
                $('#tool-color').prop("disabled", false)
                $('#tool-size').css("cursor", "pointer");
                $('#tool-size').prop("disabled", true)
                $('#tool-color').css("cursor", "not-allowed");
            } else if(this.activeTool.size) {
                $('#tool-size').prop("disabled", false)
                $('#tool-size').css("cursor", "pointer");
                $('#tool-color').prop("disabled", true)
                $('#tool-color').css("cursor", "not-allowed");
            }
        }
    }

    /**
     * Change the name for a given canvas.
     * @param {String} canvasId - Canvas to rename.
     * @param {String} renameText - New canvas name.
     */
    editCanvasName(canvasId, renameText) {
        $(`button#${canvasId}`).text(renameText);
        this.changeTitle(canvasId);
    }

    /**
     * Delete a specific canvas.
     * @param {String} canvasId - Canvas to delete. 
     */
    deleteCanvas(canvasId) {
       // Delete all canvas componenets.
       $(`#${canvasId}`).remove();
       $(`#${canvasId}`).remove();
       for(let i = 0; i < this.canvasList.length; i++) {
           if(this.canvasList[i].canvasId === canvasId) {
               this.canvasList.splice(i, 1);
           }
       }

       if(this.canvasList.length > 0) {
           this.switchCanvas({target: {id: this.canvasList[0].canvasId}})
       } else {
           this.activeCanvas = null;
           this.changeTitle();
       }
    }

    /**
     * Change the title for a given canvas.
     * @param {String} canvasId - Canvas to change title for. 
     */
    changeTitle(canvasId) {
        let titleText = $(`button#${canvasId}`).text()
        if(titleText) {
            $("#canvas-title").text(titleText)
        } else {
            $("#canvas-title").text("")
        }
    }

    /**
     * Refresh the room list and re display all users.
     * @param {Array} roomList - An array of all users in the room.
     * @param {String} yourId - The current users room ID.
     */
    updateRoomList(roomList, yourId) {
        $(".room-entry").remove()
        this.roomList = roomList
        roomList.forEach(toAdd => {
            this.addToRoom({name: toAdd.joiner.name, id: toAdd.id}, 
                yourId === toAdd.id ? true : false, 
                toAdd.joiner.type === HOST ? true : false)
        })
    }

    /**
     * Add and display a new user in the room list.
     * @param {Object} toAdd - Details about the user to add.
     * @param {String} toAdd.name
     * @param {String} toAdd.id
     * @param {boolean} isYou - Is the added user the current user.
     * @param {boolean} isHost - Is the added user the host.
     */
    addToRoom(toAdd, isYou, isHost) {
        let roomEntry = document.createElement("div");
        let container = document.getElementById("room-entries");
        roomEntry.textContent = toAdd.name + " " + (isYou ? "(You)" : "") + " " + (isHost ? "(Host)" : "")
        roomEntry.setAttribute("id", toAdd.id)
        roomEntry.setAttribute("class", "room-entry")
        container.appendChild(roomEntry);
    }

    /**
     * Display a particular question.
     * @param {Object} question - Details about a question to display.
     * @param {String} question.name
     * @param {Object} question.offset
     * @param {Number} question.offset.left
     * @param {Number} question.offset.top
     * @param {String} question.content
     * @param {String} question.canvas
     * @param {String} questionId - The questions ID.
     */
    askQuestion(question, questionId) {
        let newQuestion = document.getElementById("question-content-container").cloneNode(true)
        newQuestion.setAttribute("questionid", questionId)
        newQuestion.style.top = question.offset.top + 'px'
        newQuestion.style.left = question.offset.left + 'px'
        newQuestion.style.display = question.canvas === this.activeCanvas.canvasId ? "block" : "none"
        newQuestion.childNodes[3].textContent = `${question.name} asks: ${question.content}`
        $(`#canvas-container`).append(newQuestion)
        
        this.questions.push({
            canvasId: question.canvas,
            questionId: questionId,
            question: question
        })

        if(this.type === HOST) this.notifiyQuestion()
    }

    /**
     * Show all question asked about a particular canvas.
     * @param {String} canvasId - The canvas ID on which to show questions.
     */
    showQuestions(canvasId) {
        this.questions.forEach(question => {
            if(question.canvasId === canvasId) {
                $(`[questionid="${question.questionId}"]`).css("display", "block")
            } else {
                $(`[questionid="${question.questionId}"]`).css("display", "none")
            }
        })
    }

    /**
     * Notify the host that a question was asked.
     */
    notifiyQuestion() {
        if(this.type === HOST) {
            if(this.questions.length > 0) {
                $("#jump-question").show()
            } else {
                $("#jump-question").hide()
            }
        }
    }

    /**
     * Remove a specific question from the question list.
     * @param {Event} event - Event that caused the removal. 
     */
    removeQuestion(event) {
        let toDelete = event.target.parentNode.getAttribute("questionid")
        let deleteIndex;
        for(let i = 0; i < this.questions.length; i++) {
            if(this.questions[i].questionId == toDelete) {
                deleteIndex = i
            }      
        }
        this.questions.splice(deleteIndex, 1)
        $(`[questionid="${toDelete}"]`).remove()
        this.notifiyQuestion()
    }

    /** 
     * Change the current tool color.
     * @param {Event} event - Event that caused the change. 
     */
    changeToolColor(event) {
        this.activeTool.strokeStyle = event.target.value
    }

    /**
     * Change the current tool size.
     * @param {Event} event - Event that caused the change.
     */
    changeToolSize(event) {
        this.activeTool.lineWidth = event.target.value
    }

    /**
     * Display the copypaste control interface. 
     */
    showCopyPaste() {
        $('#copypaste-wrapper').toggle();
        $('#copypaste-wrapper').css("top", '50%')
        $('#copypaste-wrapper').css("left", '50%')
    }

    /**
     * Prepare for movement of the copypaste control interface.
     * @param {Event} event - Event that started the movement.
     */
    startCopyPasteMovement(event) {
        this.cpLeft = event.clientX ? event.clientX : event.touches[0].clientX;
        this.cpTop = event.clientY ? event.clientY : event.touches[0].clientY;
        this.moveCp = true;
    }

    /**
     * Prepare for resizing of the copypaste control interface.
     * @param {Event} event - Event that started the resize.
     */
    startResizingOfCopyPaste(event) {
        this.cpLeft = (event.clientX ? event.clientX : event.touches[0].clientX)
        this.cpTop = (event.clientY ? event.clientY : event.touches[0].clientY) 
        this.resizeCp = true;
        this.moveCp = false;
    }

    /**
     * Copy all painted coords inside the copypaste control interface.
     */
    copy() {
        // Copy whatever is in the selection.
        if(this.activeCanvas) {
            // Stop resize.
            this.canResize = false;

            // Copy the drawing inside the outline.
            let containerPos = $('#copypaste-container').offset()
            let minX = containerPos.left + $('#canvas-container').scrollLeft()
            let maxX = minX + $('#copypaste-container').width()
            let minY = containerPos.top + $('#canvas-container').scrollTop()
            let maxY = minY + $('#copypaste-container').height()

            this.copyCoords = []

            this.cpLocLeft = minX
            this.cpLocTop = minY

            let prevIndex = 0;
            for(let i = 0; i < this.activeCanvas.clickX.length; i++) {

                // Add an empty click to seperate lines.
                if(!(i === prevIndex)) {
                        this.copyCoords.push(undefined);
                        prevIndex = i;
                }

                if(this.activeCanvas.clickX[i] <= maxX && this.activeCanvas.clickX[i] >= minX 
                    && this.activeCanvas.clickY[i] <= maxY && this.activeCanvas.clickY[i] >= minY) {
                    
                    this.copyCoords.push({
                        clickX: this.activeCanvas.clickX[i],
                        clickY: this.activeCanvas.clickY[i],
                        dragging: this.activeCanvas.clickDrag[i],
                        tool: this.activeCanvas.tools[i]
                    })

                    prevIndex += 1;
                }
            }
        }
    }

    /**
     * Paste the currently copied coords to the current location of the
     * copypaste control interface.
     */
    paste() {
        // Paste the saved selection at the new location.
        Notif.load(true, "Pasting...");
        this.canResize = true;
        if(this.copyCoords && this.activeCanvas) {
            // Paste the most recent copy.
            let containerPos = $('#copypaste-container').offset()
            let leftOffset = containerPos.left - this.cpLocLeft + $('#canvas-container').scrollLeft()
            let topOffset = containerPos.top - this.cpLocTop + $('#canvas-container').scrollTop()

            this.activeCanvas.addClick()

            this.copyCoords.forEach(click => {
                if(click) {
                    let newClickX = click.clickX + leftOffset
                    let newClickY = click.clickY + topOffset

                    this.activeCanvas.addClick(newClickX, newClickY, click.dragging, click.tool)
                } else {
                    this.activeCanvas.addClick()
                }
            })

            this.activeCanvas.reDraw()   
        }
        Notif.load(false);
    }

    /**
     * Start the canvas renaming lifecycle. Sets up the relevant listeners.
     * @param {Event} event - Event that caused the rename.
     */
    rename(event) {
        let canvasId = event.target.id
        $("#rename-canvas").show().css("display", "inline-block");;
        $("#canvas-name-rename").text($(`button#${canvasId}`).text());

        $("#rename").on("click", event => {
            // Rename the canvas and hide.
            let renameText = $("#rename-name").val() === "" ? "..." : $("#rename-name").val();
            this.editCanvasName(canvasId, renameText);
            $("#rename-canvas").hide();
            $("#rename-name").val("");

            // Broadcast rename event.

            document.dispatchEvent(new CustomEvent(RENAME_EVENT, {
                detail: {
                    canvasId: canvasId,
                    newName: renameText
                }
            }))

            $( this ).off( event );
        })

        $("#cancel-rename").on("click", event => {
            // Cancel and hide.
            $("#rename-canvas").hide();
            $("#rename-name").val("");
            $( this ).off( event );
        })
    }

    /**
     * Start the canvas deletion lifecycle. Sets up the relevant listners.
     * @param {Event} event - Event that started the delete.
     */
    delete(event) {
        let canvasId = event.target.id;
        $("#delete-canvas").show().css("display", "inline-block");
        $("#canvas-name-delete").text($(`button#${canvasId}`).text());

        $("#delete").on("click", event => {
            
            this.deleteCanvas(canvasId);

            $("#delete-canvas").hide();

            // Broadcast delete event.

            document.dispatchEvent(new CustomEvent(DELETE_EVENT, {
                detail: {
                    canvasId: canvasId
                }
            }))

            $( this ).off( event );
        })

        $("#cancel-delete").on("click", event => {
            // Cancel and hide.
            $("#delete-canvas").hide();
            $( this ).off( event );
        })
    }

    /**
     * Stop all activated movement lifecycles.
     */
    stopAllMovement() {
        this.moveCp = false;
        this.resizeCp = false;
        this.scroll = false;
        this.moveQuestion = false
    }

    /**
     * Switch view to the next question.
     */
    nextQuestion() {
        let question = this.questions[0]
                
        this.switchCanvas({target: {id: question.canvasId}})
        $(`[questionid="${question.questionId}"]`).get(0).scrollIntoView()
        // This can be made better
    }

    /**
     * Start scrolling the canvas.
     * @param {Event} event - Event that started the scroll.
     */
    startCanvasScroll(event) {
        this.scroll = true;
        this.scrollLeft = event.touches[0].clientX
        this.scrollTop = event.touches[0].clientY
    }

    /**
     * Scroll the canvas.
     * @param {Event} event - Event that is causing the scroll.
     */
    scrollCanvas(event) {
        let scrollX = ($('#canvas-container').scrollLeft() 
            + (this.scrollLeft - event.touches[0].clientX));
        let scrollY = ($('#canvas-container').scrollTop() 
            + (this.scrollTop - event.touches[0].clientY));

        this.scrollLeft = event.touches[0].clientX;
        this.scrollTop = event.touches[0].clientY;

        document.getElementById('canvas-container').scroll(scrollX, scrollY)
    }

    /**
     * Control the copypaste control interface movement.
     * @param {Event} event - Event that is causing movement.
     */
    controlCopyPasteMovement(event) {
        // Resize or move?
        // Calculate difference between last two events. Add that to the current value 
        // (dimensions or location) update the element accrodingly. Do for either mouse 
        // event or touch event.
        if(event.clientX || event.touches) {
            let eventY = (event.clientY ? event.clientY : event.touches[0].clientY) 
            let eventX = (event.clientX ? event.clientX : event.touches[0].clientX)

            if(this.resizeCp && this.canResize) {
                let resizeX = eventX - this.cpLeft + $('#copypaste-container').width()
                let resizeY = eventY - this.cpTop + $('#copypaste-container').height()

                this.cpLeft = eventX
                this.cpTop = eventY

                $('#copypaste-container').height(resizeY + 'px')
                $('#copypaste-container').width(resizeX + 'px')

            } else if(this.moveCp) {
                let containerPos = $('#copypaste-wrapper').offset()
                let moveX = (eventX - this.cpLeft) + containerPos.left
                let moveY = (eventY - this.cpTop) + containerPos.top

                this.cpLeft = eventX
                this.cpTop = eventY
                
                $('#copypaste-wrapper').css("top", `${moveY}px`)
                $('#copypaste-wrapper').css("left", `${moveX}px`)
            }
        }
    }

    /**
     * Start the question lifecycle. Sets up the relevant listeners.
     */
    ask() {
        if(this.activeCanvas) {
            $('#question-container').css("top", `50%`)
            $('#question-container').css("left", `50%`)
            $("#question-container").toggle()
            // Ask and cancel listeners.
            $("#ask").on('click', event => {
                let questionOffset = $("#question-container").offset()
                let containerLeft = $("#canvas-container").scrollLeft()
                let containerTop = $("#canvas-container").scrollTop()
                document.dispatchEvent(new CustomEvent(QUESTION_EVENT, {
                    detail: {
                        canvas: this.activeCanvas.canvasId,
                        offset: {
                            top: questionOffset.top + containerTop,
                            left: questionOffset.left + containerLeft
                        },
                        content: $("#question-input").val()
                    }
                }))

                $("#question-container").hide()
                $(this).off(event)
            })
            $("#cancel-ask").on('click', event => {
                $("#question-container").hide()
                $(this).off(event)
            })
        }
    }

    /**
     * Prepare for moveing the question container.
     * @param {Event} event - Event that started the movement.
     */
    startQuestionMovement(event) {
        // Save initial click position and start moving.
        this.questionLeft = event.clientX ? event.clientX : event.touches[0].clientX;
        this.questionTop = event.clientY ? event.clientY : event.touches[0].clientY;
        this.moveQuestion = true;
    }

    /**
     * Move a specific question.
     * @param {Event} event - Event that is causing the movement.
     */
    controlQuestionMovement(event) {
        // Move the container.
        if(this.moveQuestion) {
            let containerPos = $('#question-container').offset()
            let moveX = ((event.clientX ? event.clientX : event.touches[0].clientX) 
                - this.questionLeft) + containerPos.left
            let moveY = ((event.clientY ? event.clientY : event.touches[0].clientY) 
                - this.questionTop) + containerPos.top

            this.questionLeft = (event.clientX ? event.clientX : event.touches[0].clientX)
            this.questionTop = (event.clientY ? event.clientY : event.touches[0].clientY) 
            
            $('#question-container').css("top", `${moveY}px`)
            $('#question-container').css("left", `${moveX}px`)
        }
    }

    /**
     * Toggle the displaying of a questions text.
     * @param {Event} event - Event that caused the toggle. 
     */
    toggleShowQuestion(event) {
        let container = event.target.parentNode
        if(container.querySelector("#question-input") == null) {
            if(container.style.height == "60px") {
                container.style.height = "auto"
            } else {
                container.style.height = "60px"
            }
        } 
    }

    /**
     * Take the currently active canvas, convert it to an image and download to the users device.
     */
    async download() {
        try {
            let originalContext = this.activeCanvas.context
            let copyCanvas = document.createElement("canvas")
            copyCanvas.width = originalContext.canvas.width
            copyCanvas.height = originalContext.canvas.height

            let copyContext = copyCanvas.getContext("2d")
            copyContext.drawImage(originalContext.canvas, 0, 0)
            copyContext.globalAlpha = 1;
            copyContext.setTransform(1, 0, 0, 1, 0, 0);
            copyContext.filter = "none";
            copyContext.globalCompositeOperation = "destination-over";
            copyContext.fillStyle = "#ececec";
            copyContext.fillRect(0, 0, copyContext.canvas.width, copyContext.canvas.height);

            var link = document.getElementById('download-link');
            link.setAttribute('download', $(`button#${this.activeCanvas.canvasId}`).text().replace(" ", "-") + ".png");
            link.setAttribute('href', copyContext.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"))
            link.click()
        } catch(e) {
            Notif.error("Error: Could not download whiteboard.")
        }
    }

    /**
     * Sets up the document event delegators for each type of event group.
     */
    documentListeners() {

        // Click delegator.
        $(document).on("click", event => {
            if(event.target.matches(".switch-canvas")) {
                this.switchCanvas(event)
            }

            if(event.target.matches(".dismiss-question")) {
                this.removeQuestion(event)
            }

            if(event.target.matches(".question-icon")) {
                this.toggleShowQuestion(event)
            }

            if(event.target.matches("#download")) {
                this.download()
            }

            if(this.type === HOST) {
                if(event.target.matches("#create-canvas")) {
                    this.createCanvas()
                }

                if(event.target.matches(".tool")) {
                    this.switchTool(event)
                }

                if(event.target.matches("#copypaste")) {
                    this.showCopyPaste()
                }

                if(event.target.matches("#copy")) {
                    this.copy()
                }

                if(event.target.matches("#paste")) {
                    this.paste()
                }

                if(event.target.matches(".edit-canvas")) {
                    this.rename(event)
                }

                if(event.target.matches(".delete-canvas")) {
                    this.delete(event)
                }

                if(event.target.matches("#next-question")) {
                    this.nextQuestion()
                }
            } else if(this.type === CLIENT) {
                if(event.target.matches("#ask-question")) {
                    this.ask()
                }
            }
        })

        // Touchstart and mousemove delegator.
        $(document).on("touchstart mousedown", event => {
            if(event.touches && event.touches.length >= 2) {
                this.startCanvasScroll(event)
            }

            if(this.type === HOST) {
                if(event.target.matches("#copypaste-wrapper")) {
                    this.startCopyPasteMovement(event)
                }

                if(event.target.matches("#copypaste-container")) {
                    this.startCopyPasteMovement(event)
                }

                if(event.target.matches("#resize")) {
                    this.startResizingOfCopyPaste(event)
                }

                if(event.target.matches("canvas")) {
                    if(!event.touches || event.touches.length === 1) {
                        this.startPaint(event)
                    }
                }
            } else if(this.type === CLIENT) {
                if(event.target.matches("div.question-icon")) {
                    this.startQuestionMovement(event)
                }

                if(event.target.matches("#question-container")) {
                    this.startQuestionMovement(event)
                }
            }

        })

        // Touchmove and mousemove delegator.
        $(document).on("touchmove mousemove", event => {
            if(this.scroll) {
                this.scrollCanvas(event)
            }

            if(this.type === HOST) {
                this.controlCopyPasteMovement(event)
                if(event.target.matches("canvas")) {
                    if(!this.scroll) {
                        this.trackPaint(event)
                    }
                }
            } else if(this.type === CLIENT) {
                this.controlQuestionMovement(event)
            }
        })

        // Touchend and mouseup delegator.
        $(document).on("touchend mouseup", event => {
            this.stopAllMovement()
            if(this.type === HOST) {      
                if(event.target.matches("canvas")) {
                    this.stopPaint()
                }
            }
        })

        // Mouseleave delegator.
        $(document).on("mouseleave", event => {
            if(this.type === HOST) {
                if(event.target.matches("canvas")) {
                    this.stopPaint()
                }
            }
        })

        // Change delegator.
        $(document).on("change", event => {
            if(this.type === HOST) {
                if(event.target.matches("#tool-color")) {
                    this.changeToolColor(event)
                }

                if(event.target.matches("#tool-size")) {
                    this.changeToolSize(event)
                }
            }
        })
    }
}