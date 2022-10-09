window.addEventListener('DOMContentLoaded', () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 
    
    // INIT
    
    let rooms = []; 
    for(let y = 0; y < roomsPerSide; ++y) {
        rooms[y] = []; 
        for(let x = 0; x < roomsPerSide; ++x) {
            rooms[y][x] = {
                column: x, 
                row: y, 
                active: false, 
            }; 
        }
    }

    // INIT
    
    const roomsDom = document.createDocumentFragment('div'); 
    for(let y = 0; y < roomsPerSide; ++y) {
        for(let x = 0; x < roomsPerSide; ++x) {
            const room = document.createElement('div'); 
            room.classList.add('room'); 
            room.setAttribute('column', x); 
            room.setAttribute('row', y);
            room.setAttribute('active', false);  
            roomsDom.appendChild(room); 
        }
    }
    document.querySelector('.map').append(roomsDom); 
    
    // MAP
    
    const map_RoomsDom_To_Rooms = () => {
        document.querySelectorAll('.room').forEach(room => {
            rooms[+room.getAttribute('row')][+room.getAttribute('column')].active = room.getAttribute('active') === 'true'; 
        }); 
    }; 

    // EVENT

    const roomActivation = clickRoom => {
        const room = clickRoom.target; 

        if(room.classList.contains('room') && clickRoom.buttons === 1) {
            room.setAttribute('active', room.getAttribute('active') !== 'true'); 

            map_RoomsDom_To_Rooms(); 
            localStorage.setItem('rooms', JSON.stringify(rooms)); 
        }
    }
    document.querySelector('.map').addEventListener('mousedown', roomActivation); 
    document.querySelector('.map').addEventListener('mouseover', roomActivation); 
}); 