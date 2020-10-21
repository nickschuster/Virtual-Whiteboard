import { DRAW_EVENT } from "./events.js";
import { Tool } from './tool.js'

export default class Canvas {

    constructor(canvasId) {
        // Where to draw.
        this.context = $(`canvas#${canvasId}`)[0].getContext('2d');
        this.canvasId = canvasId;

        // Positions to draw.
        this.clickX = [];
        this.clickY = [];
        this.clickDrag = [];

        // Tool used
        this.tools = [];

        // Canvas size.
        this.width = window.innerWidth*0.9;
        this.height = window.innerHeight*0.9;
    }

    // Add a click to the position arrays.
    addClick(mouseX, mouseY, dragging, tool) {
        if(mouseY >= this.height-50 || mouseX >= this.width-50) {
            this.newSizeNeeded();
        }

        this.clickX.push(mouseX);
        this.clickY.push(mouseY);
        this.clickDrag.push(dragging);
        this.tools.push(Object.assign({}, tool));

        document.dispatchEvent(new CustomEvent(DRAW_EVENT, {
            detail: {
                mouseX: mouseX,
                mouseY: mouseY,
                dragging: dragging,
                canvasId: this.canvasId,
                tool: tool
            }
        }))
    }

    reDraw() {
        let mostRecentTool;
        for(let i = 0; i < this.clickX.length; i++) {
            if(mostRecentTool !== this.tools[i]) {
                mostRecentTool = this.tools[i]
                Object.keys(this.tools[i]).forEach(key => {
                    this.context[key] = this.tools[i][key]
                })
            }
            this.context.beginPath();
            if(this.clickDrag[i] && i) {
                this.context.moveTo(this.clickX[i-1], this.clickY[i-1]);
            } else {
                this.context.moveTo(this.clickX[i], this.clickY[i]);
            }
            this.context.lineTo(this.clickX[i], this.clickY[i]);
            this.context.stroke();
            this.context.closePath();
        }

    }

    newSizeNeeded() {
        this.width = this.width * 1.5;
        this.height = this.height * 1.5;
        this.resize();
    }

    resize() {
        this.context.canvas.width = this.width;
        this.context.canvas.height = this.height;

        this.reDraw();
    }

}