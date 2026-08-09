import type { EngineeringContextLink, LayerContext, MappingFootprintContext } from './EngineeringContextGraph';
import { linkMappingFootprint } from './EngineeringContextGraph';

export interface BBox { minX: number; minY: number; maxX: number; maxY: number; }
export interface SpatialRecord { id: string | number; bbox: BBox; layer: LayerContext; }

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export function selectOverlappingLayers(viewport: BBox, records: readonly SpatialRecord[]): LayerContext[] {
  return records.filter(r => bboxIntersects(viewport, r.bbox)).map(r => r.layer);
}

export function buildSpatialContext(
  mapping: MappingFootprintContext,
  viewport: BBox,
  records: readonly SpatialRecord[],
): EngineeringContextLink {
  const layers = selectOverlappingLayers(viewport, records);
  return linkMappingFootprint(mapping, layers);
}
