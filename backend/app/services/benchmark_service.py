import pandas as pd
from typing import Union
from app.schemas.dataset import QualityBenchmark, DatasetValidationReport

class BenchmarkService:

    @staticmethod
    def calculate_quality_benchmark(
        data: Union[pd.DataFrame, DatasetValidationReport], 
        anomalies_count: int = 0
    ) -> QualityBenchmark:
        """
        Calculates Quality Benchmark supporting both DataFrame and DatasetValidationReport inputs.
        """
        # Case 1: If input is a DatasetValidationReport (from DataValidatorService)
        if isinstance(data, DatasetValidationReport):
            report = data
            completeness = max(0.0, 100.0 - report.missing_percentage)

            if report.total_rows > 0:
                dup_pct = (report.duplicate_rows / report.total_rows) * 100.0
                uniqueness = max(0.0, 100.0 - dup_pct)
            else:
                uniqueness = 100.0

            total_anomalies = sum(len(v) for v in report.biomarker_anomalies.values())
            total_cells = report.total_rows * report.total_columns
            if total_cells > 0:
                validity = max(0.0, ((total_cells - total_anomalies) / total_cells) * 100.0)
            else:
                validity = 100.0

        # Case 2: If input is a raw pandas DataFrame
        else:
            df = data
            total_cells = df.size
            if total_cells == 0:
                return QualityBenchmark(
                    completeness_score=0.0, 
                    uniqueness_score=0.0, 
                    validity_score=0.0, 
                    overall_quality_index=0.0
                )

            missing_cells = df.isnull().sum().sum()
            completeness = ((total_cells - missing_cells) / total_cells) * 100.0

            duplicate_rows = df.duplicated().sum()
            total_rows = len(df)
            uniqueness = ((total_rows - duplicate_rows) / total_rows) * 100.0 if total_rows > 0 else 100.0

            validity = ((total_cells - anomalies_count) / total_cells) * 100.0 if total_cells > 0 else 100.0

        # Weighted Overall Quality Score
        overall_index = (0.4 * completeness) + (0.3 * uniqueness) + (0.3 * validity)

        return QualityBenchmark(
            completeness_score=round(completeness, 2),
            uniqueness_score=round(uniqueness, 2),
            validity_score=round(validity, 2),
            overall_quality_index=round(overall_index, 2)
        )

    @classmethod
    def calculate_quality_index(
        cls, 
        data: Union[pd.DataFrame, DatasetValidationReport], 
        anomalies_count: int = 0
    ) -> QualityBenchmark:
        """Alias for calculate_quality_benchmark to support endpoint route calls."""
        return cls.calculate_quality_benchmark(data, anomalies_count)