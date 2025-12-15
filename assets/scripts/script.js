/******************************************************************
 *   M0NARQ  –  single-bundle mobile hero
 ******************************************************************/
(() => {

  /* ----------------------------------------------------------- */
  /* 1. THREE SCENE                                              */
  /* ----------------------------------------------------------- */
  const PHONE   = matchMedia('(max-width:768px)').matches;
  const scene   = new THREE.Scene();
  scene.fog     = new THREE.FogExp2(0x050505, .002);

  const camera  = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, .1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({antialias:!PHONE,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, PHONE?1.2:1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping      = THREE.NoToneMapping;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  renderer.getContext().canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault(); location.reload();
  });

  /* ----------------------------------------------------------- */
  /* 2. EARTH, ATMOS, STARS, SUN                                 */
  /* ----------------------------------------------------------- */
  const earthGroup = new THREE.Group(); scene.add(earthGroup);
  const res   = PHONE?32:64;
  const geo   = new THREE.SphereGeometry(3, res, res);
  const mat   = new THREE.MeshPhongMaterial({
    color:0x2255cc, shininess:5, specular:0x333333,
    normalScale:new THREE.Vector2(.5,.5)
  });
  const earth = new THREE.Mesh(geo, mat); earthGroup.add(earth);

  const TL = new THREE.TextureLoader();
  TL.load('https://planet-textures.s3.amazonaws.com/earth_daymap_2k.jpg', t=>{mat.map=t; mat.needsUpdate=true});
  TL.load('https://planet-textures.s3.amazonaws.com/earth_specular_1k.jpg',t=>{mat.specularMap=t;mat.needsUpdate=true});
  TL.load('https://planet-textures.s3.amazonaws.com/earth_normal_1k.jpg',  t=>{mat.normalMap=t;  mat.needsUpdate=true});
  TL.load('https://planet-textures.s3.amazonaws.com/earth_clouds_1k.png',  t=>{
      const clouds = new THREE.Mesh(geo.clone(),
          new THREE.MeshPhongMaterial({map:t,transparent:true,opacity:.3,depthWrite:false}));
      clouds.scale.set(1.015,1.015,1.015);
      earth.add(clouds);
  });

  const atmos = new THREE.Mesh(geo.clone(), new THREE.ShaderMaterial({
    vertexShader: `varying vec3 n;void main(){n=normalize(normalMatrix*normal);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `,
    fragmentShader:`varying vec3 n;void main(){float i=pow(.6-dot(n,vec3(0,0,1)),3.);
      gl_FragColor=vec4(.2,.6,1,1)*i;}`,
    side:THREE.BackSide, transparent:true, blending:THREE.AdditiveBlending}));
  atmos.scale.set(1.07,1.07,1.07); earthGroup.add(atmos);

  const stars = (()=>{
    const count = PHONE?700:1800, pos=[];
    for(let i=0;i<count;i++) pos.push((Math.random()-.5)*600,(Math.random()-.5)*600,(Math.random()-.5)*600);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    return new THREE.Points(g, new THREE.PointsMaterial({color:0xffffff,size:.5,fog:false}));
  })();
  scene.add(stars);

  const sunMesh  = new THREE.Mesh(new THREE.SphereGeometry(4,32,32),
                                   new THREE.MeshBasicMaterial({color:0xffffee}));
  sunMesh.position.set(20,10,0); scene.add(sunMesh);

  const sunLight = new THREE.DirectionalLight(0xffffff,2);
  sunLight.position.set(10,5,10); scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x111122));

  /* ----------------------------------------------------------- */
  /* 3. KEYFRAMES                                                */
  /* ----------------------------------------------------------- */
  const KF = PHONE ? {
    hero    : {pos:[ 0,  1.2,  0],  rotY:0,   sun:[ 10,5,5]},
    about   : {pos:[ 0,  2.4,-10],  rotY:2,   sun:[ 10,5,5]},
    services: {pos:[ 1.5,-2,  -6],  rotY:3.5, sun:[ -3,2,-5]},
    realism : {pos:[ 0,  0,   0],   rotY:5,   sun:[  0,0,-15]},
    contact : {pos:[ 0,  0, -18],   rotY:5.5, sun:[  0,0,-15]}
  } : {
    hero    : {pos:[ 3.5, 0,   0],  rotY:0,   sun:[10,5,5]},
    about   : {pos:[ 0,   0,  -8],  rotY:2,   sun:[10,5,5]},
    services: {pos:[ 4,  -2,  -2],  rotY:3.5, sun:[-6,2,-5]},
    realism : {pos:[ 0,   0,   0],  rotY:5,   sun:[ 0,0,-15]},
    contact : {pos:[ 0,   0, -20],  rotY:5.5, sun:[ 0,0,-15]}
  };

  /* ----------------------------------------------------------- */
  /* 4. GSAP  TIMELINE                                           */
  /* ----------------------------------------------------------- */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  let tl;
  buildTimeline();

  function buildTimeline() {
    tl && tl.kill();
    earthGroup.position.set(...KF.hero.pos);

    tl = gsap.timeline({
      scrollTrigger:{
        trigger:'#content-wrapper',start:'top top',end:'bottom bottom',
        scrub:1,snap:{snapTo:'labels',duration:{min:.25,max:.8},ease:'power1.inOut'}
      }
    });

    append('hero'   ,KF.hero);
    append('about'  ,KF.about);
    append('services',KF.services);
    append('realism',KF.realism);
    append('contact',KF.contact, ()=>gsap.to('#canvas-container',{opacity:.3,pointerEvents:'none',duration:2}));
  }

  function append(label,kf,extra){
    tl.addLabel(label)
      .to(earthGroup.position,{x:kf.pos[0],y:kf.pos[1],z:kf.pos[2],duration:2},'<')
      .to(earthGroup.rotation,{y:kf.rotY,duration:2},'<')
      .to(sunMesh.position     ,{x:kf.sun[0],y:kf.sun[1],z:kf.sun[2],duration:2},'<')
      .to(sunLight.position    ,{x:kf.sun[0],y:kf.sun[1],z:kf.sun[2],duration:2},'<');
    extra && extra();
  }

  /* ----------------------------------------------------------- */
  /* 5. SCROLL HELPERS                                           */
  /* ----------------------------------------------------------- */
  window.scrollToLabel = label =>
    gsap.to(window,{duration:1.2,scrollTo:{y:`[data-label="${label}"]`,autoKill:false},ease:'power2.inOut'});

  /* ----------------------------------------------------------- */
  /* 6. RENDER LOOP & EVENTS                                     */
  /* ----------------------------------------------------------- */
  renderer.setAnimationLoop(()=>{
    earth.rotation.y += .0005;
    stars.rotation.y -= .0001;
    renderer.render(scene,camera);
  });

  addEventListener('resize',()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    ScrollTrigger.refresh();
  });
  addEventListener('orientationchange',()=>setTimeout(()=>ScrollTrigger.refresh(),350));

})();
