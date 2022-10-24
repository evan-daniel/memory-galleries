import Palace from './lib/Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 


    // INSTANTIATE PALACE

    let palace = new Palace(); 
    await palace.Build(); 
    console.log(palace); 
    palace.Save(); 


    // MAKE DOM MEMORIES

    const AddMemory = async memoryId => {
        const palaceMemory = palace.Memories.find(mem => mem.id === memoryId); 
        if(!palaceMemory) {
            return; 
        }
        
        const template = document.querySelector('template[type="memory"]'); 
        const memory = template.content; 
        memory.querySelector('.assertion').innerText = palaceMemory.assertion; 
        document.querySelector('.memories').prepend(memory); 

        // const imgFile = palaceMemory.handle; 
        const imgFile = await palace.Storage.MemoryImages.getFileHandle(`${palaceMemory.id}.${palaceMemory.extension}`);
        const memoryImg = await imgFile.getFile();
        const rdr = new FileReader(); 

        rdr.addEventListener('load', load => {
            const res = rdr.result; 
            document.querySelector('.memory').style.backgroundImage = `URL("${res}")`; 
        }); 
        rdr.readAsDataURL(memoryImg); 
    }
    
    for(let i = 0; i < palace.MemoryCount; ++i) {
        AddMemory(i); 
    }


    // MAKE DOM ELEMENTS
    
    const roomsDom = document.createDocumentFragment('div'); 
    for(let y = 0; y < roomsPerSide; ++y) {
        for(let x = 0; x < roomsPerSide; ++x) {
            const room = document.createElement('div'); 
            room.classList.add('room'); 
            room.setAttribute('column', x); 
            room.setAttribute('row', y);
            room.setAttribute('active', palace.Rooms[y][x].active);  
            roomsDom.appendChild(room); 
        }
    }
    document.querySelector('.floor-plan').append(roomsDom); 
    
    
    // ACTIVATE/DEACTIVATE ROOM
    
    const roomActivation = clickRoom => {
        const room = clickRoom.target; 
        
        if(room.classList.contains('room') && clickRoom.buttons === 1) {
            const act = room.getAttribute('active') !== 'true'; 
            room.setAttribute('active', act); 
            palace.Rooms[+room.getAttribute('row')][+room.getAttribute('column')].active = act; 
            palace.Save(); 
        }
    }
    document.querySelector('.floor-plan').addEventListener('mousedown', roomActivation); 
    document.querySelector('.floor-plan').addEventListener('mouseover', roomActivation); 

    
    // SAVE FILE INPUT

    const input = document.querySelector('.memories input'); 
    input.addEventListener('change', async change => {
        const file = input.files[0]; 
        let id = -1; 
        if(file) {
            id = await palace.addMemory(file); 
        }
        
        if(id !== -1) {
            AddMemory(id); 

            // TESTING
            palace.Rooms[0][0].memories.north = id; 

            palace.Save(); 
        }
    }); 

}); 