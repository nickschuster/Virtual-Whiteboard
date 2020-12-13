/** This file holds functions for notification, error and load showing; they are wrapped in the Notif object. */
const Notif = {

    /** Set up the dismiss listener for any notification box. */
    init: () => {
        $("#notification-container").on("click touch", () => {
            $("#notification-container").removeClass("open")
        })
    },
    /** Control the loading animation.
     * @param {String} [message] - The message to show while loading. Optional.
     * @param {boolean} show - Whether or not to show the loading animation.
     */
    load: (show, message) => {
        $('#load').css('display', (show ? 'block' : 'none'));
        $('#load-message').css('display', (show ? 'block' : 'none')).text(message ? message : "");
    },
    /** Notify the user of something. 
     *  @param {String} message - The notification message.
     *  @param {Number} time - How long to display the notification.
     */
    notify: (message, time) => {
        $("#notification-container").addClass("open")
        $("#notification-message").text(message)
        setTimeout(() => {
            $("#notification-container").removeClass("open")
        }, (time ? time : 2500))
    },
    /** Show the user an error message.
     *  @param {String} message - The error message.
     *  @param {Number} time - How long to display the error.
     */
    error: (message, time) => {
        $("#notification-container").addClass("open")
        $("#notification-message").text(message)
        $("#notification-container").addClass("error")
        setTimeout(() => {
            $("#notification-container").removeClass("error")
            $("#notification-container").removeClass("open")
        }, (time ? time : 3500))
    }
}

export default Notif