import maplibregl from 'maplibre-gl';
import { NOAA_MAPPING_COORDINATION_SERVICE, noaaQueryUrl } from '../data/noaaMappingCoordination';

export interface NoaaMappingCoordinationLayerOptions {
  id?: string;
  layerId?: number;
  opacity?: number;
}

/**
 * Adds NOAA/IOCM mapping-coordination footprints as contextual GIS data.
 * The source schema is not assumed here: rendering uses neutral styling until
 * the live layer metadata confirms a classification field.
 */
export async function addNoaaMappingCoordinationLayer(
  map: maplibregl.Map,
  options: NoaaMappingCoordinationLayerOptions = {},
): Promise<void> {
  const id = options.id ?? 'noaa-mapping-coordination';
  const layerId = options.layerId ?? 0;
  const sourceId = `${id}-source`;
  const response = await fetch(noaaQueryUrl(layerId));
  if (!response.ok) throw new Error(`NOAA mapping coordination request failed: ${response.status}`);
  const geojson = await response.json();

  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, { type: 'geojson', data: geojson });
  map.addLayer({
    id,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-opacity': options.opacity ?? 0.18,
      'fill-outline-color': '#60a5fa',
      'fill-color': '#60a5fa',
    },
  });

  map.setLayoutProperty(id, 'visibility', 'visible');
  void NOAA_MAPPING_COORDINATION_SERVICE;
}
