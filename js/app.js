import Canvas from './canvas.js';
import { CREATE_EVENT, SWITCH_EVENT, CLIENT, HOST, RENAME_EVENT, DELETE_EVENT, QUESTION_EVENT } from "./events.js"
import { Tool } from './tool.js'

/** Represents the user controlling an App. */
export default class App {

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
        this.paint;

        // Create the listeners that make the app work.
        this.type = type;
        this.documentListeners(this.type)

        // The currently active tool.
        this.activeTool = Tool.draw

        // Copy paste location information.
        this.cpLeft = 0;
        this.cpTop = 0;
        this.moveCp = false;
        this.resizeCp = false;

        // Current copy content.
        this.copy = []
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

    // Create all the resource controls for a canvas.
    // Binds them to a canvasId.
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
        if(this.type == CLIENT) {
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

    // Button listener for creating a new canvas.
    createCanvas(event, reconnect) {
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

    // Hide all canvases except the one specified.
    //
    // Takes an ID of a canvas to show.
    hideAllExceptOne(canvasToShow) {
        this.showQuestions(canvasToShow);
        this.changeTitle(canvasToShow);
        this.canvasList.forEach(canvas => {
            if(canvas.canvasId == canvasToShow) {
                this.activeCanvas = canvas;
                canvas.context.canvas.style.display = "block";
            } else {
                canvas.context.canvas.style.display = "none";
            }
        })
    }

    // Switch to a specific canvas.
    //
    // Takes a click event.
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

    // Record a click and start painting.
    startPaint(event) {
        // Clear the redo queue when making a change.
        this.redo = []

        let paintX = event.pageX + $('#canvas-container').scrollLeft();
        let paintY = event.pageY + $('#canvas-container').scrollTop();

        this.paint = true;
        this.activeCanvas.addClick(paintX, paintY, false, this.activeTool);
        this.activeCanvas.reDraw();
    }

    // Record click move and paint.
    trackPaint(event) {
        if(this.paint){
            let paintX = event.pageX + $('#canvas-container').scrollLeft();
            let paintY = event.pageY + $('#canvas-container').scrollTop();

            this.activeCanvas.addClick(paintX, paintY, true, this.activeTool);
            this.activeCanvas.reDraw();
        }
    }

    // Stop painting.
    stopPaint(event) {
        this.paint = false
    }

    // Switch the currently active tool.
    switchTool(event) {
        if(this.activeCanvas) {
            this.activeTool = Tool[event.target.id]
            $('#tool-size').val(this.activeTool.lineWidth)
            $('#tool-color').val(this.activeTool.strokeStyle)
        }
    }

    // Edit the name of a canvas.
    editCanvasName(canvasId, renameText) {
        $(`button#${canvasId}`).text(renameText);
        this.changeTitle(canvasId);
    }

    // Delete a canvas.
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

    // Change the canvas title.
    changeTitle(canvasId) {
        let titleText = $(`button#${canvasId}`).text()
        if(titleText) {
            $("#canvas-title").text(titleText)
        } else {
            $("#canvas-title").text("")
        }
    }

    // Turn the loading animation on or off.
    load(show, loadMessage) {
        $('#load').css('display', (show ? 'block' : 'none'));
        $('#load-message').css('display', (show ? 'block' : 'none')).text(loadMessage ? loadMessage : "");
    }

    // Update the room list.
    updateRoomList(roomList, yourId) {
        $(".room-entry").remove()
        this.roomList = roomList
        roomList.forEach(toAdd => {
            this.addToRoom({name: toAdd.joiner.name, id: toAdd.id}, yourId == toAdd.id ? true : false, toAdd.joiner.type == HOST ? true : false)
        })
    }

    // Add someone to the room list.
    addToRoom(toAdd, isYou, isHost) {
        let roomEntry = document.createElement("div");
        let container = document.getElementById("room-entries");
        roomEntry.textContent = toAdd.name + " " + (isYou ? "(You)" : "") + " " + (isHost ? "(Host)" : "")
        roomEntry.setAttribute("id", toAdd.id)
        roomEntry.setAttribute("class", "room-entry")
        container.appendChild(roomEntry);
    }

    // Display an asked question.
    askQuestion(question, questionId) {
        let newQuestion = document.getElementById("question-content-container").cloneNode(true)
        newQuestion.setAttribute("questionid", questionId)
        newQuestion.style.top = question.offset.top + 'px'
        newQuestion.style.left = question.offset.left + 'px'
        newQuestion.style.display = question.canvas == this.activeCanvas.canvasId ? "block" : "none"
        newQuestion.childNodes[3].textContent = `${question.name} asks: ${question.content}`
        $(`#canvas-container`).append(newQuestion)
        
        this.questions.push({
            canvasId: question.canvas,
            questionId: questionId,
            question: question
        })

        if(this.type == HOST) this.notifiyQuestion()
    }

    // Show all the questions for a specific canvas.
    showQuestions(canvasId) {
        this.questions.forEach(question => {
            if(question.canvasId == canvasId) {
                $(`[questionid="${question.questionId}"]`).css("display", "block")
            } else {
                $(`[questionid="${question.questionId}"]`).css("display", "none")
            }
        })
        $(".dismiss-question").css("display", this.type == HOST ? "block" : "none")
    }

    // Notify host of a question.
    notifiyQuestion() {
        if(this.questions.length > 0) {
            $("#jump-question").show()
            // TODO
        }
    }

    // Remove a question from the list.
    removeQuestion(question) {
        console.log(question.getAttribute("questionid"))
    }

    /** 
     * Change the current tool color.
     * @param {String} color - Color to change to.  
     */
    changeToolColor(color) {
        this.activeTool.strokeStyle = color
    }

    /**
     * Change the current tool size.
     * @param {Number} size - Size to change to.
     */
    changeToolSize(size) {
        this.activeTool.lineWidth = size
    }

    /**
     * Sets up the document event delegators for each type of event.
     * @param {Number} type - The type of user. 
     */
    documentListeners(type) {

        // Click delegator.
        $(document).on("click", event => {
            if(type == HOST) {
                if(event.target.matches(".switch-canvas")) {
                    this.switchCanvas(event)
                }

                if(event.target.matches("#create-canvas")) {
                    this.createCanvas(event)
                }

                if(event.target.matches(".tool")) {
                    this.switchTool(event)
                }
            }
        })

        // Change delegator.
        $(document).on("change", event => {
            if(type === HOST) {
                if(event.target.matches("#tool-color")) {
                    this.changeToolColor(event.target.value)
                }

                if(event.target.matches("#tool-size")) {
                    this.changeToolSize(event.target.value)
                }
            }
        })

        // Touchstart and mousemove delegator.
        $(document).on("touchstart mousemove", event => {

        })

        // Touchmove and mousemove delegator.
        $(document).on("touchmove mousemove", event => {

        })

        // Touchend and mouseup delegator.
        $(document).on("touchend mouseup", event => {

        })

        // Mouseleave delegator.
        $(document).on("mouseleave", event => {

        })

        if(type === HOST) {

            // Copy paste.
            $('#copypaste').on('click', event => {
                $('#copypaste-container').toggle();
                $('#copypaste-container').css("top", '50%')
                $('#copypaste-container').css("left", '50%')
            }) // Copy paste movement and resizing mobile and pc.
            $('#copypaste-container').on('mousedown touchstart', event => {
                // Save initial click position and start moving
                this.cpLeft = event.clientX ? event.clientX : event.touches[0].clientX;
                this.cpTop = event.clientY ? event.clientY : event.touches[0].clientY;
                this.moveCp = true;
            })
            $(document).on('mousemove touchmove', event => {
                // Resize or move?
                // Calculate difference between last two events. Add that to the current value (dimensions or location)
                // update the element accrodingly. Do for either mouse event or touch event.
                if(this.resizeCp) {
                    let resizeX = (event.clientX ? event.clientX : event.touches[0].clientX)
                        - this.cpLeft + $('#copypaste-container').width()
                    let resizeY = (event.clientY ? event.clientY : event.touches[0].clientY) 
                        - this.cpTop + $('#copypaste-container').height()

                    this.cpLeft = (event.clientX ? event.clientX : event.touches[0].clientX)
                    this.cpTop = (event.clientY ? event.clientY : event.touches[0].clientY)

                    $('#copypaste-container').height(resizeY + 'px')
                    $('#copypaste-container').width(resizeX + 'px')

                } else if(this.moveCp) {
                    let containerPos = $('#copypaste-container').offset()
                    let moveX = ((event.clientX ? event.clientX : event.touches[0].clientX) 
                        - this.cpLeft) + containerPos.left
                    let moveY = ((event.clientY ? event.clientY : event.touches[0].clientY) 
                        - this.cpTop) + containerPos.top

                    this.cpLeft = (event.clientX ? event.clientX : event.touches[0].clientX)
                    this.cpTop = (event.clientY ? event.clientY : event.touches[0].clientY) 
                    
                    $('#copypaste-container').css("top", `${moveY}px`)
                    $('#copypaste-container').css("left", `${moveX}px`)
                }
            })
            $(document).on('mouseup touchend', event => {
                // Stop resizing or moveing.
                this.moveCp = false;
                this.resizeCp = false;
            })
            $('#resize').on('mousedown touchstart', event => {
                // Start resizing. Don't move (needed because it's too close to move 'hitbox').
                this.cpLeft = (event.clientX ? event.clientX : event.touches[0].clientX)
                this.cpTop = (event.clientY ? event.clientY : event.touches[0].clientY) 
                this.resizeCp = true;
                this.moveCp = false;
            })   
            $('#copy').on('click', () => {
                // Copy whatever is in the selection.
                if(this.activeCanvas) {
                    // Copy the drawing inside the outline.
                    let containerPos = $('#copypaste-container').offset()
                    let minX = containerPos.left + $('#canvas-container').scrollLeft()
                    let maxX = minX + $('#copypaste-container').width()
                    let minY = containerPos.top + $('#canvas-container').scrollTop()
                    let maxY = minY + $('#copypaste-container').height()

                    this.copy = []

                    this.cpLocLeft = minX
                    this.cpLocTop = minY

                    let prevIndex = 0;
                    for(let i = 0; i < this.activeCanvas.clickX.length; i++) {

                        // Add an empty click to seperate lines.
                        if(!(i === prevIndex)) {
                                this.copy.push(undefined);
                                prevIndex = i;
                        }

                        if(this.activeCanvas.clickX[i] <= maxX && this.activeCanvas.clickX[i] >= minX 
                            && this.activeCanvas.clickY[i] <= maxY && this.activeCanvas.clickY[i] >= minY) {
                            
                            this.copy.push({
                                clickX: this.activeCanvas.clickX[i],
                                clickY: this.activeCanvas.clickY[i],
                                dragging: this.activeCanvas.clickDrag[i],
                                tool: this.activeCanvas.tools[i]
                            })

                            prevIndex += 1;
                        }
                    }
                }
            })
            $('#paste').on('click', () => {
                // Paste the saved selection at the new location.
                this.load(true, "Pasting...");
                if(this.copy && this.activeCanvas) {
                    // Paste the most recent copy.
                    let containerPos = $('#copypaste-container').offset()
                    let leftOffset = containerPos.left - this.cpLocLeft + $('#canvas-container').scrollLeft()
                    let topOffset = containerPos.top - this.cpLocTop + $('#canvas-container').scrollTop()

                    this.activeCanvas.addClick()

                    this.copy.forEach(click => {
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
                this.load(false);
            })

            // Rename and delete a canvas.
            $(document).on('click', 'img.edit-canvas', event => {
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
            })
            $(document).on('click', 'img.delete-canvas', event => {
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
            })

            // Drawing controls.
            $(document).on("mousedown", "canvas", (event) => {
                // Start drawing.
                event.preventDefault();

                this.startPaint(event);
            });
            $(document).on("mousemove", "canvas", (event) => {
                // If the mouse is being clicked start adding drag locations to be drawn.
                event.preventDefault();

                this.trackPaint(event);
            });
            $(document).on("mouseup mouseleave", "canvas", (event) => {
                // Stop drawing when mouse stops being on canvas or stops being clicked.
                event.preventDefault();

                this.stopPaint(event);
            });

            // Question control.
            $("#next-question").on("click", event => {
                let question = this.questions[0]
                
                this.switchCanvas({target: {id: question.canvasId}})
                $(`[questionid="${question.questionId}"]`).get(0).scrollIntoView()
                // This can be made better
            })
            $(document).on("click", "button.dismiss-question", event => {
                this.removeQuestion(event.target.parentNode)
            })

            /// MOBILE ///

            // Drawing listners for mobile.
            $(document).on("touchstart", "canvas", (event) => {
                if(event.touches.length >= 2) {
                    // Enable scroll
                    this.scroll = true;
                    this.scrollLeft = event.touches[0].clientX
                    this.scrollTop = event.touches[0].clientY

                } else {

                    // Disable scroll
                    this.scroll = false;

                    // startPaint expects a mouse event so must transfrom touch event.
                    const transEvent = {
                        pageX: event.touches[0].clientX,
                        pageY: event.touches[0].clientY
                    }

                    this.startPaint(transEvent);
                }
            })
            $(document).on("touchmove", "canvas", (event) => {
                if(this.scroll) {

                    let scrollX = $('#canvas-container').scrollLeft() + (this.scrollLeft - event.touches[0].clientX);
                    let scrollY = $('#canvas-container').scrollTop() + (this.scrollTop - event.touches[0].clientY);

                    this.scrollLeft = event.touches[0].clientX;
                    this.scrollTop = event.touches[0].clientY;

                    document.getElementById('canvas-container').scroll(scrollX, scrollY)
                } else {
                    // startPaint expects a mouse event so must transfrom touch event.
                    const transEvent = {
                        pageX: event.touches[0].clientX,
                        pageY: event.touches[0].clientY
                    }

                    this.trackPaint(transEvent);
                }
            })
            $(document).on("touchend", "canvas", (event) => {
                this.scroll = false;
                this.stopPaint(event)
            })

        } else if (type === CLIENT) {
            $('#tool-container').hide()
            $('#ask-question-container').show()

            $(document).on("click", "button.switch-canvas", event => {
                this.switchCanvas(event)
            });

            // Asking a question and question container movement.
            $('#ask-question').on("click", event => {
                if(this.activeCanvas) {
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
            })
            $(document).on("touchstart mousedown", "#question-container", event => {
                // Save initial click position and start moving.
                this.questionLeft = event.clientX ? event.clientX : event.touches[0].clientX;
                this.questionTop = event.clientY ? event.clientY : event.touches[0].clientY;
                this.moveQuestion = true;
            })
            $(document).on("touchmove mousemove", "#question-container", event => {
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
            })
            $(document).on("touchend mouseup", event => {
                // Stop moving the container.
                this.moveQuestion = false
            })

            // MOBILE //

            // Scrolling.

            $(document).on("touchstart", "canvas", (event) => {
                if(event.touches.length >= 2) {
                    // Enable scroll
                    this.scroll = true;
                    this.scrollLeft = event.touches[0].clientX
                    this.scrollTop = event.touches[0].clientY

                }
            })
            $(document).on("touchmove", "canvas", (event) => {
                if(this.scroll) {

                    let scrollX = $('#canvas-container').scrollLeft() + (this.scrollLeft - event.touches[0].clientX);
                    let scrollY = $('#canvas-container').scrollTop() + (this.scrollTop - event.touches[0].clientY);

                    this.scrollLeft = event.touches[0].clientX
                    this.scrollTop = event.touches[0].clientY

                    document.getElementById('canvas-container').scroll(scrollX, scrollY)
                }
            })
            $(document).on("touchend", "canvas", (event) => {
                this.scroll = false;
            })
        }
    }
}