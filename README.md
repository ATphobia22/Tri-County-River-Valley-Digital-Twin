# Tri-County River Valley Digital Twin

Photorealistic, GIS-aware engineering digital twin for the Tri-County River Valley and connected Wabash–Ohio corridor.

## Stack

- WebGPU + WGSL photoreal terrain renderer
- Three.js cinematic CGI and fallback renderer
- MapLibre geospatial/GIS presentation
- PDAL + GeoTIFF/COG terrain pipeline
- HEC-RAS / RAS GeoTIFF flood scenarios
- PostGIS spatial engineering store
- Archimedes engineering calculations
- USGS NWIS telemetry
- Electron desktop packaging path
- Cesium/Unreal scene-graph interoperability

## Coverage

Indiana: Posey, Vanderburgh, Warrick.

Kentucky: Henderson, Union, McLean, Daviess.

Illinois: White, Wabash, Gallatin, Edwards.

Primary hydrology includes the Wabash–Ohio system and the confluence corridor.

## Engineering boundary

Visualization is not the engineering or regulatory source of truth. Authoritative DEM, HEC-RAS/RAS, survey, regulatory, telemetry, and engineering evidence remain provenance-tracked inputs. Rendering exaggeration is explicitly a visual parameter and never modifies source elevation or engineering calculations.

## Architecture

```text
Authoritative DEM / LiDAR ──> PDAL / COG ──> terrain contract
HEC-RAS / RAS GeoTIFF ──────> PostGIS ─────> flood scenario contract
USGS NWIS ──────────────────> telemetry ───> live observation contract
Archimedes ──────────────────> engineering ─> calculation/evidence contract
                                               │
                                               ▼
                                  shared digital-twin state
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                           WebGPU           Three.js        MapLibre
                              └────────────────┼────────────────┘
                                               ▼
                                      cinematic twin / HUD
                                               │
                                  Electron / browser / export
```

## Development

The `feature/engineering-digital-twin-foundation` branch is the initial integration branch. Production changes should enter `main` through review and CI.
