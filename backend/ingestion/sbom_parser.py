import json
from typing import Tuple, List, Union
from models.schemas import Package, NodeType

def parse_sbom(content: Union[bytes, str], filename: str) -> Tuple[List[Package], List[Tuple[str, str]]]:
    try:
        if isinstance(content, bytes):
            content = content.decode("utf-8")
        data = json.loads(content)
    except Exception:
        return [], []
        
    if "bomFormat" in data and data["bomFormat"] == "CycloneDX":
        return _parse_cyclonedx(data)
    elif "spdxVersion" in data:
        return _parse_spdx(data)
    
    return [], []

def _parse_cyclonedx(data: dict) -> Tuple[List[Package], List[Tuple[str, str]]]:
    packages = []
    edges = []
    
    metadata_component = data.get("metadata", {}).get("component")
    if metadata_component:
        purl = metadata_component.get("purl", "")
        ecosystem = "unknown"
        if purl.startswith("pkg:npm/"):
            ecosystem = "npm"
        elif purl.startswith("pkg:pypi/"):
            ecosystem = "pypi"
        elif purl.startswith("pkg:maven/"):
            ecosystem = "maven"
            
        root_package = Package(
            name=metadata_component.get("name", "unknown"),
            version=metadata_component.get("version", "unknown"),
            ecosystem=ecosystem,
            purl=purl,
            node_type=NodeType.PACKAGE
        )
        packages.append(root_package)

    components = data.get("components", [])
    for comp in components:
        purl = comp.get("purl", "")
        ecosystem = "unknown"
        if purl.startswith("pkg:npm/"):
            ecosystem = "npm"
        elif purl.startswith("pkg:pypi/"):
            ecosystem = "pypi"
        elif purl.startswith("pkg:maven/"):
            ecosystem = "maven"

        node_type = NodeType.PACKAGE
        name_lower = comp.get("name", "").lower()
        if any(kw in name_lower for kw in ["gpt", "bert", "llama", "model"]):
            node_type = NodeType.AI_MODEL
        elif any(kw in name_lower for kw in ["prompt"]):
            node_type = NodeType.PROMPT
        elif any(kw in name_lower for kw in ["chroma", "pinecone", "qdrant"]):
            node_type = NodeType.VECTOR_DB

        pkg = Package(
            name=comp.get("name", "unknown"),
            version=comp.get("version", "unknown"),
            ecosystem=ecosystem,
            purl=purl,
            node_type=node_type
        )
        packages.append(pkg)

    dependencies = data.get("dependencies", [])
    for dep in dependencies:
        ref = dep.get("ref", "")
        for depends_on in dep.get("dependsOn", []):
            edges.append((ref, depends_on))

    return packages, edges

def _parse_spdx(data: dict) -> Tuple[List[Package], List[Tuple[str, str]]]:
    packages = []
    edges = []

    packages_data = data.get("packages", [])
    for pkg_data in packages_data:
        purl = ""
        for ref in pkg_data.get("externalRefs", []):
            if ref.get("referenceType") == "purl":
                purl = ref.get("referenceLocator", "")

        ecosystem = "unknown"
        if purl.startswith("pkg:npm/"):
            ecosystem = "npm"
        elif purl.startswith("pkg:pypi/"):
            ecosystem = "pypi"

        pkg = Package(
            name=pkg_data.get("name", "unknown"),
            version=pkg_data.get("versionInfo", "unknown"),
            ecosystem=ecosystem,
            purl=purl,
            node_type=NodeType.PACKAGE
        )
        packages.append(pkg)

    relationships = data.get("relationships", [])
    for rel in relationships:
        if rel.get("relationshipType") == "DEPENDS_ON":
            edges.append((rel.get("spdxElementId"), rel.get("relatedSpdxElement")))

    return packages, edges
