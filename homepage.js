window.addEventListener('DOMContentLoaded', () => {
    const cont = document.querySelector('canvas').getContext('2d'); 
    cont.canvas.width = window.devicePixelRatio * cont.canvas.clientWidth; 
    cont.canvas.height = window.devicePixelRatio * cont.canvas.clientHeight; 
}); 