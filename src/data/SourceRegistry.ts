export type SourceClass =
  | 'terrain'
  | 'hydrology'
  | 'flood'
  | 'regulatory'
  | 'geology'
  | 'buildings'
  | 'mapping-coordination'
  | 'telemetry'
  | 'engineering';

export interface SourceRecord {
  id: string;
  title: string;
  class: SourceClass;
  authority: string;
  standard?: string;
  standardVersion?: string;
  keywords?: string[];
  limitation?: string;
  status: 'authoritative' | 'contextual' | 'derived' | 'live';
  provenancePath: string;
}

export const SOURCE_REGISTRY: readonly SourceRecord[] = [
  {
    id: 'noaa-us-mapping-coordination',
    title: 'Map',
    class: 'mapping-coordination',
    authority: 'NOAA NOS OCS IOCM',
    standard: 'ISO 19139 Geographic Information - Metadata - Implementation Specification',
    standardVersion: '2007',
    keywords: ['FY25', 'US Mapping Coordination', 'NOAA', 'IOCM'],
    limitation: 'Not for Navigation',
    status: 'contextual',
    provenancePath: 'docs/metadata/NOAA_US_MAPPING_COORDINATION_ISO19139.md',
  },
  {
    id: 'tri-county-dem',
    title: 'Tri-County terrain DEM',
    class: 'terrain',
    authority: 'configured authoritative terrain provider',
    status: 'authoritative',
    provenancePath: 'data/terrain/',
  },
  {
    id: 'ras-tri-county',
    title: 'Tri-County HEC-RAS flood scenario',
    class: 'flood',
    authority: 'configured HEC-RAS/RAS source',
    status: 'authoritative',
    provenancePath: 'data/ras/',
  },
  {
    id: 'usgs-nwis',
    title: 'USGS NWIS observations',
    class: 'telemetry',
    authority: 'USGS',
    status: 'live',
    provenancePath: 'src/hydrology/',
  },
] as const;

export function getSourceRecord(id: string): SourceRecord | undefined {
  return SOURCE_REGISTRY.find((source) => source.id === id);
}
