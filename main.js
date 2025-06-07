
// imports and variables
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, controls;
let hoveredObject = null;
let angle = 0;
const rotationSpeed = 0.002;
const radius = 8;
let isAutoRotating = true;
let userInteracted = false;
let lastInteractionTime = 0;
const interactionPauseDuration = 3000;// in milli seconds

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; //Enables shadow map
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true; // Enables shadow casting
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  // Ground to receive shadows
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Chair Product
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), woodMaterial);
  seat.position.set(0, 1, 0);
  seat.name = "Seat";
  seat.castShadow = true;
  seat.receiveShadow = true;
  scene.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), woodMaterial);
  backrest.position.set(0, 2, -0.9);
  backrest.name = "Backrest";
  backrest.castShadow = true;
  backrest.receiveShadow = true;
  scene.add(backrest);

  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
  const legPositions = [
    [-0.9, 0.5, -0.9],
    [0.9, 0.5, -0.9],
    [-0.9, 0.5, 0.9],
    [0.9, 0.5, 0.9]
  ];

  legPositions.forEach((pos, index) => {
    const leg = new THREE.Mesh(legGeometry, woodMaterial);
    leg.position.set(...pos);
    leg.name = `Leg ${index + 1}`;
    leg.castShadow = true;
    leg.receiveShadow = true;
    scene.add(leg);
  });

  // Raycasting and interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    const label = document.getElementById('label');

    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      clicked.material.color.set(Math.random() * 0xffffff);
      console.log(`Clicked on: ${clicked.name}`);

      label.innerText = clicked.name;
      label.style.left = `${event.clientX + 10}px`;
      label.style.top = `${event.clientY - 10}px`;
      label.style.display = 'block';

      setTimeout(() => {
        label.style.display = 'none';
      }, 2000);
    } else {
      label.style.display = 'none';
    }
  }

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (hoveredObject) {
      hoveredObject.material.emissive?.set(0x000000);
      hoveredObject = null;
    }

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.material?.emissive) {
        hoveredObject = obj;
        hoveredObject.material.emissive.set(0x444444);
      }
    }
  }

  window.addEventListener('click', onClick, false);
  window.addEventListener('mousemove', onMouseMove, false);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  controls.addEventListener('start', () => {
    userInteracted = true;
    lastInteractionTime = performance.now();
  });

  controls.addEventListener('end', () => {
    lastInteractionTime = performance.now();
  });
}

function animate() {
  requestAnimationFrame(animate);
  
  if (userInteracted && performance.now() - lastInteractionTime > interactionPauseDuration) {
    userInteracted = false;
    isAutoRotating = true;
  }

  if (isAutoRotating && !userInteracted) {
    angle += rotationSpeed;
    camera.position.x = radius * Math.cos(angle);
    camera.position.z = radius * Math.sin(angle);
    camera.lookAt(0, 1, 0);
  }

  controls.update();
  renderer.render(scene, camera);
}
