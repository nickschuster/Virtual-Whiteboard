/** Controls the Menu UI component */
export default class Menu {

    /**
     * @constructor
     */
    constructor() {
        this.leftCollapsed = true

        this.documentListeners();
    }

    /**
     * Creates the event delegators
     */
    documentListeners() {
        // Click and touch event delegator.
        $(document).on("click touchstart", event => {
            if(event.target.matches("#arrow-image")) {
                this.collapseLeft()
            }

            if(event.target.matches("#canvas-container")) {
                if(!this.leftCollapsed) this.collapseLeft();
            }
        })
    }

    /**
     * Collapse or uncollapse the left menu.
     */
    collapseLeft() {
        $('#controls').css('left', (this.leftCollapsed ? '0px' : '-240px'))
        $('#arrow-image').css('transform', (this.leftCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'))
        this.leftCollapsed = !this.leftCollapsed
    }

}