// Paleta de materiales físicos (MeshStandardMaterial) compartida por todas las escenas.
import * as THREE from 'three';

export const COLORS = {
  vitalmet: '#e8641b',      // naranja Vitalmet: resalte de productos propios
  vitalmetSel: '#ff8a3d',
  steel: '#8f969c',
  steelDark: '#5c646b',
  rigRed: '#7a2f2a',        // óxido rojo de estructuras
  rigGrey: '#9aa3a8',
  safety: '#d8a21c',        // amarillo de barandas
  concrete: '#b9bab4',
  rubber: '#1f2224',
  brass: '#c9a44a',
  castIron: '#3b3f43',
  blue: '#2b4c8c',
  red: '#c8242a',
  white: '#dfe2e2',
  ground: '#c2c3bd',
};

const cache = new Map();
export function mat(color, { metalness = 0.55, roughness = 0.45, emissive = null, emissiveIntensity = 0, transparent = false, opacity = 1, flat = false, side = THREE.FrontSide } = {}) {
  const key = JSON.stringify([color, metalness, roughness, emissive, emissiveIntensity, transparent, opacity, flat, side]);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity, flatShading: flat, side, envMapIntensity: 0.9 });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
  cache.set(key, m);
  return m;
}

export const M = {
  steel: () => mat(COLORS.steel, { metalness: 0.7, roughness: 0.4 }),
  steelDark: () => mat(COLORS.steelDark, { metalness: 0.6, roughness: 0.5 }),
  rigRed: () => mat(COLORS.rigRed, { metalness: 0.3, roughness: 0.7 }),
  rigGrey: () => mat(COLORS.rigGrey, { metalness: 0.35, roughness: 0.65 }),
  safety: () => mat(COLORS.safety, { metalness: 0.25, roughness: 0.6 }),
  concrete: () => mat(COLORS.concrete, { metalness: 0.0, roughness: 0.95 }),
  rubber: () => mat(COLORS.rubber, { metalness: 0.05, roughness: 0.9 }),
  brass: () => mat(COLORS.brass, { metalness: 0.85, roughness: 0.3 }),
  castIron: () => mat(COLORS.castIron, { metalness: 0.5, roughness: 0.7 }),
  white: () => mat(COLORS.white, { metalness: 0.2, roughness: 0.6 }),
  painted: (c) => mat(c, { metalness: 0.35, roughness: 0.45 }),
  machined: () => mat('#b9bec4', { metalness: 0.9, roughness: 0.28 }),
  chrome: () => mat('#d5d9dd', { metalness: 1, roughness: 0.18 }),
  glass: () => mat('#9fb6c4', { metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.45 }),
  vitalmet: () => mat(COLORS.vitalmet, { metalness: 0.35, roughness: 0.42 }),
  vitalmetSel: () => mat(COLORS.vitalmetSel, { metalness: 0.4, roughness: 0.35, emissive: '#c24d10', emissiveIntensity: 0.28 }),
  ghost: () => mat('#9aa3a8', { metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.18 }),
};

// Textura procedural de hormigón para el suelo (sin recursos externos).
export function concreteTexture(size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c4c5bf'; ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size); const d = img.data;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n - 2; }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(70,72,68,0.35)'; ctx.lineWidth = 2;
  for (let k = 0; k <= 4; k++) { const p = (k * size) / 4; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(24, 24); tex.anisotropy = 4; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
