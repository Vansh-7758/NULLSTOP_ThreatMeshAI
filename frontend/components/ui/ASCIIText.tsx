// frontend/components/ui/ASCIIText.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.;

    float waveFactor = uEnableWaves;

    vec3 transformed = position;

    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;
    
    float move = sin(time + mouse) * 0.01;
    float r = texture2D(uTexture, pos + cos(time * 2. - time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + tan(time * .5 + pos.x - time) * .01).g;
    float b = texture2D(uTexture, pos - cos(time * 2. + time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

function mapRange(n: number, start: number, stop: number, start2: number, stop2: number): number {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

class AsciiFilter {
  renderer: THREE.WebGLRenderer;
  domElement: HTMLDivElement;
  pre: HTMLPreElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  deg: number;
  invert: boolean;
  fontSize: number;
  fontFamily: string;
  charset: string;
  width: number = 0;
  height: number = 0;
  center: { x: number; y: number } = { x: 0, y: 0 };
  mouse: { x: number; y: number } = { x: 0, y: 0 };
  cols: number = 0;
  rows: number = 0;

  constructor(renderer: THREE.WebGLRenderer, { fontSize, fontFamily, charset, invert }: any = {}) {
    this.renderer = renderer;
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    this.pre = document.createElement('pre');
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert ?? true;
    this.fontSize = fontSize ?? 12;
    this.fontFamily = fontFamily ?? "'Courier New', monospace";
    this.charset = charset ?? ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', this.onMouseMove);
    }
  }

  onMouseMove(e: MouseEvent) {
    this.mouse = { x: e.clientX, y: e.clientY };
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h);

    const calcW = Math.floor(w * PX_RATIO);
    const calcH = Math.floor(h * PX_RATIO);

    this.canvas.width = calcW;
    this.canvas.height = calcH;

    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    const charWidth = Math.ceil(this.context.measureText('A').width);

    this.cols = Math.floor(calcW / charWidth);
    this.rows = Math.floor(calcH / this.fontSize);

    this.pre.style.fontFamily = this.fontFamily;
    this.pre.style.fontSize = `${this.fontSize / PX_RATIO}px`;

    this.center = {
      x: Math.floor(this.cols / 2),
      y: Math.floor(this.rows / 2)
    };
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);

    if (this.cols === 0 || this.rows === 0) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.context.clearRect(0, 0, w, h);
    this.context.drawImage(this.renderer.domElement, 0, 0, w, h);

    const imgData = this.context.getImageData(0, 0, w, h).data;

    let asciiStr = '';
    const charLen = this.charset.length;

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const x = Math.floor(j * (w / this.cols));
        const y = Math.floor(i * (h / this.rows));
        const idx = (y * w + x) * 4;

        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];

        if (a === 0) {
          asciiStr += ' ';
          continue;
        }

        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const charIdx = Math.floor((1 - brightness) * (charLen - 1));
        asciiStr += this.charset[charIdx] || ' ';
      }
      asciiStr += '\n';
    }

    this.pre.innerHTML = asciiStr;
  }

  dispose() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', this.onMouseMove);
    }
  }
}

class CanvasEffect {
  text: string;
  fontSize: number;
  textColor: string;
  planeBaseHeight: number;
  enableWaves: boolean;

  container: HTMLElement;
  width: number;
  height: number;

  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  renderer!: THREE.WebGLRenderer;
  asciiFilter!: AsciiFilter;
  material!: THREE.ShaderMaterial;
  mesh!: THREE.Mesh;
  texture!: THREE.CanvasTexture;

  canvas2d!: HTMLCanvasElement;
  ctx2d!: CanvasRenderingContext2D;

  animationFrameId: number | null = null;

  constructor(
    container: HTMLElement,
    w: number,
    h: number,
    { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves }: any
  ) {
    this.container = container;
    this.width = w;
    this.height = h;

    this.text = text;
    this.fontSize = textFontSize;
    this.textColor = textColor;
    this.planeBaseHeight = planeBaseHeight;
    this.enableWaves = enableWaves;

    this.init(asciiFontSize);
  }

  init(asciiFontSize: number) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.z = 200;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(PX_RATIO);

    this.asciiFilter = new AsciiFilter(this.renderer, {
      fontSize: asciiFontSize,
      fontFamily: "'Space Grotesk', 'Courier New', monospace",
      invert: true
    });

