# Role 2: Biomedical AI Data Engineering & Quality Infrastructure

## 📌 Executive Overview
**Role 2 (Biomedical AI & Data Engineer)** focuses on building the core data processing, dataset merging, clinical biomarker validation, and quality benchmarking pipeline for **HormoneBench AI**. 

This component ensures that raw multi-source clinical and hormone datasets (e.g., PCOS, LH/FSH ratios, insulin resistance metrics) are dynamically ingested, schema-aligned, cleaned, and scored before downstream machine learning or statistical analysis.

---

## 🚀 Key Responsibilities & Implementations

### 1. Multi-Dataset Ingestion & Dynamic Schema Alignment
- **Automated Schema Matching**: Merges heterogeneous CSV uploads into a single unified DataFrame using flexible column mapping and fuzzy header matching.
- **Biomarker Standardization**: Standardizes clinical entity column names (e.g., mapping `LH_mIU_mL`, `lh_level`, `luteinizing_hormone` to a standardized `LH` attribute).

### 2. Clinical Data Quality & Biomarker Validation Engine
- **Missing Value Detection**: Computes per-column missingness metrics and overall missing cell ratios.
- **Biomarker Anomaly & Outlier Rules**: Checks clinical values against biological/physiological reference ranges (e.g., LH, FSH, Testosterone, Fasting Glucose, AMH, BMI).
- **Quality Indexing (Benchmark Score)**: Calculates a composite **Overall Quality Index (0–100%)** based on:
  - **Completeness Score**
  - **Uniqueness Score** (Duplicate row penalty)
  - **Validity Score** (Physiological outlier penalty)

### 3. AI-Powered Cleaning & Normalization Recommendations
- Integrates LLM-backed reasoning to evaluate dataset summaries and missingness patterns.
- Generates structured, actionable recommendations for data imputation (e.g., median vs. KNN imputation for skewed hormone markers), outlier handling, and normalization strategies.

### 4. API Endpoints & Unified Dashboard Integration
- Exposes robust backend REST endpoints under `/api/v1/dataset/process-and-validate`.
- Integrated directly into the **Streamlit Test Dashboard** (`frontend/test_dashboard.py`) under Tab 14 (**🧬 Data Engineering**).

---

## 🛠️ API Endpoint Specification

### `POST /api/v1/dataset/process-and-validate`
Uploads one or multiple CSV files for merging, validation, and benchmarking.

#### Request Form-Data:
- `files`: One or more CSV files (`multipart/form-data`).

#### Response Schema Example:
```json
{
  "validation_report": {
    "total_rows": 250,
    "total_columns": 8,
    "missing_cells": 12,
    "missing_percentage": 0.6,
    "duplicate_rows": 0,
    "missing_per_column": {
      "LH": 2,
      "FSH": 3,
      "BMI": 0
    },
    "biomarker_anomalies": {
      "LH": "3 out of range values (< 0.1 or > 200 mIU/mL)"
    }
  },
  "quality_benchmark": {
    "overall_quality_index": 92.5,
    "completeness_score": 99.4,
    "uniqueness_score": 100.0,
    "validity_score": 88.0
  },
  "cleaning_suggestions": "### Recommendations:\n1. Apply median imputation for missing LH values..."
}