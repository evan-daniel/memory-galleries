window.addEventListener('DOMContentLoaded', () => {

    // SETUP
    
    const context = document.querySelector('canvas').getContext('2d'); 
    
    let side = 0; 
    const resize = () => {
        side = context.canvas.width = context.canvas.height = window.devicePixelRatio * context.canvas.clientHeight; 
        console.log(`SIDE: ${side}`)
    }; 
    window.addEventListener('resize', resize); 
    resize(); 
    
    // BUFFER

    const rooms = []; 
    const ROOM_NUMBER = 16; 
    for(let y = 0; y < ROOM_NUMBER; ++y) {
        rooms[y] = []; 
        for(let x = 0; x < ROOM_NUMBER; ++x) {
            rooms[y][x] = {
                active: y === 3 ? true : false, 
            }
        }
    }
    
    // RENDER

    const animate = () => {

        // CLEAR
        
        context.fillStyle = '#FFF'; 
        context.strokeStyle = '#000'; 
        context.lineWidth = 2; 

        context.clearRect(0, 0, side, side); 
        context.fillRect(0, 0, side, side); 
        
        // CONVENIENCE
        
        const rs = side / ROOM_NUMBER; 
        
        // ROOMS
        
        rooms.forEach((roomBuffer, c) => {
            context.stroke
            roomBuffer.forEach((room, r) => {
                context.fillStyle = '#888'; 
                if(room.active) {
                    context.fillStyle = '#88f'; 
                }
                
                context.beginPath(); 
                context.rect(rs * c, rs * r, rs, rs); 
                context.fill(); 
                context.stroke(); 
            }); 
        }); 
        
        window.requestAnimationFrame(animate); 
    }; 
    window.requestAnimationFrame(animate); 
}); 