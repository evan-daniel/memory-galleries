import Palace from './lib/Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 

    // INSTANTIATE PALACE

    let palace = new Palace(); 
    const storagePalace = JSON.parse(localStorage.getItem('palace')); 
    if(storagePalace) {
        palace.load(storagePalace); 
    }
    await palace.Build(); 
    palace.Save(); 


    // ASSERTIONS

    const assertionGainFocus = input => {
        input.target.innerText = ''; 
    }; 

    const assertionSubmit = sub => {
        const mem = palace.Memories.find(mem => mem.id === +sub.target.parentElement.getAttribute('id')); 
        mem.assertion = sub.target.innerText; 
        l(mem); 
        palace.Save(); 
    }; 

    const assertionKeydown = keydown => {
        if(keydown.key === 'Return' || keydown.key === 'Enter') {
            document.activeElement.blur(); 
        }
    }; 


    // MAKE DOM MEMORIES

    const AddMemory = async palaceMemory => {
        if(!palaceMemory) {
            return; 
        }
        
        const template = document.querySelector('template[type="memory"]'); 
        const memory = template.content.cloneNode(true); 
        memory.querySelector('.assertion').innerText = palaceMemory.assertion ? `${palaceMemory.assertion}` : `${palaceMemory.id} : ${palaceMemory.fileName}`; 
        document.querySelector('.memories').prepend(memory); 
        
        // INIT LISTENERS
        
        // FRAGMENTS GET DELETED BEFORE CALLBACK FIRES, SO GET REF TO FULL ELEMENT
        const memoryRef = document.querySelector('.memories').firstElementChild; 

        memoryRef.setAttribute('id', `${palaceMemory.id}`); 

        const ass = memoryRef.querySelector('.assertion'); 
        ass.addEventListener('focus', assertionGainFocus); 
        ass.addEventListener('focusout', assertionSubmit); 
        ass.addEventListener('keydown', assertionKeydown); 
        
        // const imgFile = palaceMemory.handle; 
        const imgFile = await palace.Storage.MemoryImages.getFileHandle(`${palaceMemory.id}.${palaceMemory.extension}`);
        const memoryImg = await imgFile.getFile();
        const rdr = new FileReader(); 
        
        rdr.addEventListener('load', load => {
            const res = rdr.result; 
            memoryRef.querySelector('.memory-img').style.backgroundImage = `URL("${res}")`; 
        }); 
        rdr.readAsDataURL(memoryImg); 
    }
    
    for(let i = 0; i < palace.Memories.length; ++i) {
        AddMemory(palace.Memories[i]); 
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
        }
    }
    document.querySelector('.floor-plan').addEventListener('mousedown', roomActivation); 
    document.querySelector('.floor-plan').addEventListener('mouseover', roomActivation); 

    document.querySelector('.floor-plan').addEventListener('mouseup', () => palace.Save()); 


    // CLEAR THE MAP

    document.querySelector('.clear').addEventListener('click', click => {
        palace = new Palace(); 
        palace.Build(); 
        palace.Save(); 

        document.querySelectorAll('[active="true"]').forEach(room => {
            room.setAttribute('active', 'false'); 
        }); 

        document.querySelectorAll('div.memory').forEach(mem => {
            mem.remove(); 
        }); 
    })
    
    // SAVE FILE INPUT

    const input = document.querySelector('.memories input'); 
    input.addEventListener('change', async change => {
        const file = input.files[0]; 
        let id = -1; 
        if(file) {
            id = await palace.addMemory(file); 
        }
        
        if(id !== -1) {
            AddMemory(palace.Memories.find(mem => mem.id === id)); 

            // TESTING
            palace.Rooms[0][0].memories.north = id; 

            palace.Save(); 
        }
    }); 

}); 

const l = console.log; 