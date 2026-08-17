import pandas as pd
from typing import List, Dict, Tuple, Any
from app.schemas.dataset import DatasetValidationReport
from app.services.schema_matcher import SchemaMatcher

BIOMARKER_BOUNDS = {
    "fsh": (0.0, 200.0),
    "lh": (0.0, 200.0),
    "estrogen": (0.0, 2000.0),
    "progesterone": (0.0, 100.0),
    "glucose": (30.0, 600.0),
    "bmi": (10.0, 80.0),
    "beta-hcg": (0.0, 100000.0),
    "amh": (0.0, 50.0)
}

class DataValidatorService:
    def __init__(self):
        self.matcher = SchemaMatcher()

    @staticmethod
    def merge_and_standardize(dataframes: List[pd.DataFrame], join_type: str = "outer") -> pd.DataFrame:
        """
        Merges multiple dataframes on common primary key / patient ID columns
        and cleans whitespace from column names.
        """
        if not dataframes:
            return pd.DataFrame()

        if len(dataframes) == 1:
            merged_df = dataframes[0].copy()
        else:
            id_candidates = ["Patient File No.", "patient_id", "Patient_ID", "Sl. No"]
            merge_key = None

            for key in id_candidates:
                if all(key in df.columns for df in dataframes):
                    merge_key = key
                    break

            if merge_key:
                merged_df = dataframes[0]
                for next_df in dataframes[1:]:
                    merged_df = pd.merge(merged_df, next_df, on=merge_key, how=join_type)
            else:
                merged_df = pd.concat(dataframes, axis=1)
                merged_df = merged_df.loc[:, ~merged_df.columns.duplicated()]

        # Clean leading and trailing whitespace from column names
        merged_df.columns = [col.strip() if isinstance(col, str) else col for col in merged_df.columns]
        return merged_df

    def merge_datasets(self, dataframes: List[pd.DataFrame], join_type: str = "outer") -> pd.DataFrame:
        """Instance method wrapper for backward compatibility."""
        return self.merge_and_standardize(dataframes, join_type=join_type)

    @classmethod
    def validate_biomarkers(cls, df: pd.DataFrame) -> DatasetValidationReport:
        """Static/Class method wrapper returning only the validation report."""
        report, _ = cls.validate_dataset_static(df)
        return report

    @staticmethod
    def validate_dataset_static(df: pd.DataFrame) -> Tuple[DatasetValidationReport, int]:
        """Validates biological ranges, missing values, and duplicate rows."""
        total_rows, total_cols = df.shape
        missing_cells = int(df.isnull().sum().sum())
        missing_pct = float((missing_cells / df.size) * 100) if df.size > 0 else 0.0
        duplicates = int(df.duplicated().sum())

        missing_per_col = {col: int(val) for col, val in df.isnull().sum().items()}
        col_types = {col: str(dtype) for col, dtype in df.dtypes.items()}

        anomalies: Dict[str, List[Dict[str, Any]]] = {}
        total_anomalies_count = 0

        for col in df.columns:
            col_lower = str(col).lower()
            for key, (min_val, max_val) in BIOMARKER_BOUNDS.items():
                if key in col_lower and pd.api.types.is_numeric_dtype(df[col]):
                    invalid_mask = (df[col] < min_val) | (df[col] > max_val)
                    invalid_rows = df[invalid_mask]
                    if not invalid_rows.empty:
                        anomalies[col] = [
                            {
                                "row": int(idx),
                                "value": float(val),
                                "reason": f"Out of physiological range ({min_val}-{max_val})"
                            }
                            for idx, val in invalid_rows[col].items()
                        ]
                        total_anomalies_count += len(invalid_rows)

        report = DatasetValidationReport(
            total_rows=total_rows,
            total_columns=total_cols,
            missing_cells=missing_cells,
            missing_percentage=round(missing_pct, 2),
            duplicate_rows=duplicates,
            column_types=col_types,
            missing_per_column=missing_per_col,
            biomarker_anomalies=anomalies
        )
        return report, total_anomalies_count

    def validate_dataset(self, df: pd.DataFrame) -> Tuple[DatasetValidationReport, int]:
        """Instance method for dataset validation."""
        return self.validate_dataset_static(df)