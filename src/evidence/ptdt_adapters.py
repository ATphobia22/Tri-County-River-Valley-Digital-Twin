from __future__ import annotations

from typing import Any, Mapping, Sequence

from .evidence_graph import ProvenanceRecord


class PTDTExchangeAdapter:
    """Bind PTDT model-exchange payloads to the authoritative Evidence Graph."""

    def record(
        self,
        *,
        source: str,
        source_record_id: str,
        role: str,
        authority: str,
        payload: Mapping[str, Any],
        parent_ids: Sequence[str] = (),
        observed_at: str | None = None,
        spatial_ref: str | None = None,
        vertical_datum: str | None = None,
        units: str | None = None,
    ) -> ProvenanceRecord:
        if not source.strip() or not source_record_id.strip():
            raise ValueError("source and source_record_id must be non-empty")
        if not role.strip() or not authority.strip():
            raise ValueError("role and authority must be non-empty")
        return ProvenanceRecord.create(
            source=source,
            source_record_id=source_record_id,
            role=role,
            authority=authority,
            payload=payload,
            parent_ids=parent_ids,
            observed_at=observed_at,
            spatial_ref=spatial_ref,
            vertical_datum=vertical_datum,
            units=units,
        )


class EnKFEvidenceAdapter(PTDTExchangeAdapter):
    source = "USGS-EnKF"
    role = "derived-assimilation"
    authority = "derived"

    def assimilation(self, *, source_record_id: str, payload: Mapping[str, Any], parent_ids: Sequence[str], **metadata: str | None) -> ProvenanceRecord:
        return self.record(source=self.source, source_record_id=source_record_id, role=self.role, authority=self.authority, payload=payload, parent_ids=parent_ids, **metadata)


class BishopEvidenceAdapter(PTDTExchangeAdapter):
    source = "Bishop"
    role = "slope-stability"
    authority = "slope-stability-model"

    def calculation(self, *, source_record_id: str, payload: Mapping[str, Any], parent_ids: Sequence[str], **metadata: str | None) -> ProvenanceRecord:
        return self.record(source=self.source, source_record_id=source_record_id, role=self.role, authority=self.authority, payload=payload, parent_ids=parent_ids, **metadata)
