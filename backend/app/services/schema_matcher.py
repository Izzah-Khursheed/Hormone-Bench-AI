from rapidfuzz import process, fuzz
from typing import List, Dict
from app.schemas.dataset import ColumnSchemaMatch

class SchemaMatcher:
    def __init__(self, threshold: float = 75.0):
        self.threshold = threshold

    def match_columns(self, source_cols: List[str], target_cols: List[str]) -> List[ColumnSchemaMatch]:
        matches = []
        for col in source_cols:
            match = process.extractOne(col, target_cols, scorer=fuzz.token_sort_ratio)
            if match and match[1] >= self.threshold:
                matches.append(ColumnSchemaMatch(
                    source_column=col,
                    target_column=match[0],
                    similarity_score=float(match[1])
                ))
        return matches