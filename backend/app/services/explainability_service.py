import json
import re
from pathlib import Path
from typing import Any, Dict, List

from app.config import settings
from app.prompts.loader import render_prompt
from app.services.gemini_client import generate_response


PROMPT_FILE = Path(settings.PROMPT_LIBRARY_DIR) / "tasks" / "data_cleaning.yaml"


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _report_to_string(report_dict: Dict[str, Any]) -> str:
    return json.dumps(_json_safe(report_dict), indent=2, ensure_ascii=True)


def _extract_metadata_columns(report_dict: Dict[str, Any]) -> List[str]:
    missing_per_column = report_dict.get("missing_per_column", {})
    if not isinstance(missing_per_column, dict):
        return []

    suspicious_fragments = (
        "instructions to be followed",
        "unnamed",
        "metadata",
    )
    metadata_cols = []
    for col in missing_per_column.keys():
        if not isinstance(col, str):
            continue
        col_lower = col.strip().lower()
        if any(fragment in col_lower for fragment in suspicious_fragments):
            metadata_cols.append(col)

    return metadata_cols


def _rule_based_fallback(report_dict: Dict[str, Any], quality_index: float) -> str:
    missing_per_column = report_dict.get("missing_per_column", {})
    duplicate_rows = report_dict.get("duplicate_rows", 0)
    anomalies = report_dict.get("biomarker_anomalies", {})

    metadata_cols = _extract_metadata_columns(report_dict)
    metadata_text = ", ".join(metadata_cols) if metadata_cols else "non-clinical metadata columns prefixed as Unnamed or instruction fields"

    top_missing_text = "high-missing columns"
    if isinstance(missing_per_column, dict) and missing_per_column:
        sorted_missing = sorted(
            ((k, v) for k, v in missing_per_column.items() if isinstance(v, (int, float))),
            key=lambda item: item[1],
            reverse=True,
        )
        top_missing = [name for name, _ in sorted_missing[:3]]
        if top_missing:
            top_missing_text = ", ".join(top_missing)

    anomaly_cols = []
    if isinstance(anomalies, dict):
        anomaly_cols = [k for k, v in anomalies.items() if isinstance(v, list) and v]

    bullets = [
        f"Drop obvious metadata columns that do not carry patient measurements, including {metadata_text}.",
        f"Normalize hormone biomarker names to a single convention (for example beta-HCG, AMH, FSH, LH) before downstream analytics and benchmark scoring.",
        f"Apply a missingness strategy for {top_missing_text}: impute clinically plausible values only where justified and otherwise flag or exclude records per analysis goal.",
    ]

    if anomaly_cols:
        bullets.append(
            "Review out-of-range biomarker values in "
            + ", ".join(anomaly_cols)
            + " and cap, correct, or remove values outside physiological limits."
        )

    if isinstance(duplicate_rows, (int, float)) and duplicate_rows > 0:
        bullets.append("Remove duplicate patient rows using a stable patient identifier before model training.")

    bullets.append(f"Prioritize these cleaning actions first because the current overall quality index is {quality_index:.2f}.")

    return "\n".join(f"- {item}" for item in bullets[:6])


def _normalize_markdown_bullets(raw_text: str, report_dict: Dict[str, Any], quality_index: float) -> str:
    text = (raw_text or "").strip()
    if not text or text.lower().startswith("error generating response"):
        return _rule_based_fallback(report_dict, quality_index)

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    bullet_lines = []
    for line in lines:
        cleaned = re.sub(r"^[-*•\d\.)\s]+", "", line).strip()
        if cleaned:
            bullet_lines.append(cleaned)

    if not bullet_lines:
        sentence_chunks = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        bullet_lines = sentence_chunks[:6]

    lowered = " ".join(bullet_lines).lower()
    if "unnamed" not in lowered and "instructions to be followed" not in lowered:
        metadata_cols = _extract_metadata_columns(report_dict)
        metadata_text = ", ".join(metadata_cols) if metadata_cols else "instruction and Unnamed metadata columns"
        bullet_lines.append(f"Drop non-clinical metadata columns such as {metadata_text}.")

    if "beta-hcg" not in lowered or "amh" not in lowered:
        bullet_lines.append("Standardize biomarker labels to consistent names, including beta-HCG and AMH.")

    return "\n".join(f"- {item}" for item in bullet_lines[:6])


class ExplainabilityService:
    @staticmethod
    def generate_cleaning_suggestions(report_dict: dict, quality_index: float) -> str:
        report_dict = report_dict if isinstance(report_dict, dict) else {}
        try:
            quality_index_value = float(quality_index)
        except (TypeError, ValueError):
            quality_index_value = 0.0

        report_str = _report_to_string(report_dict)

        prompt_vars = {
            "report": report_str,
            "report_dict": report_dict,
            "quality_index": round(quality_index_value, 2),
        }

        try:
            rendered_prompt = render_prompt(str(PROMPT_FILE), prompt_vars)
            llm_output = generate_response(rendered_prompt)
            return _normalize_markdown_bullets(llm_output, report_dict, quality_index_value)
        except Exception:
            return _rule_based_fallback(report_dict, quality_index_value)