/* avatar3d.js – Three.js WebGL avatar viewer
 * Replaces the old CSS-div avatar figure in the sidebar.
 * Uses ES-module imports resolved via the importmap in index.html.
 */
import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Model roster (3 free CC0 female / humanoid GLBs) ─────────────────────────
const MODEL_FILES = [
  '/models/avatar_0.glb',   // Michelle – animated female (Three.js sample)
  '/models/avatar_1.glb',   // Soldier  – rigged humanoid
  '/models/avatar_2.glb',   // Xbot     – rigged humanoid
];

// Palette id → hex accent colour (mirrors PALETTES in chat.js)
const PALETTE_HEX = {
  1: 0xcc0174,
  2: 0x7c3aed,
  3: 0x0369a1,
  4: 0xb45309,
  5: 0x065f46,
};

// ── AvatarViewer class ────────────────────────────────────────────────────────
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
    this._rim      = null;          // palette-tinted rim light

    this._variant  = 0;
    this._tier     = 1;
    this._palette  = 1;

    this._init();
  }

  /* ── Private ────────────────────────────────────────────────────────────── */

  _init () {
    const c = this._container;
    const w = c.clientWidth  || 200;
    const h = c.clientHeight || 340;

    /* Scene */
    this._scene = new THREE.Scene();

    /* Camera – start at a neutral position; _frameCamera() repositions after each load */
    this._camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 50);
    this._camera.position.set(0, 1.0, 4.0);

    /* Renderer – transparent background so CSS shows through */
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(w, h);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this._renderer.outputColorSpace  = THREE.SRGBColorSpace;
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.2;
    c.appendChild(this._renderer.domElement);

    /* Lights */
    this._scene.add(new THREE.AmbientLight(0xffeeff, 0.65));

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(2, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(512);
    key.shadow.camera.top = key.shadow.camera.right =  2.5;
    key.shadow.camera.bottom = key.shadow.camera.left = -2.5;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far  = 20;
    this._scene.add(key);

    /* Palette-tinted rim / accent light */
    this._rim = new THREE.PointLight(PALETTE_HEX[1], 1.8, 7);
    this._rim.position.set(-2, 1.8, -1.8);
    this._scene.add(this._rim);

    /* Ground disc */
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 48),
      new THREE.MeshStandardMaterial({ color: 0x110015, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this._scene.add(ground);

    /* Orbit controls – auto-rotate only, no user dragging */
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping    = true;
    this._controls.dampingFactor    = 0.08;
    this._controls.enableZoom       = false;
    this._controls.enablePan        = false;
    this._controls.enableRotate     = false;
    this._controls.autoRotate       = true;
    this._controls.autoRotateSpeed  = 0.8;
    this._controls.target.set(0, 0.9, 0);
    this._controls.update();

    /* Resize observer */
    new ResizeObserver(() => this._onResize()).observe(c);

    this._loop();
  }

  _loop () {
    this._raf = requestAnimationFrame(() => this._loop());
    const dt = this._clock.getDelta();
    if (this._mixer)   this._mixer.update(dt);
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

  /**
   * Reposition camera so the given world-space bounding box is fully visible
   * with 15% padding on all sides.
   */
  _frameCamera (box) {
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = (this._camera.fov * Math.PI) / 180;
    // Distance needed so maxDim fills the vertical FOV, plus 15% headroom
    const dist   = (maxDim / 2 / Math.tan(fovRad / 2)) * 1.15;

    this._camera.position.set(center.x, center.y, center.z + dist);
    this._camera.lookAt(center);
    this._controls.target.copy(center);
    this._controls.update();
  }

  /** Procedural fallback when a GLB fails to load */
  _buildFallback (tier, paletteId) {
    const group = new THREE.Group();
    const col   = PALETTE_HEX[paletteId] || 0xcc0174;

    const skinMat  = new THREE.MeshStandardMaterial({ color: 0xffcba4, roughness: 0.85 });
    const bodyMat  = new THREE.MeshStandardMaterial({ color: col,      roughness: 0.65 });

    /* Head */
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), skinMat);
    head.position.y = 1.65; head.castShadow = true;
    group.add(head);

    /* Hair bun */
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4365e, roughness: 0.7 })
    );
    hair.position.set(0, 1.88, -0.06); hair.castShadow = true;
    group.add(hair);

    /* Torso */
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 8, 16), bodyMat);
    torso.position.y = 1.1; torso.castShadow = true;
    group.add(torso);

    /* Skirt / dress */
    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.30, 0.58, 18),
      bodyMat
    );
    skirt.position.y = 0.57; skirt.castShadow = true;
    group.add(skirt);

    /* Legs */
    const legGeo = new THREE.CapsuleGeometry(0.065, 0.38, 6, 10);
    for (const xOff of [-0.1, 0.1]) {
      const leg = new THREE.Mesh(legGeo, skinMat.clone());
      leg.position.set(xOff, 0.2, 0); leg.castShadow = true;
      group.add(leg);
    }

    /* Tier accessory */
    if (tier >= 2) {
      const crownCol = tier >= 3 ? 0xffd700 : 0xff69b4;
      const crown = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.025, 6, 24),
        new THREE.MeshStandardMaterial({
          color: crownCol, metalness: 0.9, roughness: 0.1,
          emissive: crownCol, emissiveIntensity: 0.4,
        })
      );
      crown.position.y = 1.96; crown.rotation.x = 0.4;
      group.add(crown);
    }

    return group;
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /**
   * Load (or reload) the model for a given variant / tier / palette.
   * @param {number} baseVariant  0-5  → maps to MODEL_FILES index via modulo
   * @param {number} tier         1-3  → cosmetic tier level
   * @param {number} paletteId    1-5  → palette accent colour
   */
  loadModel (baseVariant, tier, paletteId) {
    this._variant = baseVariant || 0;
    this._tier    = tier    || 1;
    this._palette = paletteId || 1;

    /* Update accent light */
    if (this._rim) this._rim.color.setHex(PALETTE_HEX[this._palette] || 0xff69b4);

    /* Remove previous model */
    if (this._model) {
      this._scene.remove(this._model);
      if (this._mixer) { this._mixer.stopAllAction(); this._mixer = null; }
      this._model = null;
    }

    const idx = this._variant % MODEL_FILES.length;
    const loader = new GLTFLoader();

    loader.load(
      MODEL_FILES[idx],
      (gltf) => {
        const m = gltf.scene;

        /* Step 1 – rough scale so tallest axis ≈ 1.8 units */
        const box0  = new THREE.Box3().setFromObject(m);
        const size0 = box0.getSize(new THREE.Vector3());
        const s     = 1.8 / Math.max(size0.x, size0.y, size0.z, 0.001);
        m.scale.setScalar(s);

        /* Step 2 – add to scene, then recompute world-space bounds */
        m.traverse((n) => {
          if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }
        });
        this._model = m;
        this._scene.add(m);

        /* Step 3 – recompute bounds in world space after scaling */
        const box1 = new THREE.Box3().setFromObject(m);
        const ctr1 = box1.getCenter(new THREE.Vector3());
        /* Centre horizontally; lift so feet (min.y) sit exactly on y=0 */
        m.position.x -= ctr1.x;
        m.position.z -= ctr1.z;
        m.position.y -= box1.min.y;

        /* Step 4 – recompute final world-space box and frame camera */
        const boxFinal = new THREE.Box3().setFromObject(m);
        this._frameCamera(boxFinal);

        /* Play idle animation (prefer clip named 'Idle', else first clip) */
        if (gltf.animations && gltf.animations.length > 0) {
          this._mixer = new THREE.AnimationMixer(m);
          const clip  = THREE.AnimationClip.findByName(gltf.animations, 'Idle') ||
                        gltf.animations[0];
          this._mixer.clipAction(clip).play();
        }
      },
      undefined,
      () => {
        /* On load error → procedural fallback */
        this._model = this._buildFallback(this._tier, this._palette);
        this._scene.add(this._model);
        const box = new THREE.Box3().setFromObject(this._model);
        this._frameCamera(box);
      }
    );
  }

  /** Update the rim-light colour when the user switches palette */
  setPalette (paletteId) {
    this._palette = paletteId || 1;
    if (this._rim) this._rim.color.setHex(PALETTE_HEX[this._palette] || 0xff69b4);
  }

  /** Reserved for future 3-D decoration overlays */
  setDecorations (_decorations) { /* noop – extend as needed */ }

  dispose () {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._renderer) {
      this._container.removeChild(this._renderer.domElement);
      this._renderer.dispose();
    }
  }
}

/* Instantiate and expose globally so non-module chat.js can access it */
window._AvatarViewer = AvatarViewer;
window._avatarViewer = new AvatarViewer('avatar-3d-scene');
