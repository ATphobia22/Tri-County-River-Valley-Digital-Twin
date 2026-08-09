import type { EngineeringLayer, LayerContext } from './EngineeringContextGraph';

export interface EvidenceRef {
  id: string;
  layer: EngineeringLayer;
  source: string;
  role: LayerContext['role'];
  authority?: string;
  timestamp?: string;
  units?: string;
  verticalDatum?: string;
  uri?: string;
}

export class ProvenanceRegistry {
  private readonly records = new Map<string, EvidenceRef>();

  register(record: EvidenceRef): void {
    if (this.records.has(record.id)) throw new Error(`Duplicate evidence id: ${record.id}`);
    this.records.set(record.id, { ...record });
  }

  get(id: string): EvidenceRef | undefined { return this.records.get(id); }

  byLayer(layer: EngineeringLayer): EvidenceRef[] {
    return [...this.records.values()].filter(r => r.layer === layer);
  }

  all(): EvidenceRef[] { return [...this.records.values()]; }
}
