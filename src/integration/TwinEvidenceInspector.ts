import type maplibregl from 'maplibre-gl';
import { queryArcGISLayer } from './ArcGISSpatialQuery';
import { buildSpatialContext, type BBox, type SpatialRecord } from './SpatialContextEngine';
import { toMappingContext, queryNoaaFootprints, NOAA_MAPPING_COORDINATION } from './NoaaContextAdapter';
import type { EngineeringContextLink, EngineeringLayer, LayerContext } from './EngineeringContextGraph';
import { ProvenanceRegistry } from './ProvenanceRegistry';

export interface RASFloodCell {
  id: string | number;
  depthM: number;
  geometry: unknown;
  attributes: Record<string, unknown>;
}

export interface USGSObservation {
  site: string;
  siteName: string;
  parameter: string;
  value: number | null;
  unit: string;
  observedAt: string | null;
}

export interface PostGISFeature {
  id: string | number;
  geometry: unknown;
  properties: Record<string, unknown>;
}

export interface SelectedEvidence {
  coordinate: [number, number];
  noaa: EngineeringContextLink[];
  ras: RASFloodCell[];
  usgs: USGSObservation[];
  postgis: PostGISFeature[];
  layers: LayerContext[];
  registry: ProvenanceRegistry;
}

export interface InspectorSources {
  noaaLayerUrl?: string;
  rasGeoJsonUrl?: string;
  usgsSites: readonly string[];
  postgisQueryUrl?: string;
}

const WGS84 = 'EPSG:4326';

function pointBBox(lon: number, lat: number, epsilon = 0.00025): BBox {
  return { minX: lon - epsilon, minY: lat - epsilon, maxX: lon + epsilon, maxY: lat + epsilon };
}

function asBBox(geometry: maplibregl.MapMouseEvent['lngLat']): BBox {
  return pointBBox(geometry.lng, geometry.lat);
}

async function loadGeoJSON(url: string, bbox: BBox, signal?: AbortSignal): Promise<RASFloodCell[]> {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}bbox=${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`, { signal });
  if (!response.ok) throw new Error(`RAS GeoJSON request failed: HTTP ${response.status}`);
  const fc = await response.json() as { features?: Array<{ id?: string | number; geometry: unknown; properties?: Record<string, unknown> }> };
  return (fc.features ?? []).map((feature, index) => {
    const p = feature.properties ?? {};
    const rawDepth = p.depth_m ?? p.depthM ?? p.DEPTH_M ?? p.depth ?? 0;
    const depthM = Number(rawDepth);
    return { id: feature.id ?? p.OBJECTID ?? index, depthM: Number.isFinite(depthM) ? depthM : 0, geometry: feature.geometry, attributes: p };
  });
}

async function loadUSGS(sites: readonly string[], signal?: AbortSignal): Promise<USGSObservation[]> {
  if (!sites.length) return [];
  const params = new URLSearchParams({ format: 'json', sites: sites.join(','), parameterCd: '00065', siteStatus: 'active', period: 'P1D' });
  const response = await fetch(`https://waterservices.usgs.gov/nwis/iv/?${params}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`USGS NWIS request failed: HTTP ${response.status}`);
  const payload = await response.json() as { value?: { timeSeries?: Array<{ sourceInfo?: { siteCode?: Array<{ value?: string }>; siteName?: string }; variable?: { variableCode?: Array<{ value?: string }>; unit?: { unitCode?: string } }; values?: Array<{ value?: Array<{ value?: string; dateTime?: string }> }> }> } };
  const series = payload.value?.timeSeries ?? [];
  return series.map(s => {
    const last = s.values?.at(-1)?.value?.at(-1);
    return {
      site: s.sourceInfo?.siteCode?.[0]?.value ?? '',
      siteName: s.sourceInfo?.siteName ?? '',
      parameter: s.variable?.variableCode?.[0]?.value ?? '00065',
      value: last?.value != null && Number.isFinite(Number(last.value)) ? Number(last.value) : null,
      unit: s.variable?.unit?.unitCode ?? '',
      observedAt: last?.dateTime ?? null,
    };
  });
}

