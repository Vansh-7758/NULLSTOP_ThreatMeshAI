# backend/remediation/github_pr.py
import logging
import re
import json
from typing import Tuple, Dict, Optional
from github import Github
from models.schemas import PRResponse
from config import settings

logger = logging.getLogger(__name__)

def _detect_manifest(package_name: str, ecosystem: str) -> Tuple[str, str]:
    eco_lower = ecosystem.lower()
    pkg_lower = package_name.lower()

    if eco_lower == "pypi" or pkg_lower in ["requests", "urllib3", "flask", "django", "numpy", "pillow", "pyyaml", "langchain", "chromadb"]:
        return "manifests/requirements.txt", "txt"
    elif eco_lower == "maven" or pkg_lower in ["log4j-core", "spring-core", "struts2-core", "jackson-databind"]:
        return "manifests/pom.xml", "xml"
    else:
        return "manifests/package.json", "json"

def _update_manifest_content(content: str, package_name: str, old_version: str, new_version: str, manifest_type: str) -> str:
    if manifest_type == "json":
        pattern1 = re.escape(f'"{package_name}": "{old_version}"')
        replacement1 = f'"{package_name}": "{new_version}"'
        if re.search(pattern1, content):
            return re.sub(pattern1, replacement1, content)
        
        pattern2 = re.escape(f'"{package_name}": "^{old_version}"')
        replacement2 = f'"{package_name}": "^{new_version}"'
        if re.search(pattern2, content):
            return re.sub(pattern2, replacement2, content)

        pattern3 = re.escape(f'"{package_name}": "~{old_version}"')
        replacement3 = f'"{package_name}": "~{new_version}"'
        if re.search(pattern3, content):
            return re.sub(pattern3, replacement3, content)
            
    elif manifest_type == "txt":
        pattern = re.escape(f"{package_name}=={old_version}")
        replacement = f"{package_name}=={new_version}"
        if re.search(pattern, content, re.IGNORECASE):
            return re.sub(pattern, replacement, content, flags=re.IGNORECASE)
            
    elif manifest_type == "xml":
        pattern = f"(<artifactId>{re.escape(package_name)}</artifactId>\\s*<version>){re.escape(old_version)}(</version>)"
        replacement = f"\\g<1>{new_version}\\g<2>"
        if re.search(pattern, content):
            return re.sub(pattern, replacement, content)

    return content.replace(old_version, new_version)

import os

def update_local_manifest(package_name: str, old_version: str, new_version: str) -> str:
    possible_paths = [
        "d:/Hack4Humanity/threatmesh-ai/manifests/package.json",
        "d:/Hack4Humanity/threatmesh-ai/manifests/requirements.txt",
        "d:/Hack4Humanity/threatmesh-ai/manifests/pom.xml",
        "d:/Hack4Humanity/threatmesh-ai/package.json",
        "d:/Hack4Humanity/package.json"
    ]
    
    # 1. Search existing files for matching package
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                if package_name.lower() in content.lower():
                    ext = path.split(".")[-1]
                    m_type = "json" if ext == "json" else "xml" if ext == "xml" else "txt"
                    updated = _update_manifest_content(content, package_name, old_version, new_version, m_type)
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(updated)
                    logger.info(f"Successfully updated local manifest file {path} for package {package_name}")
                    return path
            except Exception as e:
                logger.warning(f"Failed to update local manifest {path}: {e}")

    # 2. Package not found in existing content -> Append to target manifest
    p_lower = package_name.lower()
    if p_lower in ["requests", "urllib3", "flask", "django", "numpy", "pillow", "pyyaml", "langchain", "chromadb"]:
        target_path = "d:/Hack4Humanity/threatmesh-ai/manifests/requirements.txt"
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "a", encoding="utf-8") as f:
            f.write(f"\n{package_name}=={new_version}\n")
        logger.info(f"Appended {package_name}=={new_version} to {target_path}")
        return target_path
    elif p_lower in ["log4j-core", "spring-core", "struts2-core", "jackson-databind"]:
        target_path = "d:/Hack4Humanity/threatmesh-ai/manifests/pom.xml"
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        if os.path.exists(target_path):
            with open(target_path, "r", encoding="utf-8") as f:
                pom_content = f.read()
            dep_entry = f"    <dependency>\n      <groupId>org.apache</groupId>\n      <artifactId>{package_name}</artifactId>\n      <version>{new_version}</version>\n    </dependency>\n"
            if "</dependencies>" in pom_content:
                pom_updated = pom_content.replace("</dependencies>", f"{dep_entry}  </dependencies>")
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(pom_updated)
                return target_path
    
    # Default NPM package.json
    target_path = "d:/Hack4Humanity/threatmesh-ai/manifests/package.json"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                pkg_json = json.load(f)
            if "dependencies" not in pkg_json:
                pkg_json["dependencies"] = {}
            pkg_json["dependencies"][package_name] = new_version
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(pkg_json, f, indent=2)
            return target_path
        except Exception:
            pass

    return possible_paths[0]

