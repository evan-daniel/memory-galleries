import * as THREE from '../lib/three.module.js'; 
import { GLTFLoader } from '../lib/GLTFLoader.js'; 

window.addEventListener('DOMContentLoaded', () => {

    // VARIABLES
    
    const rooms = JSON.parse(localStorage.getItem('rooms')); 
    const WallWidth = 10; 
    const WallHeight = 10; 
    
    // INIT
    const renderer = new THREE.WebGLRenderer({ 
        canvas: document.querySelector('canvas'), 
        antialias: true, 
    }); 
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true; 
    const camera = new THREE.PerspectiveCamera(75, renderer.domElement.clientWidth / renderer.domElement.clientHeight, 0.1, 1000); 
    const scene = new THREE.Scene(); 
    scene.background = new THREE.Color(0x88CCFF); 
    scene.fog = new THREE.FogExp2(0X4488CC, 0.01); 

    // LIGHT
    // const dir_light = new THREE.DirectionalLight(0xFFFFFF, 1); 
    // dir_light.castShadow = true; 
    // dir_light.position.set(3, 14, 5); 
    // scene.add(dir_light); 
    const hemi_light = new THREE.HemisphereLight(0xFFFFFF, 1); 
    scene.add(hemi_light); 

    // LOAD SCENE
    const loader = new GLTFLoader(); 
    let player; 
    loader.load('../assets/model/tutorial-scene.glb', gltf => {
        player = gltf.scene.getObjectByName('player_ephemeral'); 
        player.position.z = player.position.x = 2; 
        scene.add(player); 
        scene.traverse(node => {
            if(node instanceof THREE.Mesh) {
                node.castShadow = true; 
                node.receiveShadow = true; 
                
            }
        }); 
        player.traverse(node => {
            if(node instanceof THREE.Mesh) {
                node.castShadow = false; 
                node.receiveShadow = false; 
            }
        }); 
        player.add(camera); 
        camera.position.set(0, 1, -0.5); 
        window.requestAnimationFrame(animate); 
    }, null, null); 

    // GROUND

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WallWidth * 16, WallWidth * 16), new THREE.MeshBasicMaterial( { color: 0x00ff00 } )); 
    ground.material.side = THREE.DoubleSide; 
    ground.position.set(WallWidth * 8, 0, WallWidth * 8); 
    ground.rotation.x = - Math.PI / 2; 
    scene.add(ground); 

    // ROOMS

    const WallMaterial = new THREE.MeshBasicMaterial( { color: 0xaa88aa } ); 
    WallMaterial.side = THREE.DoubleSide; 
    const BlueWallMaterial = new THREE.MeshBasicMaterial( { color: 0xCCCCFF }); 
    BlueWallMaterial.side = THREE.DoubleSide; 
    const WallTemplate = new THREE.Mesh(new THREE.PlaneGeometry(WallWidth * 0.99, WallHeight * 0.99), WallMaterial); 
    console.log(rooms); 
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
                if(y === 0 && x === 1) {
                    Wall.material = BlueWallMaterial; 
                }
                Wall.position.set(x * WallWidth, WallHeight / 2, y * WallWidth); 
                scene.add(Wall); 

            }
        }
    }

    // LOAD SAMPLE IMAGE AS PLANE
    const MakeImage = (x, z) => {
        const TestMat = new THREE.MeshBasicMaterial( { color: 0x0000ff }); 
        const SampleImage_Plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), TestMat); 
        SampleImage_Plane.material.side = THREE.DoubleSide; 
        SampleImage_Plane.position.set(x, 2.5, z); 
        scene.add(SampleImage_Plane); 
        return SampleImage_Plane; 
    }; 
    const Locis = [
        { 
            url: '../assets/loci/0000_parker_prall_stace_greene.png', 
            x: 20, 
            z: 5, 
            answer: 'parker prall stace greene', 
        }, { 
            url: '../assets/loci/0001_santayana_ducasse_cassirer_langer.png', 
            x: 15, 
            z: -5, 
            answer: 'santayana ducasse cassirer langer', 
        }, { 
            url: '../assets/loci/0002.png', 
            x: 15, 
            z: -25, 
            answer: 'dilman gotshalk arnold isenberg', 
        }, { 
            url: '../assets/loci/0003.png', 
            x: 25, 
            z: -25, 
            answer: 'monroe beardsley nelson goodman', 
        }
    ]; 
    Locis.forEach(loci => {
        loci.object = MakeImage(loci.x, loci.z); 
        loci.answered = false; 
    }); 

    document.addEventListener('keydown', DocumentKeydown => {
        if(DocumentKeydown.key === 'Enter') {
            console.log('ENTER'); 
            let ClosestIndex = -1; 
            Locis.forEach((loci, index) => {
                const GetDistance = (x, z) => (x - player.position.x) ** 2 + (z - player.position.z) ** 2; 
                if(ClosestIndex === -1) {
                    ClosestIndex = index; 
                } else {
                    if(GetDistance(loci.x, loci.z) < GetDistance(Locis[ClosestIndex].x, Locis[ClosestIndex].z)) {
                        ClosestIndex = index; 
                    }
                    
                }
            }); 
            
            const submission = document.querySelector('.splain').innerText; 
            if(submission === Locis[ClosestIndex].answer) {
                if(!Locis[ClosestIndex].answered) {
                    Locis[ClosestIndex].answered = true; 
    
                    const SampleImage_Texture = THREE.ImageUtils.loadTexture(Locis[ClosestIndex].url); 
                    SampleImage_Texture.wrapS = THREE.RepeatWrapping; 
                    SampleImage_Texture.wrapT = THREE.RepeatWrapping; 
                    SampleImage_Texture.repeat.set( 1, 1 ); 
                    const SampleImage_Material = new THREE.MeshLambertMaterial( { map: SampleImage_Texture } ); 
                    SampleImage_Material.side = THREE.DoubleSide; 
                    Locis[ClosestIndex].object.material = SampleImage_Material; 
                }

                console.log('CO RECT'); 
            }
            
        }
    }); 


    // KEYBOARD
    const input = {
        w: false, 
        a: false, 
        s: false, 
        d: false, 
        f: false, 
        ' ': false, 
    }; 
    document.addEventListener('keydown', keydown => {
        if(document.activeElement.classList.contains('splain')) {
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

    // POINTER
    renderer.domElement.addEventListener('click', focus => {
        renderer.domElement.requestPointerLock(); 
    }); 
    renderer.domElement.addEventListener('mousemove', mousemove => {
        if(document.pointerLockElement === renderer.domElement) {
            const ROT_SPEED = 1 / 256; 
            player.rotation.y -= mousemove.movementX * ROT_SPEED; 
            camera.rotation.x -= mousemove.movementY * ROT_SPEED; 
        }
    }); 


    // ANIMATE
    let vy = 0; 
    let framecount = 0; 
    const animate = timestamp => {

        // MOVEMENT
        const SPEED = 1 / 4; 
        const movement = new THREE.Vector3(input.d - input.a, 0, input.s - input.w); 
        movement.normalize(); 
        movement.multiplyScalar(SPEED); 
        movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y); 
        player.position.add(movement); 

        // COLLISION DETECTION
        const v = new THREE.Vector3(1, 0, 0); 
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y); 
        for(let i = 0; i < 8; i++) {
            v.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4); 
            const origin = new THREE.Vector3(); 
            camera.getWorldPosition(origin); 
            const raycaster = new THREE.Raycaster(origin, v, 0, 0.5); 
            const collisions = raycaster.intersectObjects(scene.children, true); 
            collisions.forEach(obstacle => {
                if(obstacle.object.name.indexOf('ephemeral') === -1) {
                    player.position.sub(movement); 
                    i = 8; 
                    return true; 
                }
            }); 
        } 

        // JUMPING
        const platform_detector = new THREE.Raycaster(player.position, new THREE.Vector3(0, -1, 0)); 
        const platform_below = platform_detector.intersectObjects(scene.children, true); 
        const GRAVITY = 0.01, JUMP_STRENGTH = 0.3, HOVER = 0.01; 
        // vy -= GRAVITY; 
        platform_below.forEach(platform => {
            if(platform.object.name.indexOf('platform') !== -1 && platform.distance <= -vy + 2 * HOVER) {
                vy = 0; 
                player.position.y = platform.point.y + HOVER; 
                if(input[' ']) {
                    input[' '] = false; 
                    vy = JUMP_STRENGTH; 
                } 
                return; 
            }
        }); 
        player.position.y += vy; 

        // RENDER
        window.requestAnimationFrame(animate); 
        renderer.render(scene, camera); 
        ++framecount; 
    }; 
            
}); 