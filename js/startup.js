import Menu from './menu.js'
import Notif from './notify.js';
import Room from './room.js'

/** Starts the app lifecycle. */
window.onload = () => {

    new Menu();
    new Room();
    Notif.init();

    // DONE:
        // Clean up UI - done
        // Fix bugs. - scroll bug!/mobile bugs! - done
        // Basic draw - size and color - done
        // Highlighter - size and color - set opacity - done 
        // Eraser - done
        // SCROLLING WHILE BEING THE CLIENT!!! - done
        // Copy and paste of selection - done - may want to redo UI lol. 
        // Renaming/Deleting of Canvases - Mobile disable button. - done
        // Copy and paste bug with continuing lines. - done - may want to look into refactoring to image copy/paste
        // Canvas title and no canvas selected image.
        // Loading text/Steps/Timer
        // Rebrand canvas as whitebaord across app.
        // Change the drawing function to only draw changes
        // Room code translation.
        // Send history to new joiners
        // Reconnections / Service interuptions.  
        // Room list with nicknames
        // Overflow scroll is broken
        // Ask question
            
    // TODO:  
        // Revisit copy paste
        // Revisit draw controls

        // UI / Mobile 
            // Highlight the current HOST canvas.
            // Highlight where there is a question.
            // Add icons/fonts/positioning
            // Error box.
            // Logo for mobile.
            // Be notified of actions in app.
            // Animation for hiding question text.

        // About page for virtual-whiteboard

        // Implement better creator code detection and authorization

        // Tls/DNS for rooms?
        // Donwload all canvases?
        // Mute and kick from room?
}