    this.container.appendChild(this.asciiFilter.domElement);

    this.createTexture();
    this.createMesh();

    this.setSize(this.width, this.height);
  }

  createTexture() {
    this.canvas2d = document.createElement('canvas');
    this.ctx2d = this.canvas2d.getContext('2d')!;

    const width = 1024;
    const height = 512;
    this.canvas2d.width = width;
    this.canvas2d.height = height;

    this.ctx2d.clearRect(0, 0, width, height);
    this.ctx2d.font = `900 ${this.fontSize}px 'Space Grotesk', sans-serif`;
    this.ctx2d.textAlign = 'center';
    this.ctx2d.textBaseline = 'middle';
    this.ctx2d.fillStyle = this.textColor;
    this.ctx2d.fillText(this.text, width / 2, height / 2);

    this.texture = new THREE.CanvasTexture(this.canvas2d);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  createMesh() {
    const aspect = this.canvas2d.width / this.canvas2d.height;
    const planeHeight = this.planeBaseHeight;
    const planeWidth = planeHeight * aspect;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 32, 32);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 0 },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
        uTexture: { value: this.texture }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.asciiFilter.setSize(w, h);
  }

  load() {
    const clock = new THREE.Clock();

    const renderLoop = () => {
      this.animationFrameId = requestAnimationFrame(renderLoop);
      const elapsedTime = clock.getElapsedTime();

      if (this.material) {
        this.material.uniforms.uTime.value = elapsedTime;
      }

      this.asciiFilter.render(this.scene, this.camera);
    };

    renderLoop();
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.asciiFilter.dispose();
    if (this.asciiFilter.domElement.parentNode) {
      this.asciiFilter.domElement.parentNode.removeChild(this.asciiFilter.domElement);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

export interface ASCIITextProps {
  text: string;
  asciiFontSize?: number;
  textFontSize?: number;
  textColor?: string;
  planeBaseHeight?: number;
  enableWaves?: boolean;
}

export default function ASCIIText({
  text,
  asciiFontSize = 8,
  textFontSize = 140,
  textColor = '#7c3aed',
  planeBaseHeight = 80,
  enableWaves = true
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<CanvasEffect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    const createAndInit = async (container: HTMLElement, w: number, h: number) => {
      return new CanvasEffect(container, w, h, {
        text,
        asciiFontSize,
        textFontSize,
        textColor,
        planeBaseHeight,
        enableWaves
      });
    };

    const setup = async () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      if (width === 0 || height === 0) {
        observer = new IntersectionObserver(
          async ([entry]) => {
            if (cancelled) return;
            if (entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0) {
              const { width: w, height: h } = entry.boundingClientRect;
              observer?.disconnect();
              observer = null;

              if (!cancelled && containerRef.current) {
                asciiRef.current = await createAndInit(containerRef.current, w, h);
                if (!cancelled && asciiRef.current) {
                  asciiRef.current.load();
                }
              }
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(containerRef.current);
        return;
      }

      asciiRef.current = await createAndInit(containerRef.current, width, height);
      if (!cancelled && asciiRef.current) {
        asciiRef.current.load();

        ro = new ResizeObserver(entries => {
          if (!entries[0] || !asciiRef.current) return;
          const { width: w, height: h } = entries[0].contentRect;
          if (w > 0 && h > 0) {
            asciiRef.current.setSize(w, h);
          }
        });
        ro.observe(containerRef.current);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (ro) ro.disconnect();
      if (asciiRef.current) {
        asciiRef.current.dispose();
        asciiRef.current = null;
      }
    };
  }, [mounted, text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves]);

  if (typeof window === 'undefined' || !mounted) {
    return (
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#7c3aed] font-['Space_Grotesk'] flex items-center justify-center h-full">
        {text}
      </h1>
    );
  }

  return (
    <div
      ref={containerRef}
      className="ascii-text-container"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%'
      }}
    >
      <style>{`
        .ascii-text-container canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }

        .ascii-text-container pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1em;
          text-align: left;
          position: absolute;
          left: 0;
          top: 0;
          background-image: radial-gradient(circle, #7c3aed 0%, #0053db 50%, #00c896 100%);
          background-attachment: fixed;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          z-index: 9;
          mix-blend-mode: difference;
        }
      `}</style>
    </div>
  );
}
