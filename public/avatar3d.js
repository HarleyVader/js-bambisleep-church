/* avatar3d.js – Three.js WebGL avatar viewer (rebuilt)
 * Clean, reliable full-body framing for skinned GLB models.
 * ES-module; resolved via importmap in index.html.
 */
import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL_FILES = [
  '/models/avatar_0.glb',   // Michelle – animated female
  '/models/avatar_1.glb',   // Soldier  – rigged humanoid
  '/models/avatar_2.glb',   // Xbot     – rigged humanoid
];

const PALETTE_HEX = {
  1: 0xcc0174,
  2: 0x7c3aed,
  3: 0x0369a1,
  4: 0xb45309,
  5: 0x065f46,
};

// All models are normalised to this height (world units) after loading
const TARGET_H = 1.4;

// ── AvatarViewer ──────────────────────────────────────────────────────────────
class AvatarViewer {
  constructor (containerId) {
    this._container = document.getElementById(containerId);
    if (!this._container) return;

    this._scene    = null;
    this._camera   = null;
    this._renderer = null;
    this._controls = null;
    this._model    = null;
    this._mixer    = null;
    this._clock    = new THREE.Clock();
    this._raf      = null;
    this._rim      = null;
    this._variant  = 0;
    this._tier     = 1;
    this._palette  = 1;

    this._init();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _init () {
    const c = this._container;
    const w = c.clientWidth  || 200;
    const h = c.clientHeight || 360;

    // Scene
    this._scene = new THREE.Scene();

    // Camera: vertical FOV sized for portrait container
    this._camera = new THREE.PerspectiveCamera(50, w / h, 0.05, 100);

    // Renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(w, h);
    this._renderer.outputColorSpace    = THREE.SRGBColorSpace;
    this._renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.2;
    this._renderer.shadowMap.enabled   = true;
    this._renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    c.appendChild(this._renderer.domElement);

    // Lights
    this._scene.add(new THREE.AmbientLight(0xfff0f8, 1.0));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(1.5, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(512);
    key.shadow.camera.near   = 0.1;
    key.shadow.camera.far    = 20;
    key.shadow.camera.top    = key.shadow.camera.right  =  3;
    key.shadow.camera.bottom = key.shadow.camera.left   = -3;
    this._scene.add(key);

    this._rim = new THREE.PointLight(PALETTE_HEX[1], 2.0, 8);
    this._rim.position.set(-2, TARGET_H * 0.8, -2);
    this._scene.add(this._rim);

    // Ground disc
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x110015, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x    = -Math.PI / 2;
    ground.receiveShadow = true;
    this._scene.add(ground);

    // Controls – auto-rotate only, no user interaction
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping   = true;
    this._controls.dampingFactor   = 0.08;
    this._controls.enableZoom      = false;
    this._controls.enablePan       = false;
    this._controls.enableRotate    = false;
    this._controls.autoRotate      = true;
    this._controls.autoRotateSpeed = 0.8;

    // Place camera for TARGET_H model (visible placeholder before first model loads)
    this._placeCamera(TARGET_H);

    // Resize observer
    new ResizeObserver(() => this._onResize()).observe(c);

    this._loop();
  }

  /**
   * Head-focused portrait framing.
   *
   * The camera looks at the upper quarter of the model (where the head is).
   * A tighter FOV (30 °) and shorter visible span (30 % of modelH) zoom in
   * on just the head+shoulders while keeping the target centred horizontally.
   *
   *   focusY  = top of model minus a small offset     → head crown
   *   span    = 0.30 * modelH                         → head+shoulders height
   *   dist    = (span/2) / tan(fov/2)  * 1.1          → fills frame with 10 % pad
   */
  _placeCamera (modelH) {
    const headFov  = 30;                                         // tight portrait FOV
    this._camera.fov = headFov;
    this._camera.updateProjectionMatrix();

    const span    = modelH * 0.32;                               // head+shoulders region
    const focusY  = modelH - span * 0.38;                        // target: upper quarter
    const fovRad  = (headFov * Math.PI) / 180;
    const dist    = (span / 2) / Math.tan(fovRad / 2) * 1.1;    // 10 % breathing room

    this._camera.position.set(0, focusY, dist);
    this._camera.lookAt(0, focusY, 0);
    this._camera.updateProjectionMatrix();

    this._controls.target.set(0, focusY, 0);
    this._controls.update();
  }

  _loop () {
    this._raf = requestAnimationFrame(() => this._loop());
    const dt  = this._clock.getDelta();
    if (this._mixer) this._mixer.update(dt);
    this._controls.update();
    this._renderer.render(this._scene, this._camera);
  }

  _onResize () {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    if (!w || !h) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  // Procedural fallback – simple female silhouette (used when GLB fails)
  _buildFallback (tier, paletteId) {
    const group   = new THREE.Group();
    const col     = PALETTE_HEX[paletteId] || 0xcc0174;
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcba4, roughness: 0.85 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: col,      roughness: 0.65 });

    const add = (geo, mat, x, y, z) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      group.add(mesh);
    };

    add(new THREE.SphereGeometry(0.22, 20, 20),       skinMat,  0,     1.65, 0); // head
    add(new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4365e, roughness: 0.7 }),
      0, 1.88, -0.06);                                                            // hair
    add(new THREE.CapsuleGeometry(0.18, 0.5, 8, 16),  bodyMat,  0,     1.10, 0); // torso
    add(new THREE.ConeGeometry(0.30, 0.58, 18),       bodyMat,  0,     0.57, 0); // skirt
    add(new THREE.CapsuleGeometry(0.065, 0.38, 6, 10), skinMat, -0.10, 0.20, 0); // leg L
    add(new THREE.CapsuleGeometry(0.065, 0.38, 6, 10), skinMat,  0.10, 0.20, 0); // leg R

    if (tier >= 2) {
      const cc = tier >= 3 ? 0xffd700 : 0xff69b4;
      const crown = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.025, 6, 24),
        new THREE.MeshStandardMaterial({
          color: cc, metalness: 0.9, roughness: 0.1,
          emissive: cc, emissiveIntensity: 0.4,
        }),
      );
      crown.position.y = 1.96;
      crown.rotation.x = 0.4;
      group.add(crown);
    }
    return group;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  loadModel (baseVariant, tier, paletteId) {
    this._variant = baseVariant || 0;
    this._tier    = tier        || 1;
    this._palette = paletteId   || 1;

    if (this._rim) this._rim.color.setHex(PALETTE_HEX[this._palette] || 0xff69b4);

    // Remove previous model
    if (this._model) {
      this._scene.remove(this._model);
      if (this._mixer) { this._mixer.stopAllAction(); this._mixer = null; }
      this._model = null;
    }

    const url    = MODEL_FILES[this._variant % MODEL_FILES.length];
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;

        // STEP 1 – add to scene so world matrices are valid for Box3
        root.traverse((n) => {
          if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }
        });
        this._scene.add(root);
        root.updateWorldMatrix(true, true);

        // STEP 2 – measure native height (y-axis only; ignores T-pose arm span)
        const bbox0   = new THREE.Box3().setFromObject(root);
        const nativeH = Math.max(bbox0.max.y - bbox0.min.y, 0.0001);

        // STEP 3 – scale uniformly so height = TARGET_H
        const s = TARGET_H / nativeH;
        root.scale.setScalar(s);
        root.updateWorldMatrix(true, true);

        // STEP 4 – translate: feet at y=0, centred on X and Z
        const bbox1 = new THREE.Box3().setFromObject(root);
        root.position.set(
          root.position.x - (bbox1.min.x + bbox1.max.x) / 2,  // centre X
          root.position.y - bbox1.min.y,                        // feet at y=0
          root.position.z - (bbox1.min.z + bbox1.max.z) / 2,  // centre Z
        );

        this._model = root;

        // STEP 5 – position camera for exact TARGET_H model
        this._placeCamera(TARGET_H);

        // STEP 6 – start animation (prefer 'Idle', else first clip)
        if (gltf.animations && gltf.animations.length > 0) {
          this._mixer = new THREE.AnimationMixer(root);
          const clip  = THREE.AnimationClip.findByName(gltf.animations, 'Idle')
                     || gltf.animations[0];
          this._mixer.clipAction(clip).play();
        }
      },
      undefined,
      () => {
        // Load error – use procedural fallback
        this._model = this._buildFallback(this._tier, this._palette);
        this._scene.add(this._model);
        this._placeCamera(TARGET_H);
      },
    );
  }

  setPalette (paletteId) {
    this._palette = paletteId || 1;
    if (this._rim) this._rim.color.setHex(PALETTE_HEX[this._palette] || 0xff69b4);
  }

  setDecorations (_decorations) { /* reserved for future decoration overlays */ }

  dispose () {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._renderer) {
      this._container.removeChild(this._renderer.domElement);
      this._renderer.dispose();
    }
  }
}

// Expose globally so non-module chat.js can call loadModel / setPalette
window._AvatarViewer = AvatarViewer;
window._avatarViewer = new AvatarViewer('avatar-3d-scene');
