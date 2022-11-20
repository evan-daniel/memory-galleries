import '../css/global.css'; 
import '../css/game.css'; 

import * as Three from 'three'; 

import Palace from './Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {

    // GET PALACES FROM LOCAL STORAGE
    
    const palaces = JSON.parse(localStorage.getItem('palaces')); 
    if(!palaces || !palaces.active) {
        window.location = '/'; 
    }

    // INSTANTIATE
    
    const palace = new Palace(palaces.active); 
    await palace.init(); 
    
    const palace_data_buf = JSON.parse(localStorage.getItem(palaces.active)); 
    if(palace_data_buf) {
        await palace.wrangle(palace_data_buf); 
    }
    
    const wall_width = 10; 
    const wall_height = 5; 

    let targeted_locus = {
        mesh: null, 
        locus: null, 
    }; 

    const dom_candidate_answer = document.querySelector('.candidate-answer'); 
    
    console.log('PALACE', palace); 
    
    // INIT
    
    const renderer = new Three.WebGLRenderer({ 
        canvas: document.querySelector('canvas'), 
        antialias: true, 
    }); 
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true; 

    const scene = new Three.Scene(); 
    scene.background = new Three.Color(0x88CCFF); 
    scene.fog = new Three.FogExp2(0X4488CC, 0.01); 

    const camera = new Three.PerspectiveCamera(75, renderer.domElement.clientWidth / renderer.domElement.clientHeight, 0.1, 1000); 
    camera.position.set(0, 2, wall_width / 2); 
    camera.rotation.order = 'YXZ'; 
    camera.rotation.y += 3 * Math.PI / 2; 
    scene.add(camera); 

    const texture_loader = new Three.TextureLoader(); 

    // LIGHT

    const hemi_light = new Three.HemisphereLight(0xFFFFFF, 1); 
    scene.add(hemi_light); 

    // GROUND

    const ground = new Three.Mesh(new Three.PlaneGeometry(wall_width * 16, wall_width * 16), new Three.MeshBasicMaterial( { color: 0x00ff00 } )); 
    ground.material.side = Three.DoubleSide; 
    ground.position.set(wall_width * 8 - wall_width / 2, 0, wall_width * 8 - wall_width / 2); 
    ground.rotation.x = - Math.PI / 2; 
    scene.add(ground); 

    // ROOMS

    const mat_wall = new Three.MeshBasicMaterial( { color: 0xccccee } ); 
    mat_wall.side = Three.DoubleSide; 
    const wall_template = new Three.Mesh(new Three.PlaneGeometry(wall_width * 0.99, wall_height * 0.99), mat_wall); 

    for(let y = 0; y < palace.rooms.length; ++y) {
        for(let x = 0; x < palace.rooms[0].length; ++x) {

            // WEST WALL
            
            if(x === 0 || !palace.rooms[y][x - 1].active || !palace.rooms[y][x].active) {
                const east_wall = wall_template.clone(); 
                east_wall.rotation.y = Math.PI / 2; 
                east_wall.position.set(x * wall_width - wall_width / 2, wall_height / 2, y * wall_width + wall_width / 2); 
                scene.add(east_wall); 
            }

            // NORTH WALL
            
            if(y === 0 || !palace.rooms[y - 1][x].active || !palace.rooms[y][x].active ) {
                const mesh_wall = wall_template.clone(); 
                mesh_wall.position.set(x * wall_width, wall_height / 2, y * wall_width); 
                scene.add(mesh_wall); 

            }

            // LOCI
            
            const locus_id = palace.rooms[y][x].locus; 
            if(locus_id !== -1) {
                const mat_blue = new Three.MeshBasicMaterial( { color: 0xff8888 }); 
                const loci_mesh = new Three.Mesh(new Three.PlaneGeometry(5, 5), mat_blue); 
                loci_mesh.material.side = Three.DoubleSide; 
                loci_mesh.position.set(x * wall_width, 2.5, y * wall_width + wall_width / 2); 
                loci_mesh.rotation.y += Math.PI / 4; 
                loci_mesh.name = 'locus'; 
                loci_mesh.custom = {
                    id: locus_id, 
                }; 
                scene.add(loci_mesh); 

                push_img_to_mesh(palace.loci[palace.locus_idx(locus_id)].handle, loci_mesh); 
            }
        }
    }

    // LOAD IMG TO WALL

    async function push_img_to_mesh(handle, mesh) {
        if(!handle || !mesh) {
            return; 
        }

        const mnemonic_file = await handle.getFile();
        const file_reader = new FileReader(); 
        file_reader.addEventListener('load', () => {
            const res = file_reader.result; 

            // SET UP NEW MATERIAL
            
            const mnemonic_texture = texture_loader.load(res); 
            mnemonic_texture.wrapS = Three.RepeatWrapping; 
            mnemonic_texture.wrapT = Three.RepeatWrapping; 
            mnemonic_texture.repeat.set( 1, 1 ); 

            const mnemonic_material = new Three.MeshLambertMaterial( { map: mnemonic_texture } ); 
            mnemonic_material.side = Three.DoubleSide; 
            
            mesh.material = mnemonic_material; 
        }); 
        file_reader.readAsDataURL(mnemonic_file); 

    }; 

    // USER WRITES MEMORY CONTENT
    
    dom_candidate_answer.addEventListener('keydown', async keydown => {
        if(keydown.key === 'Enter') {
            document.activeElement.blur(); 
            
            if(dom_candidate_answer.innerText === targeted_locus.locus.memory) {
                // push_img_to_mesh(targeted_locus.mem.handle, targeted_locus.mesh); 
                const mat_blue = new Three.MeshBasicMaterial( { color: 0x8888ff }); 
                mat_blue.side = Three.DoubleSide; 
                targeted_locus.mesh.material = mat_blue; 
            }
        }
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

    renderer.domElement.addEventListener('click', () => {

        // LOCK POINTER, RETURN
        
        if(document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock(); 
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

                // LOAD IMAGE TO MESH IMMEDIATELY
                
                // push_img_to_mesh(mem.handle, obstacle.object); 

                targeted_locus.locus = locus; 
                targeted_locus.mesh = obstacle.object; 
                dom_candidate_answer.focus(); 
            }
        }; 
    }); 

    renderer.domElement.addEventListener('mousemove', mousemove => {
        if(document.pointerLockElement === renderer.domElement && !document.activeElement.classList.contains('candidate-answer')) {
            const rot_speed = 1 / 256; 
            camera.rotation.y -= mousemove.movementX * rot_speed; 
            camera.rotation.x -= mousemove.movementY * rot_speed; 
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

    const animate = () => {

        if(document.pointerLockElement === renderer.domElement) {
            push_movement(); 
        }

        // RENDER

        window.requestAnimationFrame(animate); 
        renderer.render(scene, camera); 
    }; 
    window.requestAnimationFrame(animate); 
}); 