async function loadPostGIS(url: string, bbox: BBox, signal?: AbortSignal): Promise<PostGISFeature[]> {
  const params = new URLSearchParams({ bbox: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`, crs: WGS84, limit: '250' });
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}${params}`, { signal });
  if (!response.ok) throw new Error(`PostGIS query failed: HTTP ${response.status}`);
  const payload = await response.json() as { features?: Array<{ id?: string | number; geometry: unknown; properties?: Record<string, unknown> }> };
  return (payload.features ?? []).map((f, i) => ({ id: f.id ?? i, geometry: f.geometry, properties: f.properties ?? {} }));
}

function rasRecords(cells: readonly RASFloodCell[]): SpatialRecord[] {
  return cells.map(cell => ({ id: cell.id, bbox: geometryBBox(cell.geometry), layer: { id: `ras:${cell.id}`, kind: 'ras', source: 'HEC-RAS/RAS GeoTIFF derived flood cell', role: 'derived', units: 'm' } }));
}

function geometryBBox(geometry: unknown): BBox {
  const coordinates: number[][] = [];
  const walk = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') { coordinates.push([value[0], value[1]]); return; }
    for (const child of value) walk(child);
  };
  if (geometry && typeof geometry === 'object' && 'coordinates' in geometry) walk((geometry as { coordinates: unknown }).coordinates);
  if (!coordinates.length) return { minX: -180, minY: -90, maxX: 180, maxY: 90 };
  return { minX: Math.min(...coordinates.map(c => c[0])), minY: Math.min(...coordinates.map(c => c[1])), maxX: Math.max(...coordinates.map(c => c[0])), maxY: Math.max(...coordinates.map(c => c[1])) };
}

export async function inspectLocation(
  coordinate: [number, number],
  sources: InspectorSources,
  signal?: AbortSignal,
): Promise<SelectedEvidence> {
  const [lon, lat] = coordinate;
  const bbox = pointBBox(lon, lat);
  const registry = new ProvenanceRegistry();

  const [ras, usgs, postgis, noaa] = await Promise.all([
    sources.rasGeoJsonUrl ? loadGeoJSON(sources.rasGeoJsonUrl, bbox, signal) : Promise.resolve<RASFloodCell[]>([]),
    loadUSGS(sources.usgsSites, signal),
    sources.postgisQueryUrl ? loadPostGIS(sources.postgisQueryUrl, bbox, signal) : Promise.resolve<PostGISFeature[]>([]),
    sources.noaaLayerUrl ? queryNoaaFootprints(sources.noaaLayerUrl, { geometry: `${lon},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outSR: 4326, outFields: ['*'], resultRecordCount: 100 }, signal) : Promise.resolve([]),
  ]);

  const spatial: SpatialRecord[] = [
    ...rasRecords(ras),
    ...postgis.map(f => ({ id: f.id, bbox: geometryBBox(f.geometry), layer: { id: `postgis:${f.id}`, kind: 'postgis' as EngineeringLayer, source: 'PostGIS', role: 'derived' as const } })),
  ];
  const noaaContexts = noaa.map(f => buildSpatialContext(toMappingContext(f), bbox, spatial));

  for (const cell of ras) registry.register({ id: `ras:${cell.id}`, layer: 'ras', source: 'HEC-RAS/RAS GeoTIFF', role: 'derived', units: 'm' });
  for (const obs of usgs) registry.register({ id: `usgs:${obs.site}:${obs.parameter}`, layer: 'usgs', source: 'USGS NWIS', role: 'observation', timestamp: obs.observedAt ?? undefined, units: obs.unit });
  for (const feature of postgis) registry.register({ id: `postgis:${feature.id}`, layer: 'postgis', source: 'PostGIS', role: 'derived' });
  for (const footprint of noaa) registry.register({ id: `noaa:${footprint.id}`, layer: 'dem', source: 'NOAA IOCM Mapping Coordination', role: 'source' });

  return { coordinate, noaa: noaaContexts, ras, usgs, postgis, layers: spatial.map(r => r.layer), registry };
}

export function attachTwinInspector(map: maplibregl.Map, sources: InspectorSources, render: (evidence: SelectedEvidence) => void): () => void {
  const controller = new AbortController();
  const handler = async (event: maplibregl.MapMouseEvent) => {
    try { render(await inspectLocation([event.lngLat.lng, event.lngLat.lat], sources, controller.signal)); }
    catch (error) { if (!controller.signal.aborted) console.error('[TwinInspector]', error); }
  };
  map.on('click', handler);
  return () => { controller.abort(); map.off('click', handler); };
}

export const defaultNoaaLayerUrl = `${NOAA_MAPPING_COORDINATION}/0`;
