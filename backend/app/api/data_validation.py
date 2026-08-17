import io
import math
import numpy as np
import pandas as pd
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.data_validator_service import DataValidatorService
from app.services.benchmark_service import BenchmarkService
from app.services.explainability_service import ExplainabilityService

router = APIRouter()

def sanitize_for_json(obj):
    """Recursively replaces NaN, Infinity, and -Infinity with None for JSON compliance."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj

def to_dict_compat(pydantic_obj):
    """Compatible conversion for Pydantic v1 (.dict()) and v2 (.model_dump())."""
    if hasattr(pydantic_obj, "model_dump"):
        return pydantic_obj.model_dump()
    return pydantic_obj.dict()

@router.post("/dataset/process-and-validate")
async def process_and_validate_datasets(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    dfs = []
    for file in files:
        filename = file.filename.lower()
        contents = await file.read()
        
        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(contents))
            elif filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file format: {file.filename}. Only CSV and Excel (.xlsx, .xls) are allowed."
                )
            
            dfs.append(df)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading {file.filename}: {str(e)}")

    # 1. Merge and standardize datasets
    merged_df = DataValidatorService.merge_and_standardize(dfs)

    # 2. Validate biomarkers & calculate benchmark
    report = DataValidatorService.validate_biomarkers(merged_df)
    benchmark = BenchmarkService.calculate_quality_index(report)

    report_dict = sanitize_for_json(to_dict_compat(report))
    benchmark_dict = sanitize_for_json(to_dict_compat(benchmark))

    # 3. Get AI cleaning suggestions using extracted dict
    overall_score_raw = benchmark_dict.get("overall_quality_index", 0.0)
    try:
        overall_score = float(overall_score_raw) if overall_score_raw is not None else 0.0
    except (TypeError, ValueError):
        overall_score = 0.0
    suggestions = ExplainabilityService.generate_cleaning_suggestions(
        report_dict, 
        overall_score
    )

    # 4. Prepare JSON-safe preview (Clean NaNs/Infs)
    preview_df = merged_df.head(10).astype(object)
    preview_df = preview_df.where(pd.notnull(preview_df), None)
    preview_records = preview_df.to_dict(orient="records")

    # Final response payload
    response_payload = {
        "summary": report_dict,
        "benchmark": benchmark_dict,
        "recommendations": suggestions,
        "preview": preview_records
    }

    return sanitize_for_json(response_payload)