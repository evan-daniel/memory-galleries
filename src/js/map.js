// SETTINGS

const use_api_in_dev = true; 

// IMPORT

import '../css/global.css'; 
import '../css/map.css'; 

import Palace from './Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {
    
    // GET PALACES FROM LOCAL STORAGE
    
    const palaces = JSON.parse(localStorage.getItem('palaces')); 
    if(!palaces || !palaces.active) { 
        window.location = '/'; 
    }
    
    // INSTANTIATE PALACE
    
    let palace = new Palace(palaces.active); 
    await palace.init(); 
    document.documentElement.style.setProperty('--rooms-per-side', `${palace.rooms_per_side}`); 
    
    // LOAD LOCALSTORAGE DATA IF IT EXISTS
    // SAVE NO MATTER WHAT

    const palace_data_buf = JSON.parse(localStorage.getItem(palaces.active)); 
    if(palace_data_buf) {
        console.log('PALACE DATA', palace_data_buf); 
        await palace.wrangle(palace_data_buf); 
    }
    console.log('PALACE AFTER INIT', palace); 
    palace.persist(); 

    /* 
    * 
    * 
    * MEMORIES
    * 
    * 
    */

    // ASSERTIONS

    const dom_memory_focus = dom_memory_candidate => {
        dom_memory_candidate.target.innerText = ''; 
    }; 

    const dom_memory_keydown = keydown => {
        if(keydown.key === 'Return' || keydown.key === 'Enter') {
            document.activeElement.blur(); 
        }
    }; 

    const dom_memory_submit = sub => {
        const locus = palace.loci.find(locus => locus.id === +sub.target.parentElement.getAttribute('id')); 
        locus.memory = sub.target.innerText; 
        console.log(locus); 
        palace.persist(); 
    }; 

    // CONVENIENCE
    // ADD BACKGROUND IMAGES

    const push_bg_img = async (handle, elem) => {
        const rdr = new FileReader(); 
        rdr.addEventListener('load', () => {
            const res = rdr.result; 
            elem.style.backgroundImage = `URL("${res}")`; 
        }); 
        const mnemonic_file = await handle.getFile();
        rdr.readAsDataURL(mnemonic_file); 
    }; 

    // MAKE DOM MEMORIES

    const push_dom_locus = async locus => {
        if(!locus) {
            console.log('ADDING LOCUS DOM ABORTED'); 
            return; 
        }
        
        // GET TEMPLATE
        // SET THINGS THAT WEREN'T IN THE TEMPLATE
        
        const template = document.querySelector('template[type="locus"]'); 
        const frag_locus = template.content.cloneNode(true); 
        frag_locus.querySelector('.memory').innerText = locus.memory ? `${locus.memory}` : `${locus.id} : ${locus.fileName}`; 
        const ref_dom_locus = frag_locus.querySelector('.locus')
        document.querySelector('.loci').prepend(frag_locus); 
        
        ref_dom_locus.setAttribute('draggable', true); 
        ref_dom_locus.setAttribute('id', `${locus.id}`); 
        
        // DATA TRANSFER

        ref_dom_locus.addEventListener('dragstart', dragstart => {
            ref_dom_locus.setAttribute('being-dragged', 'true'); 
            dragstart.dataTransfer.setData('text', `${locus.id}`); 
        }); 

        ref_dom_locus.addEventListener('dragend', () => {
            ref_dom_locus.setAttribute('being-dragged', 'false'); 
        }); 
        
        // ASSERTION
        
        const memory = ref_dom_locus.querySelector('.memory'); 
        memory.addEventListener('focus', dom_memory_focus); 
        memory.addEventListener('keydown', dom_memory_keydown); 
        memory.addEventListener('focusout', dom_memory_submit); 

        // BIND TO ERASE

        ref_dom_locus.querySelector('.locus .erase').addEventListener('click', () => erase_locus(ref_dom_locus)); 
        
        // ADD THE FILE
        
        const buf_file_mnemonic = await locus.handle.getFile();
        const rdr = new FileReader(); 
        
        rdr.addEventListener('load', () => {
            const res = rdr.result; 
            ref_dom_locus.querySelector('.locus .mnemonic').style.backgroundImage = `URL("${res}")`; 

            const download_ref = ref_dom_locus.querySelector('.locus .download'); 
            download_ref.setAttribute('href', rdr.result); 
            download_ref.setAttribute('download', `${locus.memory || locus.id}.png`); 
        }); 
        rdr.readAsDataURL(buf_file_mnemonic); 
    }
    
    for(let i = 0; i < palace.loci.length; ++i) {
        push_dom_locus(palace.loci[i]); 
    }

    // MAKE DOM FLOOR PLAN
    
    const dom_rooms = document.createDocumentFragment('div'); 
    for(let y = 0; y < palace.rooms_per_side; ++y) {
        for(let x = 0; x < palace.rooms_per_side; ++x) {
            const dom_room = document.createElement('div'); 
            dom_room.classList.add('room'); 
            dom_room.setAttribute('column', x); 
            dom_room.setAttribute('row', y);
            dom_room.setAttribute('active', palace.rooms[y][x].active);  
            dom_room.setAttribute('locus', '-1'); 
            dom_rooms.appendChild(dom_room); 

            const mem_id = palace.rooms[y][x].locus; 
            if(mem_id !== -1) {
                const mem = palace.loci.find(mem => mem.id === mem_id); 
                if(mem) {
                    push_bg_img(mem.handle, dom_room); 
                    dom_room.setAttribute('locus', `${mem_id}`); 
                }
            }
        }
    }
    document.querySelector('.map').append(dom_rooms); 

    // ERASE LOCUS

    const erase_locus = target => {
        if(!(target instanceof Element)) {
            return; 
        }
        
        const id = +target?.getAttribute('id'); 
        palace.erase_locus(id); 
        palace.persist(); 
        target.remove(); 

        // SEARCH FOR ALL ROOMS WITH THE LOCUS AND DECOUPLE

        document.querySelectorAll(`.room[locus = "${id}"]`).forEach(room => remove_room_locus(room)); 
    }; 
    
    /* 
    * 
    * 
    * ROOM MANIPULATION STUFF
    * 
    * 
    */
    
    // ACTIVATE/DEACTIVATE ROOM
    
    const handle_room_activation = clickRoom => {
        const room = clickRoom.target; 
        
        if(room.classList.contains('room') && clickRoom.buttons === 1) {

            // IF USER CLICKS ON A ROOM WITH A LOCUS, DECOUPLE
            
            if(room.getAttribute('locus') !== '-1' || room.style.backgroundImage) {
                remove_room_locus(room); 
                palace.rooms[+room.getAttribute('row')][+room.getAttribute('column')].locus = -1; 
                palace.persist(); 
                return; 
            }
            
            // TOGGLE THE ACTIVITY OF THE ROOM
            
            const act = room.getAttribute('active') !== 'true'; 
            room.setAttribute('active', act); 
            palace.rooms[+room.getAttribute('row')][+room.getAttribute('column')].active = act; 
        }
    }
    document.querySelector('.map').addEventListener('mousedown', handle_room_activation); 
    document.querySelector('.map').addEventListener('mouseover', mouseover => {
        if(mouseover.fromElement?.classList.contains('room')) {
            handle_room_activation(mouseover); 
        }
    }); 

    document.querySelector('.map').addEventListener('mouseup', () => palace.persist()); 

    // PUT LOCUS INTO ROOMS

    const removeDrags = () => {
        document.querySelectorAll(['[dragover = "true"]']).forEach(d => d.setAttribute('dragover', 'false')); 
    }; 
    
    document.querySelector('.map').addEventListener('dragover', dragover => {
        dragover.preventDefault(); 
        removeDrags(); 
        dragover.target.setAttribute('dragover', true); 
    }); 

    document.querySelector('.map').addEventListener('drop', drop => {
        console.log(drop); 
        
        const room = drop.target; 
        const id = +drop.dataTransfer.getData('text'); 
        if(
            !room.classList.contains('room')
            || typeof id !== 'number'
        ) {
            return; 
        }

        palace.rooms[+room.getAttribute('row')][+room.getAttribute('column')].locus = id; 
        palace.persist(); 
        push_bg_img(palace.loci.find(locus => locus.id === id).handle, room); 
        room.setAttribute('locus', `${id}`); 

    }, false); 

    // REMOVE MEMORIES FROM ROOMS
    
    const remove_room_locus = target => {
        palace.remove_locus_from_all_rooms(+target.getAttribute('locus')); 
        
        target.setAttribute('locus', '-1'); 
        target.style.backgroundImage = ''; 
    }
    const remove_room_loci = () => document.querySelectorAll('.room:not([locus = "-1"])').forEach(dom_room => remove_room_locus(dom_room)); 
    
    document.addEventListener('dragend', removeDrags); 

    // CLEAR THE MAP

    document.querySelector('.clear').addEventListener('click', click => {
        palace = new Palace(); 
        palace.init(); 
        palace.persist(); 

        document.querySelectorAll('[active="true"]').forEach(room => {
            room.setAttribute('active', 'false'); 
        }); 

        document.querySelectorAll('.locus').forEach(dom_locus => {
            dom_locus.remove(); 
        }); 

        remove_room_loci(); 
    })
    
    /* 
    * 
    * 
    * ADD LOCUS STUFF
    * 
    * 
    */

    // PUSH LOCUS INTERFACE VISIBILITY
    
    const dom_push_locus = document.querySelector('.push-locus'); 
    document.querySelector('.mode-push-locus').addEventListener('click', () => dom_push_locus.style.display = 'block'); 

    const reset_dom_push_locus = () => {
        dom_push_locus.querySelector('.memory-candidate').innerText = 'TYPE HERE'
        dom_push_locus.querySelector('.association-candidate').innerText = 'TYPE HERE'
        dom_push_locus.style.display = 'none'; 
    }; 
    document.querySelector('.push-locus .close').addEventListener('click', reset_dom_push_locus); 

    // SUBMIT A NEW LOCUS FROM THE POP-UP INTERFACE
    
    document.querySelector('.push-locus .push').addEventListener('click', async () => {

        // CHECK

        const association_candidate = document.querySelector('.association-candidate').innerText; 
        const memory_candidate = dom_push_locus.querySelector('.memory-candidate').innerText; 
        if(!association_candidate || association_candidate === '' || association_candidate === 'TYPE HERE') {
            console.error('SUBMITTED — ABANDONED BECAUSE THE ASSOCIATION WAS EMPTY'); 
            return; 
        }
        console.log('POSTING…', association_candidate); 

        // SEND API REQUEST FOR AI IMAGE
        
        const response = await fetch("/api/gen", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ desc: association_candidate }),
        });
        const data = await response.json();
        
        // RESET THE ADD MEMORY INTERFACE

        reset_dom_push_locus(); 
        
        // GO AHEAD AND ADD A MEMORY
        
        if(data) {
            console.log('SUCCEED (POSTING)', data); 
            
            // PREAMBLE IF USING API
            
            const preamble = use_api_in_dev || process.env.NODE_ENV !== 'development' ? 'data:image/png;base64,' : ''; 
            const mnemonic_fetched = await fetch(`${preamble}${data}`); 
            
            const mnemonic_blob = await mnemonic_fetched.blob(); 
            const mnemonic_file = new File([mnemonic_blob], 'img.png', { type: mnemonic_blob.type }); 

            let id = -1; 
            if(mnemonic_file) {
                id = await palace.push_locus(mnemonic_file); 
            }
            
            // IF WE'VE ADDED A LOCUS TO THE PALACE
            
            if(id !== -1) {

                // ADD AN ASSERTION IF IT'S THERE

                if(memory_candidate && memory_candidate !== '' && memory_candidate !== 'TYPE HERE') {
                    palace.set_locus_memory(id, memory_candidate); 
                }

                // ADD TO THE DOM
                // ADD TO THE STORAGE
                
                push_dom_locus(palace.loci.find(locus => locus.id === id)); 
                palace.persist(); 
            }
    
        }
    }); 

    // MANUALLY UPLOAD FILE

    const dom_mnemonic_candidate = document.querySelector('.mnemonic-candidate'); 
    dom_mnemonic_candidate.addEventListener('change', async () => {
        const memory = document.querySelector('.memory-candidate').innerText; 
        
        const file = dom_mnemonic_candidate.files[0]; 
        let id = -1; 
        if(file) {
            id = await palace.push_locus(file); 
        }
        
        if(id !== -1) {

            // ADD AN ASSERTION IF IT EXISTS

            if(memory && memory !== '' && memory !== 'TYPE HERE') {
                palace.set_locus_memory(id, memory); 
            }
            
            push_dom_locus(palace.loci.find(locus => locus.id === id)); 
            palace.persist(); 
            reset_dom_push_locus(); 
        }
    }); 

}); 