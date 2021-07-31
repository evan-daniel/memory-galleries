import * as THREE from '../lib/three.module.js'; 
import { GLTFLoader } from '../lib/GLTFLoader.js'; 

window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

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
        scene.add(gltf.scene); 
        scene.traverse(node => {
            if(node instanceof THREE.Mesh) {
                node.castShadow = true; 
                node.receiveShadow = true; 
                
            }
        }); 
        player = scene.getObjectByName('player_ephemeral'); 
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

    // LOAD MANSPLAINER
    let mansplainer; 
    loader.load('../assets/model/mansplainer.glb', gltf => {
        scene.add(gltf.scene); 
        mansplainer = scene.getObjectByName('mansplainer'); 
        console.log('MANSPLAINER', scene.children[2]); 
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
        vy -= GRAVITY; 
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