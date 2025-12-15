import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Global Variables
let scene, camera, renderer, earth, stars, clouds;
let manager = new THREE.LoadingManager();
let textureLoader = new THREE.TextureLoader();

// LoadingManager - tracks loading progress
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading: ' + url);
};
manager.onLoad = function () {
    console.log('Loading complete!');
    gsap.to('#loader', { opacity: 0, duration: 0.5, onComplete: () => document.getElementById('loader').remove() });
};
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading progress: ' + Math.round((itemsLoaded / itemsTotal) * 100) + '%');
};
manager.onError = function (url) {
    console.error('Error loading: ' + url);
    gsap.to('#loader', { opacity: 0, duration: 0.5, onComplete: () => document.getElementById('loader').remove() });
};

// Set up the scene
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Starfield
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Earth
  const earthGeometry = new THREE.SphereGeometry(3, 64, 64);
  const earthTexture = textureLoader.load('assets/images/earth_atmos_2048.jpg');
  const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Animations
  animate();

  // ScrollTrigger for camera position
  gsap.to(camera.position, {
    z: 7,
    scrollTrigger: {
      trigger: '.section-wrap',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  // ScrollTrigger for Earth rotation
  gsap.to(earth.rotation, {
    y: Math.PI * 2,
    scrollTrigger: {
      trigger: '.section-wrap',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.005;
  renderer.render(scene, camera);
}

// Initialize the scene
init();
