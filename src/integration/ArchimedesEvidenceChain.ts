import type { EngineeringLayer } from './EngineeringContextGraph';
import type { EvidenceRef } from './ProvenanceRegistry';
import { ProvenanceRegistry } from './ProvenanceRegistry';

export interface SelectedEvidence {
  id: string;
  layer: EngineeringLayer;
  source: string;
  value?: number | string | null;
  units?: string;
  timestamp?: string;
  geometry?: unknown;
  provenanceId: string;
}

export interface ArchimedesInput {
  id: string;
  provenanceId: string;
  name: string;
  value: number | string | null;
  units?: string;
  sourceLayer: EngineeringLayer;
}

export interface ArchimedesOutput {
  id: string;
  name: string;
  value: number | string | null;
  units?: string;
  status: 'calculated' | 'not-evaluated' | 'error';
}

export interface ArchimedesCalculation {
  calculationId: string;
  model: string;
  version?: string;
  status: 'authoritative-calculation' | 'not-evaluated' | 'error';
  inputs: ArchimedesInput[];
  outputs: ArchimedesOutput[];
  evidenceIds: string[];
  authority: 'Archimedes';
}

export interface EvidenceChain {
  selected: SelectedEvidence[];
  calculations: ArchimedesCalculation[];
}

export interface ArchimedesResolver {
  resolve(input: { selected: SelectedEvidence[]; evidence: EvidenceRef[] }): Promise<ArchimedesCalculation[]>;
}

/**
 * Resolves engineering evidence without allowing the visualization layer to
 * manufacture engineering results. The Archimedes service remains the
 * calculation authority; this module only assembles inputs and provenance.
 */
export async function buildArchimedesEvidenceChain(
  selected: SelectedEvidence[],
  registry: ProvenanceRegistry,
  resolver: ArchimedesResolver,
): Promise<EvidenceChain> {
  const evidence = selected
    .map(item => registry.get(item.provenanceId))
    .filter((item): item is EvidenceRef => Boolean(item));

  const calculations = await resolver.resolve({ selected, evidence });

  return {
    selected,
    calculations,
  };
}

export function makeSelectedEvidence(
  item: Omit<SelectedEvidence, 'provenanceId'> & { provenanceId?: string },
): SelectedEvidence {
  if (!item.provenanceId) {
    throw new Error(`Missing provenanceId for selected evidence ${item.id}`);
  }
  return { ...item, provenanceId: item.provenanceId };
}
