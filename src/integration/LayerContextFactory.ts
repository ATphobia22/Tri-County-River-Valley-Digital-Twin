import type { EngineeringLayer, LayerContext } from './EngineeringContextGraph';

export interface SourceDescriptor {
  id: string;
  authority: string;
  kind: EngineeringLayer;
  role: LayerContext['role'];
}

export function createLayerContext(
  source: SourceDescriptor,
  spatial?: LayerContext['spatial'],
  metadata?: Pick<LayerContext, 'timestamp' | 'units' | 'verticalDatum'>,
): LayerContext {
  return {
    id: source.id,
    kind: source.kind,
    source: source.authority,
    role: source.role,
    spatial,
    ...metadata,
  };
}

export const TRI_COUNTY_LAYER_SOURCES: readonly SourceDescriptor[] = [
  { id: 'dem', kind: 'dem', authority: 'configured authoritative DEM/COG source', role: 'source' },
  { id: 'lidar', kind: 'lidar', authority: 'configured LiDAR/PDAL source', role: 'source' },
  { id: 'ras', kind: 'ras', authority: 'configured HEC-RAS/RAS GeoTIFF source', role: 'source' },
  { id: 'usgs-nwis', kind: 'usgs', authority: 'USGS NWIS', role: 'observation' },
  { id: 'postgis', kind: 'postgis', authority: 'PostGIS spatial database', role: 'derived' },
  { id: 'archimedes', kind: 'archimedes', authority: 'Archimedes engineering calculation engine', role: 'calculation' },
];
