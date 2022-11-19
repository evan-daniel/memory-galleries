import '../css/global.css'; 
import '../css/game.css'; 

import * as THREE from 'three'; 

import Palace from './Palace.js'; 

window.addEventListener('DOMContentLoaded', async () => {

    // GET PALACES FROM LOCAL STORAGE
    
    const palaces = JSON.parse(localStorage.getItem('palaces')); 
    if(!palaces || !palaces.active) {
        window.location = '/'; 
    }

    // INSTANTIATE
    
    const palace = new Palace(palaces.active); 
    await palace.Build(); 
    
    const storagePalace = JSON.parse(localStorage.getItem(palaces.active)); 
    if(storagePalace) {
        await palace.load(storagePalace); 
    }
    
    const rooms = palace.Rooms; 
    const WallWidth = 10; 
    const WallHeight = 5; 

    let targetedLocus = {
        mesh: null, 
        mem: null, 
    }; 

    const elAns = document.querySelector('.ans'); 
    
    console.log('PALACE', palace); 
    
    // INIT
    
    const renderer = new THREE.WebGLRenderer({ 
        canvas: document.querySelector('canvas'), 
        antialias: true, 
    }); 
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true; 

    const scene = new THREE.Scene(); 
    scene.background = new THREE.Color(0x88CCFF); 
    scene.fog = new THREE.FogExp2(0X4488CC, 0.01); 

    const camera = new THREE.PerspectiveCamera(75, renderer.domElement.clientWidth / renderer.domElement.clientHeight, 0.1, 1000); 
    camera.position.set(0, 2, WallWidth / 2); 
    camera.rotation.order = 'YXZ'; 
    camera.rotation.y += 3 * Math.PI / 2; 
    scene.add(camera); 

    const texLoader = new THREE.TextureLoader(); 

    // LIGHT

    const hemi_light = new THREE.HemisphereLight(0xFFFFFF, 1); 
    scene.add(hemi_light); 

    // GROUND

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WallWidth * 16, WallWidth * 16), new THREE.MeshBasicMaterial( { color: 0x00ff00 } )); 
    ground.material.side = THREE.DoubleSide; 
    ground.position.set(WallWidth * 8 - WallWidth / 2, 0, WallWidth * 8 - WallWidth / 2); 
    ground.rotation.x = - Math.PI / 2; 
    scene.add(ground); 

    // ROOMS

    const WallMaterial = new THREE.MeshBasicMaterial( { color: 0xccccee } ); 
    WallMaterial.side = THREE.DoubleSide; 
    const WallTemplate = new THREE.Mesh(new THREE.PlaneGeometry(WallWidth * 0.99, WallHeight * 0.99), WallMaterial); 

    for(let y = 0; y < rooms.length; ++y) {
        for(let x = 0; x < rooms[0].length; ++x) {

            // WEST WALL
            
            if(x === 0 || !rooms[y][x - 1].active || !rooms[y][x].active) {
                const EastWall = WallTemplate.clone(); 
                EastWall.rotation.y = Math.PI / 2; 
                EastWall.position.set(x * WallWidth - WallWidth / 2, WallHeight / 2, y * WallWidth + WallWidth / 2); 
                scene.add(EastWall); 
            }

            // NORTH WALL
            
            if(y === 0 || !rooms[y - 1][x].active || !rooms[y][x].active ) {
                const Wall = WallTemplate.clone(); 
                Wall.position.set(x * WallWidth, WallHeight / 2, y * WallWidth); 
                scene.add(Wall); 

            }

            // LOCI
            
            const MemoryId = palace.Rooms[y][x].memory; 
            if(MemoryId !== -1) {
                const TestMat = new THREE.MeshBasicMaterial( { color: 0xff8888 }); 
                const loci_mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), TestMat); 
                loci_mesh.material.side = THREE.DoubleSide; 
                loci_mesh.position.set(x * WallWidth, 2.5, y * WallWidth + WallWidth / 2); 
                loci_mesh.rotation.y += Math.PI / 4; 
                loci_mesh.name = 'locus'; 
                loci_mesh.custom = {
                    id: MemoryId, 
                }; 
                scene.add(loci_mesh); 

                LoadImgToMesh(palace.Memories[palace.mem_idx(MemoryId)].handle, loci_mesh); 
            }
        }
    }

    // LOAD IMG TO WALL

    async function LoadImgToMesh (fileHandle, mesh) {
        if(!fileHandle || !mesh) {
            return; 
        }

        const memoryImg = await fileHandle.getFile();
        const rdr = new FileReader(); 
        rdr.addEventListener('load', load => {
            const res = rdr.result; 

            // SET UP NEW MATERIAL
            
            const SampleImage_Texture = texLoader.load(res); 
            SampleImage_Texture.wrapS = THREE.RepeatWrapping; 
            SampleImage_Texture.wrapT = THREE.RepeatWrapping; 
            SampleImage_Texture.repeat.set( 1, 1 ); 

            const SampleImage_Material = new THREE.MeshLambertMaterial( { map: SampleImage_Texture } ); 
            SampleImage_Material.side = THREE.DoubleSide; 
            
            mesh.material = SampleImage_Material; 
        }); 
        rdr.readAsDataURL(memoryImg); 

    }; 

    // USER WRITES MEMORY CONTENT
    
    elAns.addEventListener('keydown', async keydown => {
        if(keydown.key === 'Enter') {
            document.activeElement.blur(); 
            
            if(elAns.innerText === targetedLocus.mem.assertion) {
                // LoadImgToMesh(targetedLocus.mem.handle, targetedLocus.mesh); 
                const TestMat = new THREE.MeshBasicMaterial( { color: 0x8888ff }); 
                TestMat.side = THREE.DoubleSide; 
                targetedLocus.mesh.material = TestMat; 
            }
        }
    }); 

    // KEYBOARD

    const input = {
        w: false, 
        a: false, 
        s: false, 
        d: false, 
    }; 
    document.addEventListener('keydown', keydown => {
        if(document.activeElement.classList.contains('ans')) {
            return; 
        }
        
        if(input.hasOwnProperty(keydown.key)) {
            input[keydown.key] = true; 
        }
    }); 
    document.addEventListener('keyup', keyup => {
        if(input.hasOwnProperty(keyup.key)) {
            input[keyup.key] = false; 
        }
    }); 

    // CLICK 

    renderer.domElement.addEventListener('click', focus => {

        // LOCK POINTER, RETURN
        
        if(document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock(); 
            return; 
        }

        // RAYCAST FOR LOCUS

        let v = new THREE.Vector3(1, 0, 0); 
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y); 
        v = new THREE.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z); 

        const rayO = new THREE.Vector3(); 
        camera.getWorldPosition(rayO); 

        const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3, 0, 25);
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);   
        const collisions = raycaster.intersectObjects(scene.children, true); 
        for(let obstacle of collisions) {
            if(obstacle.object.name === 'locus') {
                const locusId = obstacle.object.custom.id; 
                const mem = palace.Memories.find(mem => mem.id === locusId); 

                // LOAD IMAGE TO MESH IMMEDIATELY
                
                // LoadImgToMesh(mem.handle, obstacle.object); 

                targetedLocus.mem = mem; 
                targetedLocus.mesh = obstacle.object; 
                elAns.focus(); 
            }
        }; 
    }); 

    renderer.domElement.addEventListener('mousemove', mousemove => {
        if(document.pointerLockElement === renderer.domElement) {
            const ROT_SPEED = 1 / 256; 
            camera.rotation.y -= mousemove.movementX * ROT_SPEED; 
            camera.rotation.x -= mousemove.movementY * ROT_SPEED; 
        }
    }); 

    // APPLY MOVEMENT

    const ApplyMovement = () => {

        const SPEED = 1 / 4; 
        const movement = new THREE.Vector3(input.d - input.a, 0, input.s - input.w); 
        movement.normalize(); 
        movement.multiplyScalar(SPEED); 
        movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y); 
        camera.position.add(movement); 
    
        // COLLISION DETECTION

        const v = new THREE.Vector3(1, 0, 0); 
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y); 
        for(let i = 0; i < 8; i++) {
            v.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4); 
            const origin = new THREE.Vector3(); 
            camera.getWorldPosition(origin); 
            const raycaster = new THREE.Raycaster(origin, v, 0, 0.5); 
            const collisions = raycaster.intersectObjects(scene.children, true); 
            collisions.forEach(obstacle => {
                if(obstacle.object.name.indexOf('ephemeral') === -1) {
                    camera.position.sub(movement); 
                    i = 8; 
                    return true; 
                }
            }); 
        } 
    }; 

    // ANIMATE

    const animate = timestamp => {

        if(document.pointerLockElement === renderer.domElement) {
            ApplyMovement(); 
        }

        // RENDER

        window.requestAnimationFrame(animate); 
        renderer.render(scene, camera); 
    }; 
    window.requestAnimationFrame(animate); 
}); 
