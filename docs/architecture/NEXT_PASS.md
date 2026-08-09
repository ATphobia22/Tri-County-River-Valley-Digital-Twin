# Next Engineering Pass — Integrated Digital Twin

## Implemented foundation

1. Shared terrain contract for WebGPU and Three.js.
2. WebGPU fullscreen WGSL terrain renderer.
3. Three.js fallback renderer using the same source contract.
4. Provenance-aware source registry.
5. ISO 19139 metadata record for the supplied NOAA U.S. Mapping Coordination layer.
6. Explicit flood-scenario, live-gauge, and mapping-footprint contracts.
7. Preservation of the NOAA source limitation `Not for Navigation`.

## Remaining integration surfaces

### Terrain

- Connect authoritative DEM/COG manifests to `TerrainSourceContract`.
- Preserve source CRS and vertical datum through preprocessing.
- Keep visual exaggeration separate from engineering elevation.

### Flood

- Connect RAS GeoTIFF ingestion to `FloodScenarioContract`.
- Validate raster units, CRS, nodata, bounds, and provenance before rendering.
- Render flood depth as a derived visualization layer; never rewrite source raster values.

### Hydrology

- Connect USGS NWIS observations to `GaugeObservationContract`.
- Timestamp every observation and preserve the source site identifier.
- Treat live observations as observations, not forecasts or regulatory determinations.

### GIS

- Keep MapLibre as the geographic context layer.
- Register buildings, parcels, roads, hydrography, BAFM, FEMA, geology, and mapping footprints as independent layers.
- Attach source provenance to every layer.

### Engineering

- Keep Archimedes calculations outside rendering code.
- Feed only validated engineering outputs into visualization.
- Preserve calculation inputs, units, datum, timestamp, and evidence references.

### Cinematic

- Drive the cinematic camera from the shared scene state.
- Add volumetric atmosphere, day/night, water response, flood visualization, and HUD telemetry without changing engineering data.

## Source boundary

The supplied NOAA record describes mapping footprints and coordination metadata. It does not establish terrain elevation, flood depth, regulatory boundaries, navigation information, or engineering design values. Those roles must remain assigned to their respective authoritative sources.
