// --- 1. LoadingManager Setup ---
const manager = new THREE.LoadingManager();

// Handle loading progress and completion
manager.onProgress = (url, loaded, total) => {
    console.log(`Loading: ${url} - Progress: ${Math.round((loaded / total) * 100)}%`);
};

// On load completion, hide loader
manager.onLoad = () => {
  console.log('%cAll assets reported finished ✔', 'color:#0f0');
  fadeLoader();
};

// Add a timeout to force hide the loader after 4 seconds, even if textures haven't loaded
setTimeout(fadeLoader, 4000);

// --- 2. TextureLoader with manager ---
const texLoader = new THREE.TextureLoader(manager);   // Now it's valid

// --- 3. Scene Setup ---
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
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
} catch (e) {
    console.error('WebGL failed:', e);
    hideLoader();
    throw e;
}

// --- 4. Texture Loading using CDN ---
const earthGeo = new THREE.SphereGeometry(3, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({
    color: 0x1155cc,
    emissive: 0x001122,
    specular: 0x333333,
    shininess: 10
});

// Load textures
texLoader.load('https://planet-textures.s3.amazonaws.com/earth_daymap_2k.jpg', (tex) => {
    earthMat.map = tex;
    earthMat.needsUpdate = true;
});
texLoader.load('https://planet-textures.s3.amazonaws.com/earth_normal_1k.jpg', (tex) => {
    earthMat.normalMap = tex;
    earthMat.needsUpdate = true;
});
texLoader.load('https://planet-textures.s3.amazonaws.com/earth_specular_1k.jpg', (tex) => {
    earthMat.specularMap = tex;
    earthMat.needsUpdate = true;
});

// --- 5. Earth Setup ---
const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

// --- 6. Lighting Setup ---
const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(5, 5, 5);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x333333));

// --- 7. Animation ---
function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

animate();

// --- 8. ScrollTrigger Animations ---
gsap.to(camera.position, {
    z: 7,
    scrollTrigger: {
        trigger: '.section-wrap',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

gsap.to(earth.rotation, {
    y: Math.PI * 2,
    scrollTrigger: {
        trigger: '.section-wrap',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

// --- Helper Functions ---
function fadeLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.transition = 'opacity 0.5s';
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.transition = 'opacity 0.5s';
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
    }
}

// --- Scroll To Contact Function ---
function scrollToContact() {
    const contactSection = document.getElementById('sec-contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
}