def generate_pull_request(
    package_name: str,
    old_version: str,
    new_version: str,
    cve_id: str,
    trust_score_before: float,
    trust_score_after: float,
    playbook_summary: str,
    scan_id: str
) -> PRResponse:
    repo_owner = settings.GITHUB_REPO_OWNER or "Anshul-052"
    repo_name = settings.GITHUB_REPO_NAME or "OrchestrateAi"
    pr_title = f"[ThreatMesh] Security fix — upgrade {package_name} from {old_version} to {new_version}"
    safe_pkg_name = package_name.lower().replace('/', '-').replace('@', '')
    safe_cve_id = cve_id.lower().replace(' ', '-')
    branch_name = f"threatmesh/fix-{safe_pkg_name}-{safe_cve_id}"

    # Auto-patch local repository manifest file directly
    patched_file = update_local_manifest(package_name, old_version, new_version)
    local_file_url = f"file:///{patched_file}" if patched_file else f"https://github.com/{repo_owner}/{repo_name}/compare"

    if not settings.GITHUB_TOKEN:
        logger.info(f"GITHUB_TOKEN not set. Applied local file patch at {patched_file}.")
        return PRResponse(
            pr_url=local_file_url,
            pr_title=pr_title,
            branch_name=branch_name,
            package_name=package_name,
            old_version=old_version,
            new_version=new_version
        )
        
    try:
        g = Github(settings.GITHUB_TOKEN)
        full_repo_name = f"{repo_owner}/{repo_name}"
        repo = g.get_repo(full_repo_name)
        
        default_branch = repo.default_branch
        ref = repo.get_git_ref(f"heads/{default_branch}")
        
        try:
            repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=ref.object.sha)
        except Exception as e:
            logger.warning(f"Branch might already exist: {e}")
            
        manifest_file, manifest_type = _detect_manifest(package_name, "npm")
        file_content_obj = repo.get_contents(manifest_file, ref=branch_name)
        if isinstance(file_content_obj, list):
            file_content_obj = file_content_obj[0]
            
        decoded_content = file_content_obj.decoded_content.decode('utf-8')
        updated_content = _update_manifest_content(decoded_content, package_name, old_version, new_version, manifest_type)
        
        commit_message = f"fix(security): upgrade {package_name} from {old_version} to {new_version} ({cve_id})"
        
        repo.update_file(
            file_content_obj.path,
            commit_message,
            updated_content,
            file_content_obj.sha,
            branch=branch_name
        )
        
        pr_body = f"""## 🛡️ ThreatMesh AI Security Update

Fixes **{cve_id}** for `{package_name}`.

- **Package:** `{package_name}`
- **Old Version:** `{old_version}`
- **New Version:** `{new_version}`
- **Trust Score Before:** `{trust_score_before:.1f}`
- **Trust Score After:** `{trust_score_after:.1f}`

### Remediation Playbook Summary
{playbook_summary}

---
*Generated by ThreatMesh AI (Scan ID: {scan_id})*
"""
        
        pr = repo.create_pull(
            title=pr_title,
            body=pr_body,
            head=branch_name,
            base=default_branch
        )
        
        return PRResponse(
            pr_url=pr.html_url,
            pr_title=pr_title,
            branch_name=branch_name,
            package_name=package_name,
            old_version=old_version,
            new_version=new_version
        )
        
    except Exception as e:
        logger.error(f"Failed to generate PR via GitHub API: {e}")
        existing_pr_url = f"https://github.com/{repo_owner}/{repo_name}/pulls"
        try:
            g_repo = Github(settings.GITHUB_TOKEN).get_repo(f"{repo_owner}/{repo_name}")
            pulls = g_repo.get_pulls(state='open', head=f"{repo_owner}:{branch_name}")
            if pulls and pulls.totalCount > 0:
                existing_pr_url = pulls[0].html_url
        except Exception as err:
            logger.warning(f"Could not retrieve existing PR URL: {err}")

        return PRResponse(
            pr_url=existing_pr_url,
            pr_title=pr_title,
            branch_name=branch_name,
            package_name=package_name,
            old_version=old_version,
            new_version=new_version
        )
