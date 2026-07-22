import json
from typing import Tuple, List
from models.schemas import Package, NodeType

def parse_sbom(content: bytes, filename: str) -> Tuple[List[Package], List[Tuple[str, str]]]:
    try:
        data = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError:
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
            
        pkg = Package(
            name=comp.get("name", "unknown"),
            version=comp.get("version", "unknown"),
            ecosystem=ecosystem,
            purl=purl,
            node_type=NodeType.PACKAGE
        )
        packages.append(pkg)
        
    dependencies = data.get("dependencies", [])
    for dep in dependencies:
        parent_ref = dep.get("ref")
        depends_on = dep.get("dependsOn", [])
        if parent_ref:
            for child_ref in depends_on:
                edges.append((parent_ref, child_ref))
                
    return packages, edges

def _parse_spdx(data: dict) -> Tuple[List[Package], List[Tuple[str, str]]]:
    packages = []
    edges = []
    
    spdx_packages = data.get("packages", [])
    for spdx_pkg in spdx_packages:
        purl = ""
        ecosystem = "unknown"
        external_refs = spdx_pkg.get("externalRefs", [])
        for ref in external_refs:
            if ref.get("referenceType") == "purl":
                purl = ref.get("referenceLocator", "")
                if purl.startswith("pkg:npm/"):
                    ecosystem = "npm"
                elif purl.startswith("pkg:pypi/"):
                    ecosystem = "pypi"
                elif purl.startswith("pkg:maven/"):
                    ecosystem = "maven"
                break
                
        pkg = Package(
            name=spdx_pkg.get("name", "unknown"),
            version=spdx_pkg.get("versionInfo", "unknown"),
            ecosystem=ecosystem,
            purl=purl,
            node_type=NodeType.PACKAGE
        )
        packages.append(pkg)
        
    relationships = data.get("relationships", [])
    for rel in relationships:
        if rel.get("relationshipType") == "DEPENDS_ON":
            parent = rel.get("spdxElementId")
            child = rel.get("relatedSpdxElement")
            if parent and child:
                edges.append((parent, child))
                
    return packages, edges
