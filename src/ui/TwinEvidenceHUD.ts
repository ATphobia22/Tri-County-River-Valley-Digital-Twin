import type { SelectedEvidence } from '../integration/TwinEvidenceInspector';

export interface TwinEvidenceHUD {
  root: HTMLDivElement;
  update(evidence: SelectedEvidence): void;
  destroy(): void;
}

function row(label: string, value: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'twin-evidence-row';
  const key = document.createElement('span'); key.textContent = label;
  const val = document.createElement('strong'); val.textContent = value;
  el.append(key, val);
  return el;
}

export function createTwinEvidenceHUD(container: HTMLElement): TwinEvidenceHUD {
  const root = document.createElement('section');
  root.className = 'twin-evidence-hud';
  root.setAttribute('aria-label', 'Tri-County engineering evidence inspector');
  root.style.cssText = 'position:absolute;right:18px;top:18px;width:340px;max-height:calc(100vh - 36px);overflow:auto;padding:14px;background:rgba(4,10,18,.88);color:#e8f1ff;border:1px solid rgba(120,170,220,.35);border-radius:10px;font:12px/1.4 system-ui,sans-serif;backdrop-filter:blur(12px);z-index:20;display:none;box-shadow:0 14px 45px rgba(0,0,0,.35)';
  const title = document.createElement('h2'); title.textContent = 'ENGINEERING EVIDENCE'; title.style.cssText = 'font-size:13px;letter-spacing:.12em;margin:0 0 10px';
  const body = document.createElement('div');
  root.append(title, body); container.append(root);

  return {
    root,
    update(evidence) {
      root.style.display = 'block';
      body.replaceChildren(
        row('LOCATION', `${evidence.coordinate[1].toFixed(6)}, ${evidence.coordinate[0].toFixed(6)}`),
        row('NOAA FOOTPRINTS', String(evidence.noaa.length)),
        row('RAS CELLS', String(evidence.ras.length)),
        row('USGS SERIES', String(evidence.usgs.length)),
        row('POSTGIS FEATURES', String(evidence.postgis.length)),
        row('EVIDENCE RECORDS', String(evidence.registry.all().length)),
      );
      const maxDepth = evidence.ras.reduce((m, c) => Math.max(m, c.depthM), 0);
      if (evidence.ras.length) body.append(row('MAX RAS DEPTH', `${maxDepth.toFixed(3)} m`));
      for (const obs of evidence.usgs.slice(0, 4)) body.append(row(`USGS ${obs.site}`, obs.value == null ? 'no value' : `${obs.value} ${obs.unit}`));
      if (evidence.noaa.length) {
        const note = document.createElement('div'); note.textContent = 'NOAA IOCM footprint: Not for Navigation'; note.style.cssText = 'margin-top:10px;color:#fbbf24;font-weight:700'; body.append(note);
      }
      const layers = document.createElement('div'); layers.style.cssText = 'margin-top:10px;border-top:1px solid rgba(120,170,220,.25);padding-top:8px';
      for (const layer of evidence.layers) layers.append(row(layer.kind.toUpperCase(), `${layer.source} · ${layer.role}`));
      body.append(layers);
    },
    destroy() { root.remove(); },
  };
}
