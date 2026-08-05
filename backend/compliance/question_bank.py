# backend/compliance/question_bank.py
"""Complete 42-question compliance bank across 5 domains."""

QUESTION_BANK = {
    "software": [
        {
            "id": "SW-001",
            "text": "Are APIs protected with authentication tokens or API keys that rotate on a defined schedule?",
            "domain": "software",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.4.2",
            "weight": 0.15,
            "risk_if_no": "High"
        },
        {
            "id": "SW-002",
            "text": "Is static application security testing (SAST) integrated into your CI/CD pipeline and run before every deployment?",
            "domain": "software",
            "frameworks": ["nist_csf", "owasp"],
            "nist_function": "Protect",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "SW-003",
            "text": "Are all container images scanned for vulnerabilities before being deployed to production?",
            "domain": "software",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.12.6.1",
            "weight": 0.13,
            "risk_if_no": "High"
        },
        {
            "id": "SW-004",
            "text": "Are software dependency versions pinned and locked in your build pipeline to prevent unexpected updates?",
            "domain": "software",
            "frameworks": ["nist_csf", "owasp"],
            "nist_function": "Protect",
            "weight": 0.10,
            "risk_if_no": "Medium"
        },
        {
            "id": "SW-005",
            "text": "Is software composition analysis (SCA) run automatically to detect open-source vulnerabilities?",
            "domain": "software",
            "frameworks": ["nist_csf", "owasp"],
            "nist_function": "Detect",
            "weight": 0.15,
            "risk_if_no": "Critical"
        },
        {
            "id": "SW-006",
            "text": "Are security patches for critical vulnerabilities applied within 30 days of release?",
            "domain": "software",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Respond",
            "iso_control": "A.12.6.1",
            "weight": 0.15,
            "risk_if_no": "Critical"
        },
        {
            "id": "SW-007",
            "text": "Is access to source code repositories restricted to authorised personnel with audit logging enabled?",
            "domain": "software",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.2.3",
            "weight": 0.10,
            "risk_if_no": "High"
        },
        {
            "id": "SW-008",
            "text": "Are all third-party software vendors assessed for security posture before integration?",
            "domain": "software",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.15.1.1",
            "weight": 0.10,
            "risk_if_no": "High"
        }
    ],
    "infrastructure": [
        {
            "id": "IN-001",
            "text": "Are all cloud storage buckets and object storage configured as private by default with no public access?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.13.1.3",
            "weight": 0.13,
            "risk_if_no": "Critical"
        },
        {
            "id": "IN-002",
            "text": "Is encryption at rest enabled for all databases and persistent storage volumes?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001", "gdpr"],
            "nist_function": "Protect",
            "iso_control": "A.10.1.1",
            "gdpr_article": "Article 32",
            "weight": 0.13,
            "risk_if_no": "Critical"
        },
        {
            "id": "IN-003",
            "text": "Are production and development environments fully network-separated with no shared credentials?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.13.1.3",
            "weight": 0.11,
            "risk_if_no": "High"
        },
        {
            "id": "IN-004",
            "text": "Is all infrastructure defined as code and stored in version-controlled repositories?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.12.1.2",
            "weight": 0.09,
            "risk_if_no": "Medium"
        },
        {
            "id": "IN-005",
            "text": "Are security group rules and firewall policies reviewed and audited at least quarterly?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.13.1.1",
            "weight": 0.10,
            "risk_if_no": "High"
        },
        {
            "id": "IN-006",
            "text": "Is DDoS protection enabled on all public-facing endpoints and load balancers?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.13.1.1",
            "weight": 0.10,
            "risk_if_no": "High"
        },
        {
            "id": "IN-007",
            "text": "Are all administrative consoles and management interfaces accessible only through VPN or zero-trust network access?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.4.2",
            "weight": 0.12,
            "risk_if_no": "Critical"
        },
        {
            "id": "IN-008",
            "text": "Are system and application logs centrally collected, retained for at least 90 days, and monitored for anomalies?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Detect",
            "iso_control": "A.12.4.1",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "IN-009",
            "text": "Are automated backups tested for restoration at least monthly?",
            "domain": "infrastructure",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Recover",
            "iso_control": "A.12.3.1",
            "weight": 0.10,
            "risk_if_no": "High"
        }
    ],
    "people": [
        {
            "id": "PE-001",
            "text": "Is multi-factor authentication enforced for all employee accounts across all company systems?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.4.2",
            "weight": 0.18,
            "risk_if_no": "Critical"
        },
        {
            "id": "PE-002",
            "text": "Do all employees complete security awareness training within 30 days of joining and annually thereafter?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.7.2.2",
            "weight": 0.14,
            "risk_if_no": "High"
        },
        {
            "id": "PE-003",
            "text": "Is access to systems provisioned on the principle of least privilege with documented justification required?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.2.2",
            "weight": 0.15,
            "risk_if_no": "High"
        },
        {
            "id": "PE-004",
            "text": "Are access rights reviewed and updated when employees change roles and revoked immediately upon departure?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.2.6",
            "weight": 0.14,
            "risk_if_no": "Critical"
        },
        {
            "id": "PE-005",
            "text": "Do employees with access to sensitive systems undergo background verification checks?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.7.1.1",
            "weight": 0.10,
            "risk_if_no": "High"
        },
        {
            "id": "PE-006",
            "text": "Is privileged access (admin accounts, root access, production access) managed separately with additional controls?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.9.2.3",
            "weight": 0.15,
            "risk_if_no": "Critical"
        },
        {
            "id": "PE-007",
            "text": "Are contractors and vendors with system access subject to the same access controls as employees?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.15.1.2",
            "weight": 0.07,
            "risk_if_no": "High"
        },
        {
            "id": "PE-008",
            "text": "Is there a documented process for employees to report suspected security incidents?",
            "domain": "people",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Detect",
            "iso_control": "A.16.1.2",
            "weight": 0.07,
            "risk_if_no": "Medium"
        }
    ],
    "processes": [
        {
            "id": "PP-001",
            "text": "Is there a documented and tested incident response plan that assigns clear roles and escalation paths?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Respond",
            "iso_control": "A.16.1.1",
            "weight": 0.14,
            "risk_if_no": "Critical"
        },
        {
            "id": "PP-002",
            "text": "Has the incident response plan been tested through a tabletop exercise or live drill in the last 12 months?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Respond",
            "iso_control": "A.16.1.1",
            "weight": 0.11,
            "risk_if_no": "High"
        },
        {
            "id": "PP-003",
            "text": "Is there a publicly accessible responsible disclosure or vulnerability reporting policy?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.6.1.3",
            "weight": 0.09,
            "risk_if_no": "Medium"
        },
        {
            "id": "PP-004",
            "text": "Is there a documented data retention and secure deletion policy that specifies retention periods by data type?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001", "gdpr"],
            "nist_function": "Protect",
            "iso_control": "A.8.2.3",
            "gdpr_article": "Article 5",
            "weight": 0.11,
            "risk_if_no": "High"
        },
        {
            "id": "PP-005",
            "text": "Is there a formal change management process requiring approval before changes are deployed to production?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.12.1.2",
            "weight": 0.10,
            "risk_if_no": "Medium"
        },
        {
            "id": "PP-006",
            "text": "Is penetration testing conducted at least annually by an independent third party?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.18.2.3",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "PP-007",
            "text": "Is there a vendor and third-party risk assessment process that evaluates security posture before engagement?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Identify",
            "iso_control": "A.15.2.1",
            "weight": 0.11,
            "risk_if_no": "High"
        },
        {
            "id": "PP-008",
            "text": "Are business continuity and disaster recovery plans documented and tested?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Recover",
            "iso_control": "A.17.1.1",
            "weight": 0.11,
            "risk_if_no": "High"
        },
        {
            "id": "PP-009",
            "text": "Is there a documented and enforced acceptable use policy for company systems and data?",
            "domain": "processes",
            "frameworks": ["nist_csf", "iso_27001"],
            "nist_function": "Protect",
            "iso_control": "A.8.1.3",
            "weight": 0.11,
            "risk_if_no": "Medium"
        }
    ],
    "data": [
        {
            "id": "DA-001",
            "text": "Do you maintain a complete and current inventory of all locations where personal data is stored and processed?",
            "domain": "data",
            "frameworks": ["nist_csf", "iso_27001", "gdpr"],
            "nist_function": "Identify",
            "iso_control": "A.8.1.1",
            "gdpr_article": "Article 30",
            "weight": 0.14,
            "risk_if_no": "Critical"
        },
        {
            "id": "DA-002",
            "text": "Is all personal data encrypted in transit between all internal services and external endpoints using TLS 1.2 or higher?",
            "domain": "data",
            "frameworks": ["nist_csf", "iso_27001", "gdpr"],
            "nist_function": "Protect",
            "iso_control": "A.10.1.1",
            "gdpr_article": "Article 32",
            "weight": 0.15,
            "risk_if_no": "Critical"
        },
        {
            "id": "DA-003",
            "text": "Is there a documented and practiced process for responding to data subject access requests within the required timeframe?",
            "domain": "data",
            "frameworks": ["gdpr"],
            "gdpr_article": "Article 15",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "DA-004",
            "text": "Is all access to personal data logged and auditable with logs retained for at least 12 months?",
            "domain": "data",
            "frameworks": ["nist_csf", "iso_27001", "gdpr"],
            "nist_function": "Detect",
            "iso_control": "A.12.4.1",
            "gdpr_article": "Article 32",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "DA-005",
            "text": "Is there a documented data breach notification procedure that meets the 72-hour reporting requirement?",
            "domain": "data",
            "frameworks": ["gdpr", "iso_27001"],
            "gdpr_article": "Article 33",
            "iso_control": "A.16.1.3",
            "weight": 0.14,
            "risk_if_no": "Critical"
        },
        {
            "id": "DA-006",
            "text": "Is personal data retention limited strictly to what is necessary for the stated purpose and deleted thereafter?",
            "domain": "data",
            "frameworks": ["gdpr", "iso_27001"],
            "gdpr_article": "Article 5",
            "iso_control": "A.8.2.3",
            "weight": 0.12,
            "risk_if_no": "High"
        },
        {
            "id": "DA-007",
            "text": "Is there a lawful basis documented for each category of personal data processing?",
            "domain": "data",
            "frameworks": ["gdpr"],
            "gdpr_article": "Article 6",
            "weight": 0.11,
            "risk_if_no": "Critical"
        },
        {
            "id": "DA-008",
            "text": "Are data processing agreements in place with all third-party processors who handle personal data?",
            "domain": "data",
            "frameworks": ["gdpr", "iso_27001"],
            "gdpr_article": "Article 28",
            "iso_control": "A.15.1.2",
            "weight": 0.10,
            "risk_if_no": "High"
        }
    ]
}
