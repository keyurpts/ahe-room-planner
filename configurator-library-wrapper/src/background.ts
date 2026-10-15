import type { BufferGeometry, Material, Mesh, Object3D, Texture } from 'three';

/** Release the SDK-generated exterior plane; the room's own floor is separate. */
export function removeGroundPlane(groundPlane: Object3D): void {
  groundPlane.removeFromParent();
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  groundPlane.traverse(node => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of meshMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (typeof value === 'object' && value !== null && 'isTexture' in value && value.isTexture === true) {
          textures.add(value as Texture);
        }
      }
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}
