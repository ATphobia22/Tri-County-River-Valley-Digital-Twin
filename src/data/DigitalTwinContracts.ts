export interface FloodScenarioContract {
  planId: string;
  sourceUri: string;
  rasterCrs?: string;
  verticalDatum?: string;
  depthUnits: 'm' | 'ft';
  noDataValue?: number;
  provenanceSourceId: string;
}

export interface GaugeObservationContract {
  siteId: string;
  observedAt: string;
  stage?: number;
  discharge?: number;
  stageUnits?: string;
  dischargeUnits?: string;
  source: 'USGS-NWIS';
}

export interface MappingFootprintContract {
  sourceId: 'noaa-us-mapping-coordination';
  title: 'Map';
  limitation: 'Not for Navigation';
  keywords: readonly ['FY25', 'US Mapping Coordination', 'NOAA', 'IOCM'];
  metadataStandard: 'ISO 19139 Geographic Information - Metadata - Implementation Specification';
  metadataVersion: '2007';
}

export const NOAA_MAPPING_COORDINATION: MappingFootprintContract = {
  sourceId: 'noaa-us-mapping-coordination',
  title: 'Map',
  limitation: 'Not for Navigation',
  keywords: ['FY25', 'US Mapping Coordination', 'NOAA', 'IOCM'],
  metadataStandard: 'ISO 19139 Geographic Information - Metadata - Implementation Specification',
  metadataVersion: '2007',
};

export function assertNotForNavigation(source: MappingFootprintContract): void {
  if (source.limitation !== 'Not for Navigation') {
    throw new Error('NOAA mapping-coordination data must retain its source limitation.');
  }
}
