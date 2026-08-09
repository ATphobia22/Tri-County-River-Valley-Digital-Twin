import type { EvidenceChain } from '../integration/ArchimedesEvidenceChain';

export interface EvidencePanelRow {
  label: string;
  value: string;
  kind: 'source' | 'input' | 'output' | 'status';
}

export function buildArchimedesEvidencePanel(chain: EvidenceChain): EvidencePanelRow[] {
  const rows: EvidencePanelRow[] = [];

  for (const selected of chain.selected) {
    rows.push({ label: `${selected.layer}:${selected.id}`, value: selected.source, kind: 'source' });
  }

  for (const calculation of chain.calculations) {
    rows.push({ label: `${calculation.calculationId} status`, value: calculation.status, kind: 'status' });
    for (const input of calculation.inputs) {
      rows.push({
        label: `${calculation.calculationId} input · ${input.name}`,
        value: `${String(input.value)}${input.units ? ` ${input.units}` : ''} [${input.provenanceId}]`,
        kind: 'input',
      });
    }
    for (const output of calculation.outputs) {
      rows.push({
        label: `${calculation.calculationId} output · ${output.name}`,
        value: `${String(output.value)}${output.units ? ` ${output.units}` : ''} (${output.status})`,
        kind: 'output',
      });
    }
  }

  return rows;
}
