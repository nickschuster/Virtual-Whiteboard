// Controls the UI.

export default class UI {
    constructor() {
        this.leftCollapsed = true

        this.setUpListeners();
    }

    setUpListeners() {
        $('#arrow-image').on('click', () => {
            this.collapseLeft()
        })
    }

    collapseLeft() {
        $('#controls').css('left', (this.leftCollapsed ? '0px' : '-240px'))
        $('#arrow-image').css('transform', (this.leftCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'))
        this.leftCollapsed = !this.leftCollapsed
    }

}