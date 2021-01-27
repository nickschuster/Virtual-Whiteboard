import Menu from './menu.js'
import Notif from './notify.js';
import Room from './room.js'

/** Starts the app lifecycle. */
window.onload = () => {

    new Menu();
    new Room();
    Notif.init();
}
