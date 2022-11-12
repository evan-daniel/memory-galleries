import '../css/global.css'; 
import '../css/map.css'; 

import Palace from './Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {
    const roomsPerSide = 16; 
    document.documentElement.style.setProperty('--rooms-per-side', `${roomsPerSide}`); 

    // INSTANTIATE PALACE

    let palace = new Palace(); 
    const storagePalace = JSON.parse(localStorage.getItem('palace')); 
    await palace.Build(); 
    if(storagePalace) {
        await palace.load(storagePalace); 
        console.log(palace); 
    }
    palace.Save(); 

    /* 
    * 
    * 
    * MEMORIES
    * 
    * 
    */

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


    // CONVENIENCE
    // ADD BACKGROUND IMAGES

    const addBgImg = async (handle, elem) => {
        const rdr = new FileReader(); 
        rdr.addEventListener('load', () => {
            const res = rdr.result; 
            elem.style.backgroundImage = `URL("${res}")`; 
        }); 
        const img = await handle.getFile();
        rdr.readAsDataURL(img); 
    }; 

    // MAKE DOM MEMORIES

    const AddMemory = async palaceMemory => {
        if(!palaceMemory) {
            console.log('ADDING MEMORY DOM ABORTED'); 
            return; 
        }
        
        // GET TEMPLATE
        // SET THINGS THAT WEREN'T IN THE TEMPLATE
        
        const template = document.querySelector('template[type="memory"]'); 
        const memory = template.content.cloneNode(true); 
        memory.querySelector('.assertion').innerText = palaceMemory.assertion ? `${palaceMemory.assertion}` : `${palaceMemory.id} : ${palaceMemory.fileName}`; 
        const memoryRef = memory.querySelector('.memory')
        memoryRef.setAttribute('draggable', true); 
        memoryRef.setAttribute('id', `${palaceMemory.id}`); 
        document.querySelector('.memories').prepend(memory); 
        
        // DATA TRANSFER

        memoryRef.addEventListener('dragstart', dragstart => {
            memoryRef.setAttribute('being-dragged', 'true'); 
            dragstart.dataTransfer.setData('text', `${palaceMemory.id}`); 
        }); 

        memoryRef.addEventListener('dragend', dragend => {
            memoryRef.setAttribute('being-dragged', 'false'); 
        }); 
        
        // ASSERTION
        
        const ass = memoryRef.querySelector('.assertion'); 
        ass.addEventListener('focus', assertionGainFocus); 
        ass.addEventListener('focusout', assertionSubmit); 
        ass.addEventListener('keydown', assertionKeydown); 
        
        if(palaceMemory.type === 'file') {
            const imgFile = palaceMemory.handle; 
            const memoryImg = await imgFile.getFile();
            const rdr = new FileReader(); 
            
            rdr.addEventListener('load', load => {
                const res = rdr.result; 
                memoryRef.querySelector('.memory-img').style.backgroundImage = `URL("${res}")`; 
            }); 
            rdr.readAsDataURL(memoryImg); 
        } else if(palaceMemory.type === 'url') {
            memoryRef.querySelector('.memory-img').style.backgroundImage = `URL("${palaceMemory.fileName})`
        }
    }
    
    for(let i = 0; i < palace.Memories.length; ++i) {
        AddMemory(palace.Memories[i]); 
    }

    // MAKE DOM FLOOR PLAN
    
    const roomsDom = document.createDocumentFragment('div'); 
    for(let y = 0; y < roomsPerSide; ++y) {
        for(let x = 0; x < roomsPerSide; ++x) {
            const room = document.createElement('div'); 
            room.classList.add('room'); 
            room.setAttribute('column', x); 
            room.setAttribute('row', y);
            room.setAttribute('active', palace.Rooms[y][x].active);  
            room.setAttribute('has-memory', 'false'); 
            roomsDom.appendChild(room); 

            const mem_id = palace.Rooms[y][x].memory; 
            if(mem_id !== -1) {
                const mem = palace.Memories.find(mem => mem.id === mem_id); 
                if(mem) {
                    if(mem.type === 'file') {
                        addBgImg(mem.handle, room); 
                    } else if(mem.type === 'url') {
                        room.style.backgroundImage = `URL("${mem.fileName}")`
                    }
                    room.setAttribute('has-memory', 'true'); 
                }
            }
        }
    }
    document.querySelector('.floor-plan').append(roomsDom); 
    
    /* 
    * 
    * 
    * ROOM MANIPULATION STUFF
    * 
    * 
    */
    
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
    document.querySelector('.floor-plan').addEventListener('mouseover', mouseover => {
        if(mouseover.fromElement?.classList.contains('room')) {
            roomActivation(mouseover); 
        }
    }); 

    document.querySelector('.floor-plan').addEventListener('mouseup', () => palace.Save()); 

    // PUT MEMORY INTO ROOMS

    const removeDrags = () => {
        document.querySelectorAll(['[dragover = "true"]']).forEach(d => d.setAttribute('dragover', 'false')); 
    }; 
    
    document.querySelector('.floor-plan').addEventListener('dragover', dragover => {
        dragover.preventDefault(); 
        removeDrags(); 
        dragover.target.setAttribute('dragover', true); 
    }); 

    document.querySelector('.floor-plan').addEventListener('drop', drop => {
        l(drop); 
        
        const room = drop.target; 
        const id = +drop.dataTransfer.getData('text'); 
        if(
            !room.classList.contains('room')
            || typeof id !== 'number'
        ) {
            return; 
        }

        palace.Rooms[+room.getAttribute('row')][+room.getAttribute('column')].memory = id; 
        palace.Save(); 
        addBgImg(palace.Memories.find(mem => mem.id === id).handle, room); 
        room.setAttribute('has-memory', 'true'); 
        
    }, false); 
    
    document.addEventListener('dragend', removeDrags); 

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

        document.querySelectorAll('.room[has-memory = "true"]').forEach(room => {
            room.style.backgroundImage = ''; 
            room.setAttribute('has-memory', 'false'); 
        }); 
    })
    
    /* 
    * 
    * 
    * ADD MEMORY STUFF
    * 
    * 
    */

    // MEMORY INTERFACE VISIBILITY
    
    const addMemoryInterface = document.querySelector('.add-memory-interface'); 
    document.querySelector('.add-memory').addEventListener('click', () => addMemoryInterface.style.display = 'block'); 

    const res_add_mem_inf = () => {
        addMemoryInterface.querySelector('.assertion-interface').innerText = 'TYPE HERE'
        addMemoryInterface.querySelector('.association-interface').innerText = 'TYPE HERE'
        addMemoryInterface.style.display = 'none'; 
    }; 
    document.querySelector('.close-add-memory-interface').addEventListener('click', res_add_mem_inf); 

    // SUBMIT A NEW MEMORY FROM THE POP-UP INTERFACE
    
    document.querySelector('.add-memory-submit').addEventListener('click', async () => {

        // CHECK
        
        const ent_assoc = document.querySelector('.association-interface').innerText; 
        const assertion = addMemoryInterface.querySelector('.assertion-interface').innerText; 
        if(!ent_assoc || ent_assoc === '' || ent_assoc === 'TYPE HERE') {
            console.error('SUBMITTED — ABANDONED BECAUSE THE ASSOCIATION WAS EMPTY'); 
            return; 
        }
        console.log('POSTING…', ent_assoc); 

        // SEND API REQUEST FOR AI IMAGE
        
        const response = await fetch("/api/gen", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ desc: ent_assoc }),
        });
        const data = await response.json();
        
        // RESET THE ADD MEMORY INTERFACE

        res_add_mem_inf(); 
        
        // GO AHEAD AND ADD A MEMORY
        
        if(data) {
            console.log('SUCCEED (POSTING)', data); 
            
            // DEV / PROD TOGGLE
            // GET THE IMAGE AS-IS; NO NEED FOR ADDING PREAMBLE
            
            // const fetchedImg = await fetch(data.result); 
            const fetchedImg = await fetch(`data:image/png;base64,${data}`); 
            
            const blobImg = await fetchedImg.blob(); 
            const fileImg = new File([blobImg], 'img.png', { type: blobImg.type }); 

            let id = -1; 
            if(fileImg) {
                id = await palace.addMemory(fileImg); 
            }
            
            // IF WE'VE ADDED A MEMORY TO THE PALACE IN MEMORY
            
            if(id !== -1) {

                // ADD AN ASSERTION IF IT'S THERE

                if(assertion && assertion !== '' && assertion !== 'TYPE HERE') {
                    palace.set_mem_assertion(id, assertion); 
                }

                // ADD TO THE DOM
                // ADD TO THE STORAGE
                
                AddMemory(palace.Memories.find(mem => mem.id === id)); 
                palace.Save(); 
            }
    
        }
    }); 

    // MANUALLY UPLOAD FILE

    const manualInput = document.querySelector('.add-manual-file-interface'); 
    manualInput.addEventListener('change', async change => {
        const assertion = addMemoryInterface.querySelector('.assertion-interface').innerText; 
        
        const file = manualInput.files[0]; 
        let id = -1; 
        if(file) {
            id = await palace.addMemory(file); 
        }
        
        if(id !== -1) {

            // ADD AN ASSERTION IF IT EXISTS

            if(assertion && assertion !== '' && assertion !== 'TYPE HERE') {
                palace.set_mem_assertion(id, assertion); 
            }
            
            AddMemory(palace.Memories.find(mem => mem.id === id)); 
            palace.Save(); 
        }
    }); 

}); 

const l = console.log; 