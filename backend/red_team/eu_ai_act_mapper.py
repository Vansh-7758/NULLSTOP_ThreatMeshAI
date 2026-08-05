# backend/red_team/eu_ai_act_mapper.py
from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class ComplianceMappingSpec:
    eu_ai_act_article: str
    eu_ai_act_description: str
    iso_42001_clause: str
    iso_42001_description: str
    nist_ai_rmf: str


COMPLIANCE_MAPPINGS: Dict[str, ComplianceMappingSpec] = {
    "prompt_injection": ComplianceMappingSpec(
        eu_ai_act_article="Article 15(4)",
        eu_ai_act_description="Resilience against attempts by third parties to alter AI system behavior or output via adversarial input manipulation.",
        iso_42001_clause="Clause 8.3",
        iso_42001_description="AI System Operation & Control: Input validation and immutability controls against prompt injection.",
        nist_ai_rmf="MANAGE 2.2 / PROTECT 1.1"
    ),
    "jailbreak": ComplianceMappingSpec(
        eu_ai_act_article="Article 15(1)",
        eu_ai_act_description="Technical robustness and cybersecurity requirement ensuring high-risk AI systems resist unauthorized behavioral override.",
        iso_42001_clause="Clause 8.4",
        iso_42001_description="AI System Safety Assessment: Verification that roleplay and hypothetical framing cannot bypass safety guardrails.",
        nist_ai_rmf="GOVERN 1.2 / PROTECT 2.1"
    ),
    "hallucination": ComplianceMappingSpec(
        eu_ai_act_article="Article 15(2)",
        eu_ai_act_description="Accuracy and reliability assurance preventing system dissemination of unverified or fabricated facts.",
        iso_42001_clause="Clause 6.1",
        iso_42001_description="Actions to Address Risks: Verification of factual grounding and detection of uncorroborated assertions.",
        nist_ai_rmf="MEASURE 2.1 / MANAGE 1.3"
    ),
    "data_leakage": ComplianceMappingSpec(
        eu_ai_act_article="Article 10(5)",
        eu_ai_act_description="Data governance and privacy protection preventing disclosure of confidential system instructions or training data.",
        iso_42001_clause="Clause 7.5",
        iso_42001_description="Documented Information & Confidentiality: Prevention of unauthorized system prompt or credential extraction.",
        nist_ai_rmf="PROTECT 3.2 / MANAGE 3.1"
    ),
    "system_prompt_override": ComplianceMappingSpec(
        eu_ai_act_article="Article 15(4)",
        eu_ai_act_description="Control integrity ensuring system instructions remain immutable during execution.",
        iso_42001_clause="Clause 8.3",
        iso_42001_description="Operational Control: Immutable directive enforcement preventing mid-conversation administrative overrides.",
        nist_ai_rmf="PROTECT 1.2 / MANAGE 2.3"
    ),
    "agent_hijacking": ComplianceMappingSpec(
        eu_ai_act_article="Article 14(2)",
        eu_ai_act_description="Human oversight and downstream automation safeguards preventing hijacked agents from executing unauthorized actions.",
        iso_42001_clause="Clause 8.2",
        iso_42001_description="AI System Risk Assessment: Validation that tool call requests and downstream automation payloads are sanitized.",
        nist_ai_rmf="GOVERN 3.1 / PROTECT 2.2"
    ),
    "toxicity_and_bias": ComplianceMappingSpec(
        eu_ai_act_article="Article 10(2)",
        eu_ai_act_description="Data bias mitigation and non-discrimination requirements for high-risk AI deployment.",
        iso_42001_clause="Clause 5.2",
        iso_42001_description="AI Policy & Ethics: Prevention of toxic, biased, or discriminatory output under contextual disguise.",
        nist_ai_rmf="MEASURE 1.1 / GOVERN 2.1"
    ),
    "rag_poisoning": ComplianceMappingSpec(
        eu_ai_act_article="Article 10(3)",
        eu_ai_act_description="Retrieval data quality and integrity management preventing poisoned document snippets from corrupting outputs.",
        iso_42001_clause="Clause 8.1",
        iso_42001_description="Operational Planning & Data Quality: Verification that knowledge base context retrieval is trustworthy.",
        nist_ai_rmf="MANAGE 1.1 / MEASURE 3.2"
    )
}


def get_compliance_mapping_for_vector(vector_id: str) -> Dict[str, str]:
    """Returns static EU AI Act and ISO 42001 compliance mapping for a specific attack vector."""
    spec = COMPLIANCE_MAPPINGS.get(vector_id)
    if not spec:
        return {
            "eu_ai_act_article": "Article 15(1)",
            "eu_ai_act_description": "General AI technical robustness requirement.",
            "iso_42001_clause": "Clause 8.3",
            "iso_42001_description": "AI System Operation & Monitoring.",
            "nist_ai_rmf": "MANAGE 2.2"
        }
    return {
        "eu_ai_act_article": spec.eu_ai_act_article,
        "eu_ai_act_description": spec.eu_ai_act_description,
        "iso_42001_clause": spec.iso_42001_clause,
        "iso_42001_description": spec.iso_42001_description,
        "nist_ai_rmf": spec.nist_ai_rmf
    }


def get_all_compliance_mappings() -> Dict[str, Dict[str, str]]:
    """Returns full dictionary of compliance mappings across all 8 attack vectors."""
    return {v_id: get_compliance_mapping_for_vector(v_id) for v_id in COMPLIANCE_MAPPINGS}
