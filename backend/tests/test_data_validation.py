import pytest
import pandas as pd
from app.services.data_validator_service import DataValidatorService
from app.services.benchmark_service import BenchmarkService

def test_auto_merge_and_validation():
    df1 = pd.DataFrame({"patient_id": [1, 2], "fsh": [5.2, 12.0]})
    df2 = pd.DataFrame({"patient_id": [1, 2], "bmi": [22.5, 95.0]}) # 95.0 is an anomaly
    
    validator = DataValidatorService()
    merged = validator.merge_datasets([df1, df2])
    
    assert merged.shape == (2, 3)
    report, anomalies_count = validator.validate_dataset(merged)
    
    assert report.total_rows == 2
    assert anomalies_count >= 1
    
    benchmark = BenchmarkService.calculate_quality_benchmark(merged, anomalies_count)
    assert 0 <= benchmark.overall_quality_index <= 100