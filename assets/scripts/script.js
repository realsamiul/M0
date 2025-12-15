// ------------------------------------------------------------------
// PRE-LOADER MANAGER
// ------------------------------------------------------------------
const manager = new THREE.LoadingManager();
manager.onLoad     = hideLoader;
manager.onError    = hideLoader;
manager.onProgress = (_, l, t)=>
  document.querySelector('.loader-ring')
          .style.transform = `rotate(${l/t*360}deg)`;

// ------------------------------------------------------------------
// THREE SET-UP
// ------------------------------------------------------------------
const IS_PHONE = matchMedia('(max-width:768px)').matches;
const scene    = new THREE.Scene();
scene.fog      = new THREE.FogExp2(0x050505,0.002);

const camera   = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, .1, 100);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({antialias:!IS_PHONE,alpha:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_PHONE?1.5:2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping      = THREE.NoToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

renderer.getContext().canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault(); location.reload();
});

// ------------------------------------------------------------------
// SCENE CONTENT
// ------------------------------------------------------------------
const earthGroup = new THREE.Group(); scene.add(earthGroup);
let earth;                                   // made global

const res   = IS_PHONE?32:64;
const geo   = new THREE.SphereGeometry(3, res, res);
const mat   = new THREE.MeshPhongMaterial({color:0x1155cc});
earth       = new THREE.Mesh(geo,mat);
earthGroup.add(earth);

const tex   = new THREE.TextureLoader(manager);
const CDN   = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/';
tex.load(CDN+'earth_atmos_2048.jpg', t=>{ mat.map=t; mat.needsUpdate=true; });
tex.load(CDN+'earth_specular_1024.jpg',t=>{ mat.specularMap=t; mat.needsUpdate=true; });
tex.load(CDN+'earth_normal_1024.jpg',  t=>{ mat.normalMap =t; mat.needsUpdate=true; });

const atmos = new THREE.Mesh(geo.clone(), new THREE.ShaderMaterial({
  vertexShader:`varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
  fragmentShader:`varying vec3 n;void main(){float i=pow(.65-dot(n,vec3(0,0,1)),3.);gl_FragColor=vec4(.1,.5,1,1)*i;}`,
  side:THREE.BackSide, transparent:true, blending:THREE.AdditiveBlending}));
atmos.scale.set(1.07,1.07,1.07); earthGroup.add(atmos);

scene.add(new THREE.DirectionalLight(0xffffff,2).position.set(10,5,10));

// ------------------------------------------------------------------
// SCROLL TIMELINE
// ------------------------------------------------------------------
let scrollTL;
function buildTimeline(){
  if(scrollTL) scrollTL.kill();
  scrollTL=gsap.timeline({
    scrollTrigger:{trigger:'#content-wrapper',start:'top top',end:'bottom bottom',
                   scrub:1,snap:{snapTo:'labels',duration:{min:.2,max:.8}}},
    defaults:{ease:'power2.inOut'}
  });

  scrollTL.addLabel('hero');

  scrollTL.addLabel('about')
          .to(earthGroup.position,{z:-8},'<')
          .to(earthGroup.rotation,{y:2},'<');

  scrollTL.addLabel('services')
          .to(earthGroup.position,{x:2,y:-1,z:-6})
          .to(earthGroup.rotation,{y:4},'<');

  scrollTL.addLabel('contact')
          .to(earthGroup.position,{x:0,y:0,z:-20})
          .to('#canvas-container',{opacity:.3,pointerEvents:'none'},'<');
}
buildTimeline();

// ------------------------------------------------------------------
// RENDER LOOP
// ------------------------------------------------------------------
function animate(t){
  earth.rotation.y += .0005;
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
function hideLoader(){ document.getElementById('loader')?.remove(); }

function scrollToContact(){
  gsap.to(window,{duration:1.2,scrollTo:{y:'#sec-contact',autoKill:false},ease:'power2.inOut'});
}

// resize / orientation
addEventListener('resize',()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  ScrollTrigger.refresh();
});
addEventListener('orientationchange',()=>setTimeout(()=>ScrollTrigger.refresh(),350));
