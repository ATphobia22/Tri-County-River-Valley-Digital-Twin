export type EngineeringLayer = 'dem' | 'lidar' | 'ras' | 'usgs' | 'postgis' | 'archimedes';

export interface SpatialContext {
  bbox?: [number, number, number, number];
  crs?: string;
}

export interface LayerContext {
  id: string;
  kind: EngineeringLayer;
  source: string;
  spatial?: SpatialContext;
  timestamp?: string;
  units?: string;
  verticalDatum?: string;
  role: 'source' | 'observation' | 'derived' | 'calculation';
}

export interface MappingFootprintContext {
  sourceId: 'noaa-us-mapping-coordination';
  limitation: 'Not for Navigation';
  footprintId?: string | number;
  geometry?: unknown;
  attributes?: Record<string, unknown>;
}

export interface EngineeringContextLink {
  mapping: MappingFootprintContext;
  relatedLayers: LayerContext[];
}

/**
 * Context only: a NOAA mapping footprint is allowed to point at related
 * engineering datasets, but it never becomes an engineering measurement.
 */
export function linkMappingFootprint(
  mapping: MappingFootprintContext,
  layers: readonly LayerContext[],
): EngineeringContextLink {
  if (mapping.limitation !== 'Not for Navigation') {
    throw new Error('NOAA mapping footprint limitation must be preserved.');
  }

  return {
    mapping,
    relatedLayers: [...layers],
  };
}

export function groupLayersByKind(layers: readonly LayerContext[]) {
  return layers.reduce<Record<EngineeringLayer, LayerContext[]>>((groups, layer) => {
    groups[layer.kind].push(layer);
    return groups;
  }, {
    dem: [],
    lidar: [],
    ras: [],
    usgs: [],
    postgis: [],
    archimedes: [],
  });
}
