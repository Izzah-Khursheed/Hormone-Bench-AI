from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ColumnSchemaMatch(BaseModel):
    source_column: str
    target_column: str
    similarity_score: float

class DatasetValidationReport(BaseModel):
    total_rows: int
    total_columns: int
    missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    column_types: Dict[str, str]
    missing_per_column: Dict[str, int]
    biomarker_anomalies: Dict[str, List[Dict[str, Any]]]

class QualityBenchmark(BaseModel):
    completeness_score: float = Field(..., description="Percentage of non-missing values")
    uniqueness_score: float = Field(..., description="Percentage of unique rows")
    validity_score: float = Field(..., description="Percentage of physiologically valid values")
    overall_quality_index: float = Field(..., description="Weighted average (0-100)")

class MergeRequest(BaseModel):
    merge_keys: Optional[List[str]] = None
    join_type: str = "outer"