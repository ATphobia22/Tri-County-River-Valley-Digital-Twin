export interface ArcGISQueryOptions {
  where?: string;
  outFields?: readonly string[];
  outSR?: number | string;
  geometry?: string;
  geometryType?: string;
  inSR?: number | string;
  spatialRel?: string;
  resultRecordCount?: number;
  resultOffset?: number;
}

export interface ArcGISFeatureCollection {
  type: 'FeatureCollection';
  features: Array<Record<string, unknown>>;
  exceededTransferLimit?: boolean;
}

const MAX_FIELDS = 32;
const MAX_RECORDS = 2000;

function encodeParams(options: ArcGISQueryOptions): string {
  const params = new URLSearchParams({
    f: 'geojson',
    where: options.where?.trim() || '1=1',
    outFields: (options.outFields?.slice(0, MAX_FIELDS).join(',') || '*'),
  });

  if (options.outSR !== undefined) params.set('outSR', String(options.outSR));
  if (options.geometry) params.set('geometry', options.geometry);
  if (options.geometryType) params.set('geometryType', options.geometryType);
  if (options.inSR !== undefined) params.set('inSR', String(options.inSR));
  if (options.spatialRel) params.set('spatialRel', options.spatialRel);
  if (options.resultRecordCount !== undefined) {
    params.set('resultRecordCount', String(Math.min(options.resultRecordCount, MAX_RECORDS)));
  }
  if (options.resultOffset !== undefined) params.set('resultOffset', String(Math.max(0, options.resultOffset)));

  return params.toString();
}

export async function queryArcGISLayer(
  layerUrl: string,
  options: ArcGISQueryOptions = {},
  signal?: AbortSignal,
): Promise<ArcGISFeatureCollection> {
  const base = layerUrl.replace(/\/$/, '');
  const url = `${base}/query?${encodeParams(options)}`;
  const response = await fetch(url, { signal, headers: { Accept: 'application/geo+json, application/json' } });
  if (!response.ok) throw new Error(`ArcGIS query failed: HTTP ${response.status}`);

  const payload = await response.json() as ArcGISFeatureCollection | { error?: { message?: string } };
  if ('error' in payload && payload.error) {
    throw new Error(`ArcGIS query failed: ${payload.error.message || 'unknown service error'}`);
  }
  return payload as ArcGISFeatureCollection;
}
