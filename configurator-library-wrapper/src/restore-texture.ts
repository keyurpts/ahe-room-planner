import type { Mesh, MeshStandardMaterial, Object3D, Texture } from 'three';

const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/** Share one GPU texture and spread material updates across browser tasks. */
export async function restoreTexture(model: Object3D, texture: Texture, id: string, price?: string | number) {
  const pending: Object3D[] = [model];
  let start = performance.now();
  while (pending.length) {
    const node = pending.pop()!;
    pending.push(...node.children);
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!node.userData.hasOriginalMaterial) {
        node.userData.hasOriginalMaterial = true;
        node.userData.originalMaterial = Array.isArray(mesh.material)
          ? materials.map(material => material.clone()) : mesh.material.clone();
        node.userData.originalTexture = Array.isArray(mesh.material) ? null : (mesh.material as MeshStandardMaterial).map ?? null;
      }
      for (const material of materials) {
        if ('isMeshBasicMaterial' in material || 'isMeshStandardMaterial' in material || 'isMeshPhongMaterial' in material) {
          const needsShader = !(material as MeshStandardMaterial).map;
          (material as MeshStandardMaterial).map = texture;
          if (needsShader) material.needsUpdate = true;
        }
      }
    }
    if (performance.now() - start >= 4) {
      await yieldToBrowser();
      start = performance.now();
    }
  }
  const targets = model.userData.metadata?.isGroup ? model.children : [model];
  for (const target of targets) {
    target.userData.metadata ??= {};
    target.userData.metadata.appliedTexture = { id, price };
  }
  await yieldToBrowser();
}
