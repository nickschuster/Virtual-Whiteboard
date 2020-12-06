/** An object that contains all relevant tool information. */
export let Tool = {
    draw: {
        lineWidth: 1,
        strokeStyle: '#000000',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        lineJoin: 'round',
        lineCap: 'round'
    },
    erase: {
        lineWidth: 5,
        strokeStyle: '#ececec',
        globalAlpha: 1,
        globalCompositeOperation: 'destination-out',
        lineJoin: 'round',
        lineCap: 'round'

    },
    highlight: {
        lineWidth: 50,
        strokeStyle: '#ffff00',
        globalCompositeOperation: "multiply",
        lineJoin: 'round',
        lineCap: 'round'
    }
}