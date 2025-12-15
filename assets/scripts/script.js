// Check if THREE and GSAP are available globally
if (typeof THREE === 'undefined' || typeof gsap === 'undefined') {
  console.error('Required libraries (THREE, GSAP) are missing');
}

// --- LOADER HELPER ---
let loaderHidden = false;
function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.transition = 'opacity 0.5s';
        loader.style.opacity = '0';
        setTimeout(() => { 
            if (loader.parentNode) loader.parentNode.removeChild(loader); 
        }, 500);
    }
}

// --- 1. GLOBAL SETUP ---
const IS_PHONE = window.matchMedia('(max-width: 768px)').matches;

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// --- 2. SIMPLE SCROLL (No Lenis - it was causing issues) ---
function raf() {
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
    }
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- 3. SCENE ---
const container = document.getElementById('canvas-container');
if (!container) {
    console.error('No canvas container');
    hideLoader();
    throw new Error('No container');
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.002);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 10;

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: !IS_PHONE, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_PHONE ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
} catch (e) {
    console.error('WebGL failed:', e);
    hideLoader();
    throw e;
}

// --- 4. SCENE OBJECTS ---
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const earthRes = IS_PHONE ? 32 : 64;
const earthGeo = new THREE.SphereGeometry(3, earthRes, earthRes);

// Earth texture manager
const texLoader = new THREE.TextureLoader(manager);

// --- 5. BUILD SCENE ---
function buildScene() {
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x1155cc,
        emissive: 0x001122,
        specular: 0x333333,
        shininess: 10
    });
    
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earth);

    // Load textures after scene is visible (non-blocking)
    texLoader.load('assets/images/earth_atmos_2048.jpg', function(texture) {
        earth.material.map = texture;
        earth.material.needsUpdate = true;
    });

    // Atmosphere glow
    const atmosMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                gl_FragColor = vec4(0.1, 0.5, 1.0, 1.0) * intensity;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmos = new THREE.Mesh(new THREE.SphereGeometry(3.2, earthRes, earthRes), atmosMat);
    earthGroup.add(atmos);

    // Sun
    const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(4, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffee })
    );
    sunMesh.position.set(20, 10, 0);
    scene.add(sunMesh);

    // Stars
    const starCount = IS_PHONE ? 500 : 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
        starPos.push(
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.5 }));
    scene.add(stars);

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(10, 5, 10);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122));

    // Now try to load textures in background (non-blocking)
    loadTexturesAsync();
}

// Load textures after scene is visible (non-blocking)
function loadTexturesAsync() {
    texLoader.load('assets/images/earth_atmos_2048.jpg', function(tex) {
        earth.material.map = tex;
        earth.material.needsUpdate = true;
    });

    texLoader.load('assets/images/earth_specular_2048.jpg', function(tex) {
        earth.material.specularMap = tex;
        earth.material.needsUpdate = true;
    });
}

// Scroll animation for timeline and sections
function buildTimeline() {
    if (scrollTL) scrollTL.kill();

    scrollTL = gsap.timeline({
        scrollTrigger: {
            trigger: '#content-wrapper',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.8 }, delay: 0, ease: 'power1.inOut' }
        }
    });

    scrollTL.addLabel('hero');
    scrollTL.addLabel('about')
        .to(earthGroup.position, { x: 0, y: 0, z: -8, duration: 2, ease: 'power2.inOut' })
        .to(earthGroup.rotation, { y: 2, duration: 2, ease: 'power2.inOut' }, '<');
}

// --- 6. SCENE RENDER ---
function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

// --- 7. INITIALIZE ---
buildScene();
buildTimeline();
animate();

// --- 8. SCROLL FUNCTION --- 
function scrollToContact() {
    const contactSection = document.getElementById('sec-contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
}
