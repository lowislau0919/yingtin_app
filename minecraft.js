import * as THREE from 'three';
import { submitScore } from './firebase.js';

let scene, camera, renderer, cube, particles = [];
let blockCount = 0;
let isAnimating = false;
let container = document.getElementById('minecraftCanvasContainer');
let blockCountDisplay = document.getElementById('blockCount');

const blockTypes = [
    { name: 'Grass', color: 0x55aa55 },
    { name: 'Dirt', color: 0x8b5e3c },
    { name: 'Stone', color: 0x808080 },
    { name: 'Coal', color: 0x333333 },
    { name: 'Iron', color: 0xbfbfbf },
    { name: 'Gold', color: 0xffd700 },
    { name: 'Diamond', color: 0x00ffff }
];

export function initMinecraftGame() {
    if (renderer) {
        container.appendChild(renderer.domElement);
        animate();
        return;
    }

    // --- Scene Setup ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // --- The Block ---
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({ color: blockTypes[0].color });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onTouch = (event) => {
        if (isAnimating) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        const x = event.touches ? event.touches[0].clientX : event.clientX;
        const y = event.touches ? event.touches[0].clientY : event.clientY;
        
        mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(cube);

        if (intersects.length > 0) {
            breakBlock();
        }
    };

    container.addEventListener('mousedown', onTouch);
    container.addEventListener('touchstart', onTouch);

    animate();
}

function breakBlock() {
    isAnimating = true;
    blockCount++;
    blockCountDisplay.innerText = blockCount;

    // --- Shake and Particles ---
    const originalPos = cube.position.clone();
    let shakeTime = 0;
    
    // Create particles
    for (let i = 0; i < 15; i++) {
        const pGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const pMat = new THREE.MeshLambertMaterial({ color: cube.material.color });
        const p = new THREE.Mesh(pGeom, pMat);
        p.position.copy(cube.position);
        p.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        scene.add(p);
        particles.push(p);
    }

    // Temporary scale down
    cube.scale.set(0.8, 0.8, 0.8);
    
    setTimeout(() => {
        cube.scale.set(1, 1, 1);
        // Change block type randomly
        const nextType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        cube.material.color.setHex(nextType.color);
        isAnimating = false;
        
        // Submit score every 10 blocks or so to be safe
        if (blockCount % 5 === 0) {
            const playerName = localStorage.getItem('snakePlayerName') || 'Explorer';
            submitScore('oneblock', blockCount, playerName);
        }
    }, 150);
}

function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);

    if (cube) {
        cube.rotation.y += 0.01;
        cube.rotation.x += 0.005;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.velocity);
        p.scale.multiplyScalar(0.95);
        if (p.scale.x < 0.01) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

export function stopMinecraftGame() {
    // Keep the renderer but stop the loop if needed? 
    // Actually, just letting it run is fine for now, or we can set a flag.
}

window.initMinecraftGame = initMinecraftGame;
window.stopMinecraftGame = stopMinecraftGame;
