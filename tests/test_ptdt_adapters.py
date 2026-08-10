from src.evidence.evidence_graph import EvidenceGraph, ProvenanceRecord
from src.evidence.ptdt_adapters import BishopEvidenceAdapter, EnKFEvidenceAdapter


def test_enkf_preserves_usgs_parent_and_derived_semantics() -> None:
    observation = ProvenanceRecord.create(
        source="USGS-NWIS",
        source_record_id="03378500:00065:test",
        role="usgs-observation",
        authority="USGS",
        payload={"value": 381.2},
        units="ft",
    )
    result = EnKFEvidenceAdapter().assimilation(
        source_record_id="run-1:scenario-1",
        payload={"analysis": 380.9, "kalman_gain": 0.75},
        parent_ids=(observation.provenance_id,),
        units="ft",
    )
    assert result.source == "USGS-EnKF"
    assert result.role == "derived-assimilation"
    assert result.authority == "derived"
    assert result.parent_ids == (observation.provenance_id,)


def test_bishop_is_a_new_engineering_evidence_node() -> None:
    input_record = ProvenanceRecord.create(
        source="HEC-RAS",
        source_record_id="ras:test",
        role="ras",
        authority="hydraulic-model",
        payload={"water_surface_elevation": 381.0},
        units="ft",
    )
    result = BishopEvidenceAdapter().calculation(
        source_record_id="bishop:run-1",
        payload={"factor_of_safety": 1.42, "converged": True},
        parent_ids=(input_record.provenance_id,),
        units="dimensionless",
    )
    graph = EvidenceGraph()
    graph.add_record(input_record)
    graph.add_record(result)
    graph.link(input_record.provenance_id, result.provenance_id, "produces", "Bishop slope-stability calculation")
    selected = graph.selection(result.provenance_id)
    assert selected["read_only"] is True
    assert result.parent_ids == (input_record.provenance_id,)
    assert result.role == "slope-stability"
