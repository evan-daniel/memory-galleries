// LIB

import * as Three from 'three'; 
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'; 

// OO

import Palace from './Palace.js'; 

// CSS

import '../css/global.css'; 
import '../css/game.css'; 

// IMAGES 

import floor_diff from '../tex/concrete_wall_001_diff_1k.jpg'; 
import ceil_diff from '../tex/white_plaster_02_diff_1k.jpg'; 

window.addEventListener('DOMContentLoaded', async () => {

    // INSTANTIATE PALACE FROM LOCALSTORAGE
    // SAVE 
    
    const palaces = JSON.parse(localStorage.getItem('palaces')); 
    if(!palaces || !palaces.active) { 
        window.location = '/'; 
    }
    
    let palace = new Palace(palaces.active); 
    await palace.init(); 
    document.documentElement.style.setProperty('--rooms-per-side', `${palace.rooms_per_side}`); 
    
    const palace_data_buf = JSON.parse(localStorage.getItem(palaces.active)); 
    if(palace_data_buf) {
        console.log('PALACE DATA', palace_data_buf); 
        await palace.wrangle(palace_data_buf); 
    }
    console.log('PALACE AFTER INIT', palace); 
    palace.persist(); 
    
    // GAME GLOBAL VARIABLES
    
    const wall_width = 10; 
    const wall_height = 5; 
    const loci_length = 2.5; 

    let dom_obj; 

    let targeted_locus = {
        mesh: null, 
        locus: null, 
    }; 

    let loci_pos = new Three.Vector3(); 
    
    const dom_candidate_answer = document.querySelector('.candidate-answer'); 

    let voices; 
    window.speechSynthesis.onvoiceschanged = () => voices = window.speechSynthesis.getVoices(); 

    // MINI-MAP
    
    const mini_map = document.querySelector('.mini-map-floor-plan').getContext('2d'); 
    const mini_map_length = mini_map.canvas.height = mini_map.canvas.width = (mini_map.canvas.clientWidth - mini_map.canvas.clientWidth % palace.rooms_per_side) * window.devicePixelRatio; 
    const mini_map_cell = mini_map_length / palace.rooms_per_side;
    
    const mini_map_player = document.querySelector('.mini-map-player').getContext('2d'); 
    mini_map_player.canvas.width = mini_map_player.canvas.height = mini_map_length; 

    const world_to_mini_map_scale = coord => (coord / (palace.rooms_per_side * wall_width)) * mini_map_length; 
    
    // INIT
    
    const renderer = new Three.WebGLRenderer({ 
        canvas: document.querySelector('canvas.game'), 
        antialias: true, 
    }); 
    console.log('RENDERER', renderer); 
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = Three.PCFSoftShadowMap; 

    const renderer2 = new CSS3DRenderer();
    renderer2.setSize(window.innerWidth, window.innerHeight);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = 0;
    document.body.appendChild(renderer2.domElement);

    const scene = new Three.Scene(); 
    scene.background = new Three.Color(0xCCCCCC); 
    scene.fog = new Three.FogExp2(0X4488CC, 0.02); 

    const scene2 = new Three.Scene(); 

    const camera = new Three.PerspectiveCamera(75, renderer.domElement.clientWidth / renderer.domElement.clientHeight, 0.1, 1000); 
    camera.position.set(0, 2, wall_width / 2); 
    camera.rotation.order = 'YXZ'; 
    camera.rotation.y += 3 * Math.PI / 2; 
    scene.add(camera); 

    const texture_loader = new Three.TextureLoader(); 

    // LIGHT

    const dir_light = new Three.DirectionalLight(0xFFFFFF, 1); 
    dir_light.position.set(-4, 2, 4); 
    dir_light.castShadow = true; 
    scene.add(dir_light); 

    // ROOMS

    // TEMPLATES
    
    // FLOOR
    
    const floor_template = new Three.Mesh(new Three.PlaneGeometry(wall_width, wall_width)); 
    const floor_tex = texture_loader.load(floor_diff); 
    floor_tex.wrapS = Three.RepeatWrapping; 
    floor_tex.wrapT = Three.RepeatWrapping; 
    floor_tex.repeat.set(10, 10); 
    const floor_mat = new Three.MeshBasicMaterial({ map: floor_tex }); 
    floor_template.material = floor_mat; 
    floor_template.receiveShadow = true; 
    
    // WALL
    
    const wall_template = new Three.Mesh(new Three.PlaneGeometry(wall_width, wall_height)); 
    const wall_mat = new Three.MeshBasicMaterial({ color: 0xCCCCCD }); 
    wall_mat.side = Three.DoubleSide; 
    wall_template.material = wall_mat; 
    wall_template.name = 'wall'; 

    // CEILING
    
    const ceil_template = new Three.Mesh(new Three.PlaneGeometry(wall_width, wall_width)); 
    const ceil_tex = texture_loader.load(ceil_diff); 
    ceil_tex.wrapS = Three.RepeatWrapping; 
    ceil_tex.wrapT = Three.RepeatWrapping; 
    ceil_tex.repeat.set(1, 1); 
    const ceil_mat = new Three.MeshBasicMaterial({ map: ceil_tex }); 
    ceil_mat.side = Three.BackSide; 
    ceil_template.material = ceil_mat; 

    // CREATE
    
    for(let y = 0; y < palace.rooms.length; ++y) {
        for(let x = 0; x < palace.rooms[0].length; ++x) {

            // FLOOR 

            const floor = floor_template.clone(); 
            floor.position.set(x * wall_width, 0, y * wall_width + 0.5 * wall_width); 
            floor.rotation.y = Math.PI; 
            floor.rotation.x = Math.PI / 2; 
            scene.add(floor); 

            // CEIL

            const ceil = ceil_template.clone(); 
            ceil.position.set(x * wall_width, wall_height, y * wall_width + 0.5 * wall_width); 
            ceil.rotation.y = Math.PI; 
            ceil.rotation.x = Math.PI / 2; 
            scene.add(ceil); 
            
            // WEST WALL
            
            if(x === 0 || !palace.rooms[y][x - 1].active || !palace.rooms[y][x].active) {
                const east_wall = wall_template.clone(); 
                east_wall.rotation.y = Math.PI / 2; 
                east_wall.position.set(x * wall_width - wall_width / 2, wall_height / 2, y * wall_width + wall_width / 2); 
                scene.add(east_wall); 
            }

            // NORTH WALL
            
            if(y === 0 || !palace.rooms[y - 1][x].active || !palace.rooms[y][x].active ) {
                const north_wall = wall_template.clone(); 
                north_wall.position.set(x * wall_width, wall_height / 2, y * wall_width); 
                scene.add(north_wall); 
            }

            // LOCI
            
            const locus_id = palace.rooms[y][x].locus; 
            if(locus_id !== -1) {

                // MATERIAL BLUE IS THERE AS A BACKUP
                // WILL BE REPLACED BY THE TEXTURE AS LONG AS IT LOADS 
                
                const mat_blue = new Three.MeshBasicMaterial({
                    opacity: 0.001,
                    color: new Three.Color(0x000000),
                    blending: Three.NoBlending,
                    side: Three.DoubleSide
                });
                const loci_mesh = new Three.Object3D(); 
                const loci_m = new Three.Mesh(new Three.PlaneGeometry(loci_length, loci_length), mat_blue); 
                loci_m.material.side = Three.DoubleSide; 

                // POSITION IN ROOM BASED ON WHERE THERE ARE WALLS
                
                const loci_height = 2.5; 
                const in_front_offset = 0.01; 
                if(y === 0 || !palace.rooms[y - 1][x]?.active) {
                    // loci_mesh.position.set(x * wall_width, loci_height, y * wall_width + wall_width/4 + in_front_offset); 
                    loci_mesh.position.set(x * wall_width + 0.5 * wall_width - in_front_offset, loci_height, y * wall_width + 0.5 * wall_width); 
                    loci_mesh.rotation.y = -Math.PI / 2; 
                    // loci_mesh.rotation.y = -Math.PI / 2; 
                } else if(x === palace.rooms_per_side - 1 || !palace.rooms[y][x + 1]?.active) {
                } else if(y === palace.rooms_per_side - 1 || !palace.rooms[y + 1][x]?.active) {
                    loci_mesh.position.set(x * wall_width, loci_height, (y + 1) * wall_width - in_front_offset); 
                    loci_mesh.rotation.y = Math.PI; 
                } else if(x === 0 || !palace.rooms[y][x - 1]?.active) {
                    loci_mesh.position.set(x * wall_width - 0.5 * wall_width + in_front_offset, loci_height, y * wall_width + 0.5 * wall_width); 
                    loci_mesh.rotation.y = Math.PI / 2; 
                } else {
                    loci_mesh.position.set(x * wall_width, in_front_offset, y * wall_width + 0.5 * wall_width); 
                    loci_mesh.rotation.y = Math.PI; 
                    loci_mesh.rotation.x = Math.PI / 2; 
                }
                
                loci_mesh.name = 'locus'; 
                
                loci_mesh.custom = {
                    id: locus_id, 
                }; 

                // TEXT DOM

                dom_obj = document.createElement('div'); 
                dom_obj.innerText = 'ARBITRARY'; 
                dom_obj.classList.add('dom_obj'); 
                dom_obj.contentEditable = 'true'; 

                const dom_obj_css3d = new CSS3DObject(dom_obj); 
                dom_obj_css3d.type = 'WP'; 

                loci_mesh.CSS3DObject = dom_obj_css3d; 
                loci_mesh.add(dom_obj_css3d); 
                loci_mesh.scale.multiplyScalar(0.03); 

                scene2.add(loci_mesh); 

                if(x === 7 && y === 1) {
                    loci_pos.x = loci_mesh.position.x; 
                    loci_pos.y = loci_mesh.position.y; 
                    loci_pos.z = loci_mesh.position.z; 
                }

                // push_handle_to_mesh(palace.loci[palace.locus_idx(locus_id)].handle, loci_mesh); 
            }

            // MINI-MAP

            if(palace.rooms[y][x].active) {
                mini_map.fillStyle = palace.rooms[y][x].locus === -1 ? '#777' : '#38C038'; 
                mini_map.fillRect(x * mini_map_cell, y * mini_map_cell, mini_map_cell, mini_map_cell); 
            }
        }


    }

    // LOAD IMG FROM HANDLE
    // HANDLE COMES FROM OPFS

    const canvas_2d = document.createElement('canvas'); 
    canvas_2d.height = canvas_2d.width = 1024; 
    const canvas_renderer = canvas_2d.getContext('2d'); 
    
    const canvas_texture = new Three.CanvasTexture(canvas_2d); 
    
    async function push_handle_to_mesh(handle, mesh) {
        if(!handle || !mesh) {
            return; 
        }

        const mnemonic_file = await handle.getFile();
        const file_reader = new FileReader(); 
        file_reader.addEventListener('load', () => {
            const res = file_reader.result; 

            // SET UP NEW MATERIAL
            
            // const mnemonic_texture = texture_loader.load(res); 
            // mnemonic_texture.wrapS = Three.RepeatWrapping; 
            // mnemonic_texture.wrapT = Three.RepeatWrapping; 
            // mnemonic_texture.repeat.set( 1, 1 ); 

            // const mnemonic_material = new Three.MeshBasicMaterial( { map: canvas_texture } ); 
            // mnemonic_material.side = Three.DoubleSide; 
            
            // mesh.material = mnemonic_material; 

            mesh.material = new Three.MeshBasicMaterial({
                opacity: 0.001,
                color: new Three.Color(0x000000),
                blending: Three.NoBlending,
                side: Three.DoubleSide
            }); 
            

        }); 
        file_reader.readAsDataURL(mnemonic_file); 

    }; 

    // USER WRITES MEMORY CONTENT
    
    document.addEventListener('keydown', async keydown => {
        console.log(keydown); 
        
        if(keydown.ctrlKey) {
            
            if(keydown.code === 'KeyU') {
                keydown.preventDefault(); 
                dom_candidate_answer.innerText = targeted_locus.locus.memory; 
            }
    
            if(keydown.code === 'KeyS') {
                keydown.preventDefault(); 
                palace.set_locus_memory(targeted_locus.locus.id, dom_candidate_answer.innerText); 
                palace.persist(); 
            }
            
            if(keydown.code === 'Enter' || keydown.code === 'Return') {
                keydown.preventDefault(); 
                    
                const pulse_speech = () => {
                    console.log('PULSING SPEECH'); 
                    window.speechSynthesis.pause(); 
                    window.speechSynthesis.resume(); 
                }
                
                window.speechSynthesis.cancel(); 
                const speech_pulse = window.setInterval(pulse_speech, 10000); 
                const msg = new SpeechSynthesisUtterance(); 
                msg.voice = voices[146]; 
                msg.text = dom_candidate_answer.innerText; 
                msg.onend = () => window.clearInterval(speech_pulse); 
                msg.onerror = () => window.clearInterval(speech_pulse); 
                window.speechSynthesis.speak(msg); 
            }
        }
        
        // if(keydown.key === 'Enter' || keydown.key === 'Return') {
            // document.activeElement.blur(); 
            
            // // CORRECT ANSWER
            
            // if(dom_candidate_answer.innerText === targeted_locus.locus.memory) {
            //     const mat_blue = new Three.MeshBasicMaterial( { color: 0x8888ff }); 
            //     mat_blue.side = Three.DoubleSide; 
            //     targeted_locus.mesh.material = mat_blue; 
            //     dom_candidate_answer.innerText = ''; 
                
            //     mini_map.fillStyle = '#00F'; 
            //     console.log('TAR LOC', targeted_locus); 
            //     mini_map.fillRect(world_to_mini_map_scale(targeted_locus.mesh.position.x + wall_width / 2 - ((targeted_locus.mesh.position.x + wall_width / 2) % wall_width)), world_to_mini_map_scale(targeted_locus.mesh.position.z - (targeted_locus.mesh.position.z % wall_width)), mini_map_cell, mini_map_cell); 
            //     console.log('OFFSET CHECK', targeted_locus.mesh.position.x, targeted_locus.mesh.position.x % wall_width, targeted_locus.mesh.position.x - (targeted_locus.mesh.position.x % wall_width)); 
            // }
        // }
    }); 

    // KEYBOARD

    const input_toggle = {
        w: false, 
        a: false, 
        s: false, 
        d: false, 
    }; 
    document.addEventListener('keydown', keydown => {
        if(document.activeElement.classList.contains('candidate-answer')) {
            return; 
        }
        
        if(input_toggle.hasOwnProperty(keydown.key)) {
            input_toggle[keydown.key] = true; 
        }
    }); 
    document.addEventListener('keyup', keyup => {
        if(input_toggle.hasOwnProperty(keyup.key)) {
            input_toggle[keyup.key] = false; 
        }
    }); 

    // CLICK 

    renderer2.domElement.addEventListener('click', () => {

        // LOCK POINTER, RETURN
        
        if(document.pointerLockElement !== renderer2.domElement) {
            renderer2.domElement.requestPointerLock(); 
            return; 
        }

        // RAYCAST FOR LOCUS

        let v = new Three.Vector3(1, 0, 0); 

        v.applyAxisAngle(new Three.Vector3(0, 1, 0), camera.rotation.y); 
        v = new Three.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z); 

        const rayO = new Three.Vector3(); 
        camera.getWorldPosition(rayO); 

        const raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3, 0, 25);
        raycaster.setFromCamera(new Three.Vector2(0, 0), camera); 
        const collisions = raycaster.intersectObjects(scene.children, true); 
        for(let obstacle of collisions) {
            if(obstacle.object.name === 'locus') {
                const locus_id = obstacle.object.custom.id; 
                const locus = palace.loci.find(locus => locus.id === locus_id); 

                targeted_locus.locus = locus; 
                targeted_locus.mesh = obstacle.object; 
                dom_candidate_answer.focus(); 
                break; 
            }
        }; 
    }); 

    renderer2.domElement.addEventListener('mousemove', mousemove => {
        if(document.pointerLockElement === renderer2.domElement && !document.activeElement.classList.contains('candidate-answer')) {
            const rot_speed = 1 / 256; 
            camera.rotation.y -= mousemove.movementX / window.devicePixelRatio * rot_speed; 
            camera.rotation.x -= mousemove.movementY / window.devicePixelRatio * rot_speed; 
        }
    }); 

    // APPLY MOVEMENT

    const push_movement = () => {

        const translational_speed = 1 / 4; 
        const movement = new Three.Vector3(input_toggle.d - input_toggle.a, 0, input_toggle.s - input_toggle.w); 
        movement.normalize(); 
        movement.multiplyScalar(translational_speed); 
        movement.applyAxisAngle(new Three.Vector3(0, 1, 0), camera.rotation.y); 
        camera.position.add(movement); 
    
        // COLLISION DETECTION

        const v = new Three.Vector3(1, 0, 0); 
        v.applyAxisAngle(new Three.Vector3(0, 1, 0), camera.rotation.y); 
        for(let i = 0; i < 8; i++) {
            v.applyAxisAngle(new Three.Vector3(0, 1, 0), Math.PI / 4); 
            const origin = new Three.Vector3(); 
            camera.getWorldPosition(origin); 
            const raycaster = new Three.Raycaster(origin, v, 0, 0.5); 
            const collisions = raycaster.intersectObjects(scene.children, true); 
            collisions.forEach(obstacle => {
                camera.position.sub(movement); 
                i = 8; 
                return true; 
            }); 
        } 
    }; 

    // ANIMATE

    let x_2d = 0; 

    const animate = () => {

        if(document.pointerLockElement === renderer2.domElement) {
            push_movement(); 
        }

        // RAYCAST FOR LOCUS

        let v = new Three.Vector3(1, 0, 0); 

        v.applyAxisAngle(new Three.Vector3(0, 1, 0), camera.rotation.y); 
        v = new Three.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z); 

        const rayO = new Three.Vector3(); 
        camera.getWorldPosition(rayO); 

        const raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3, 0, 25);
        raycaster.setFromCamera(new Three.Vector2(0, 0), camera); 
        const collisions = raycaster.intersectObjects(scene.children, true); 

        const dom_ans = document.querySelector('.answer'); 
        dom_ans.style.display = 'none'; 
        for(let obstacle of collisions) {
            if(obstacle.object.name === 'locus') {
                const projection = new Three.Vector3(obstacle.object.position.x, obstacle.object.position.y, obstacle.object.position.z); 
                projection.project(camera); 
                dom_ans.style.display = 'block'; 
                dom_ans.style.top = `${(-projection.y + 1) * renderer.domElement.height / 2 / window.devicePixelRatio}px`; 
                dom_ans.style.left = `${(projection.x + 1) * renderer.domElement.width / 2 / window.devicePixelRatio}px`; 

                break; 
            }
        }; 

        // MINI-MAP

        mini_map_player.clearRect(0, 0, mini_map_length, mini_map_length); 
        mini_map_player.fillStyle = '#fff'; 
        // mini_map_player.fillRect(world_to_mini_map_scale(camera.position.x) + 6, world_to_mini_map_scale(camera.position.z) - 3, 6, 6); 
        const x = world_to_mini_map_scale(camera.position.x); 
        const y = world_to_mini_map_scale(camera.position.z); 
        mini_map_player.translate(x + mini_map_cell / 3, y); 
        mini_map_player.rotate(-camera.rotation.y - Math.PI / 2); 
        mini_map_player.beginPath(); 
        mini_map_player.moveTo(0, -mini_map_cell / 3); 
        mini_map_player.lineTo(0, mini_map_cell / 3); 
        mini_map_player.lineTo(mini_map_cell, 0); 
        mini_map_player.closePath(); 
        mini_map_player.fill(); 
        mini_map_player.setTransform(1, 0, 0, 1, 0, 0); 

        // ANIMATED CANVAS TEXTURE 
        
        canvas_texture.needsUpdate = true; 
        
        // RENDER

        window.requestAnimationFrame(animate); 
        renderer.render(scene, camera); 

        // 2D CANVAS

        
        canvas_renderer.clearRect(0, 0, canvas_2d.width, canvas_2d.height); 
    
        x_2d += 0.1; 
        
        canvas_renderer.fillStyle = '#00F'; 
        canvas_renderer.rect(10, 20, 512 + x_2d, 100);
        canvas_renderer.fill();
    
        canvas_renderer.rect(10, 150, 512 - x_2d, 100);
        canvas_renderer.fillStyle = '#F00'; 
        canvas_renderer.fill();

        renderer2.render(scene2, camera); 
    
    }; 
    window.requestAnimationFrame(animate); 
}); 

/*

My practice is about encoding games.  
Artists frequently set rules for themselves as they create work.  As a professor of mine at RISD said, in order to work, the first thing you have to do is limit your freedom.  Whether that holds as a general maxim, within my work the process of 

creating rules for what I do has been central.  Similarly, artists often have experience with the idea that both the rules they make and the output of following them are voices within the artistic process.  

*/