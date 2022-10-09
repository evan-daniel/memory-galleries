window.addEventListener('DOMContentLoaded', () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 
    
    const map = document.createDocumentFragment('div'); 
    for(let y = 0; y < roomsPerSide; ++y) {
        for(let x = 0; x < roomsPerSide; ++x) {
            const room = document.createElement('div'); 
            room.classList.add('room'); 
            room.setAttribute('column', y); 
            room.setAttribute('row', x); 

            map.appendChild(room); 
        }
    }
    document.querySelector('.map').append(map); 
}); 