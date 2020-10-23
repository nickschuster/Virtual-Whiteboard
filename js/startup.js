// This file starts all App processes.

import UI from './ui.js'
import Room from './room.js'

window.onload = () => {

    let ui = new UI();
    let room = new Room();

    // Next steps:
            // Clean up UI - done
            // Fix bugs. - scroll bug!/mobile bugs! - done
            // Basic draw - size and color - done
    
            // Highlighter - size and color - set opacity - done 
            // Eraser - done

            // SCROLLING WHILE BEING THE CLIENT!!! - done
    
            // Copy and paste of selection - done - may want to redo UI lol. 
    
    // Renaming of Canvases
    // Room list with nicknames
    // Send history to new joiners
    // Ask question
    // Be notified of question 
    // View question
    // Jump to next question
    // Save a canvas as an image
    // Reconnections / Service interuptions.   
    // UI / Mobile 
        // Highlight the current HOST canvas.
        // Highlight where there is a question.
    // Implement better creator code detection and authorization
    // Room code translation.
    // Payment and about page for virtual-whiteboard
    // Tls/DNS for rooms?
    // Logo for mobile.
    
    // ON HOLD //

    // Change the drawing function to only draw changes
    // Line smoothing?
    // Zoom ??? - hard to do I think.
    // Undo Redo - cant be done - no way to delete as of now

}