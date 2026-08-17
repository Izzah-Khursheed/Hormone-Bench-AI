"""Manual testing dashboard for AI Developer 1 & AI Developer 2 backend endpoints. Not the production
frontend (that's a separate Next.js build, owned by the Full Stack Developer role) — this is
just a fast way to click through and verify each endpoint without using curl/Swagger.

Run with:  streamlit run frontend/test_dashboard.py
"""

import json
import mimetypes
import requests
import streamlit as st

st.set_page_config(page_title="HormoneBench AI - Test Dashboard", page_icon="🧬", layout="wide")

st.title("🧪 HormoneBench AI — Unified Test Dashboard")
st.caption("Manual testing UI for AI Developer 1 & AI Developer 2 backend endpoints.")

with st.sidebar:
    st.header("Backend Configuration")
    backend_url = st.text_input("Backend URL", value="http://localhost:8000")
    API = f"{backend_url}/api/v1"

    if st.button("Check health", use_container_width=True):
        try:
            r = requests.get(f"{API}/health", timeout=5)
            if r.status_code == 200:
                st.success("Backend connected")
                st.json(r.json())
            else:
                st.error(f"Unhealthy: HTTP {r.status_code}")
        except Exception as exc:
            st.error(f"Unreachable: {exc}")


def show_response(resp: requests.Response) -> None:
    if resp.status_code >= 400:
        st.error(f"HTTP {resp.status_code}")
        st.code(resp.text)
    else:
        st.success(f"HTTP {resp.status_code}")
        st.json(resp.json())


tabs = st.tabs(
    [
        "💬 Chat", "📄 Upload", "🔍 Literature", "📝 Summarize", "📚 Citations",
        "🔎 Semantic Search", "📊 Reports", "📈 Dataset Analysis", "📉 Statistics",
        "🧾 Evidence", "🎓 Tutor", "💡 Education", "🕸️ Knowledge Graph",
        "🧬 Data Engineering"  # Role 2 Integration
    ]
)

# --- Chat ---
with tabs[0]:
    st.subheader("Research Copilot Chat")
    message = st.text_area("Message", "What is PCOS?")
    thread_id = st.text_input("Thread ID", "test-thread")
    if st.button("Send", key="chat_send"):
        with st.spinner("Thinking..."):
            try:
                r = requests.post(f"{API}/chat", json={"message": message, "thread_id": thread_id}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Document upload ---
with tabs[1]:
    st.subheader("Document Upload (PDF/DOCX/TXT -> RAG corpus)")
    file = st.file_uploader("Choose a file", type=["pdf", "docx", "txt"])
    if file and st.button("Upload & Ingest"):
        with st.spinner("Uploading..."):
            try:
                files = {"file": (file.name, file.getvalue(), file.type)}
                r = requests.post(f"{API}/documents/upload", files=files, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Literature ---
with tabs[2]:
    st.subheader("Literature Search")
    q = st.text_input("Search query", "PCOS insulin resistance")
    source = st.selectbox("Source", ["both", "pubmed", "semantic_scholar"])
    limit = st.slider("Limit", 1, 50, 10)
    if st.button("Search"):
        with st.spinner("Searching..."):
            try:
                r = requests.get(f"{API}/literature/search", params={"q": q, "source": source, "limit": limit}, timeout=30)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

    st.divider()
    st.subheader("Ingest a Paper into the RAG Corpus")
    col1, col2 = st.columns(2)
    doi = col1.text_input("DOI (optional)")
    pmid = col2.text_input("PMID (optional)")
    if st.button("Ingest"):
        with st.spinner("Ingesting..."):
            try:
                r = requests.post(f"{API}/literature/ingest", json={"doi": doi or None, "pmid": pmid or None}, timeout=30)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Summarize ---
with tabs[3]:
    st.subheader("Paper Summarization")
    mode = st.radio("Input type", ["Text", "DOI", "PMID", "Upload file"], horizontal=True)

    if mode == "Text":
        text = st.text_area("Paper text", height=200)
        if st.button("Summarize"):
            with st.spinner("Summarizing..."):
                try:
                    r = requests.post(f"{API}/papers/summarize", json={"text": text}, timeout=60)
                    show_response(r)
                except Exception as exc:
                    st.error(str(exc))
    elif mode == "DOI":
        doi_val = st.text_input("DOI")
        if st.button("Summarize"):
            with st.spinner("Summarizing..."):
                try:
                    r = requests.post(f"{API}/papers/summarize", json={"doi": doi_val}, timeout=60)
                    show_response(r)
                except Exception as exc:
                    st.error(str(exc))
    elif mode == "PMID":
        pmid_val = st.text_input("PMID")
        if st.button("Summarize"):
            with st.spinner("Summarizing..."):
                try:
                    r = requests.post(f"{API}/papers/summarize", json={"pmid": pmid_val}, timeout=60)
                    show_response(r)
                except Exception as exc:
                    st.error(str(exc))
    else:
        f = st.file_uploader("Upload PDF/DOCX/TXT", type=["pdf", "docx", "txt"], key="summarize_upload")
        if f and st.button("Summarize"):
            with st.spinner("Summarizing..."):
                try:
                    files = {"file": (f.name, f.getvalue(), f.type)}
                    r = requests.post(f"{API}/papers/summarize/upload", files=files, timeout=90)
                    show_response(r)
                except Exception as exc:
                    st.error(str(exc))

# --- Citations ---
with tabs[4]:
    st.subheader("Citation Formatter")
    sample_paper = json.dumps(
        [
            {
                "id": "doi:10.1000/xyz123",
                "title": "Insulin Resistance and PCOS: A Review",
                "authors": ["Jane A Doe", "John B Smith"],
                "year": 2021,
                "journal": "Journal of Endocrinology",
                "doi": "10.1000/xyz123",
                "source": "pubmed",
            }
        ],
        indent=2,
    )
    papers_json = st.text_area("Papers (JSON array)", sample_paper, height=200)
    style = st.selectbox("Style", ["apa", "vancouver", "bibtex"])
    if st.button("Format Citations"):
        try:
            papers = json.loads(papers_json)
            r = requests.post(f"{API}/citations/format", json={"papers": papers, "style": style}, timeout=30)
            show_response(r)
        except Exception as exc:
            st.error(str(exc))

# --- Semantic search ---
with tabs[5]:
    st.subheader("Semantic Search (ingested corpus only, no generation)")
    q_sem = st.text_input("Query", "hormone", key="sem_q")
    top_k = st.slider("Top K", 1, 20, 5)
    if st.button("Search Corpus"):
        try:
            r = requests.get(f"{API}/search/semantic", params={"q": q_sem, "top_k": top_k}, timeout=30)
            show_response(r)
        except Exception as exc:
            st.error(str(exc))

# --- Reports ---
with tabs[6]:
    st.subheader("Research Report Generator")
    topic = st.text_input("Topic", "PCOS and insulin resistance")
    auto_search = st.checkbox("Auto search literature", value=True)
    citation_style = st.selectbox("Citation style", ["apa", "vancouver", "bibtex"], key="report_style")
    if st.button("Generate Report"):
        with st.spinner("Generating report (may take a while)..."):
            try:
                r = requests.post(
                    f"{API}/reports/generate",
                    json={"topic": topic, "auto_search": auto_search, "citation_style": citation_style},
                    timeout=120,
                )
                if r.status_code < 400:
                    data = r.json()
                    st.success("Report generated")
                    st.markdown(data["markdown"])
                    with st.expander("References"):
                        for ref in data["references"]:
                            st.markdown(f"- {ref}")
                    with st.expander("Raw JSON"):
                        st.json(data)
                else:
                    st.error(f"HTTP {r.status_code}")
                    st.code(r.text)
            except Exception as exc:
                st.error(str(exc))

# --- Dataset analysis ---
with tabs[7]:
    st.subheader("Dataset Analysis (interprets AI Dev2's dataset summary contract)")
    sample_summary = json.dumps(
        {"dataset_name": "demo", "row_count": 100, "column_count": 3, "detected_features": ["LH", "FSH", "BMI"]},
        indent=2,
    )
    summary_json = st.text_area("Dataset summary (JSON)", sample_summary, height=180)
    if st.button("Interpret Dataset"):
        try:
            summary = json.loads(summary_json)
            r = requests.post(f"{API}/dataset-analysis/interpret", json={"dataset_summary": summary}, timeout=60)
            show_response(r)
        except Exception as exc:
            st.error(str(exc))

# --- Statistics ---
with tabs[8]:
    st.subheader("Statistical Analysis Assistant (upload a real CSV)")
    csv_file = st.file_uploader("Upload CSV", type=["csv"], key="stats_upload")
    include_narrative = st.checkbox("Include AI narrative interpretation", value=True)
    if csv_file and st.button("Analyze CSV"):
        with st.spinner("Analyzing..."):
            try:
                files = {"file": (csv_file.name, csv_file.getvalue(), "text/csv")}
                endpoint = "/statistics/analyze/full" if include_narrative else "/statistics/analyze"
                r = requests.post(f"{API}{endpoint}", files=files, timeout=90)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Evidence ---
with tabs[9]:
    st.subheader("Evidence Summarizer")
    claim = st.text_input("Topic or claim", "metformin and PCOS")
    if st.button("Summarize Evidence"):
        with st.spinner("Gathering evidence..."):
            try:
                r = requests.post(f"{API}/evidence/summarize", json={"topic_or_claim": claim}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Tutor ---
with tabs[10]:
    st.subheader("Student AI Tutor")
    sub_action = st.radio("Action", ["Explain", "Quiz", "Flashcards", "Notes"], horizontal=True)
    tutor_topic = st.text_input("Topic", "PCOS", key="tutor_topic")

    if sub_action == "Explain":
        level = st.selectbox("Level", ["beginner", "intermediate", "advanced"])
        if st.button("Explain"):
            try:
                r = requests.post(f"{API}/tutor/explain", json={"topic": tutor_topic, "level": level}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))
    elif sub_action == "Quiz":
        num_q = st.slider("Number of questions", 1, 10, 5)
        difficulty = st.selectbox("Difficulty", ["easy", "medium", "hard"])
        if st.button("Generate Quiz"):
            try:
                r = requests.post(
                    f"{API}/tutor/quiz",
                    json={"topic": tutor_topic, "num_questions": num_q, "difficulty": difficulty},
                    timeout=60,
                )
                show_response(r)
            except Exception as exc:
                st.error(str(exc))
    elif sub_action == "Flashcards":
        count = st.slider("Number of flashcards", 1, 20, 10)
        if st.button("Generate Flashcards"):
            try:
                r = requests.post(f"{API}/tutor/flashcards", json={"topic": tutor_topic, "count": count}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))
    else:
        if st.button("Generate Notes"):
            try:
                r = requests.post(f"{API}/tutor/notes", json={"topic": tutor_topic}, timeout=60)
                if r.status_code < 400:
                    st.markdown(r.json()["notes_markdown"])
                else:
                    st.error(f"HTTP {r.status_code}")
                    st.code(r.text)
            except Exception as exc:
                st.error(str(exc))

# --- Education ---
with tabs[11]:
    st.subheader("Hormone Education Agent (public Q&A)")
    question = st.text_input("Question", "What is estrogen?")
    if st.button("Ask"):
        try:
            r = requests.post(f"{API}/education/ask", json={"question": question}, timeout=60)
            if r.status_code < 400:
                data = r.json()
                st.markdown(data["answer"])
                st.info(data["disclaimer"])
            else:
                st.error(f"HTTP {r.status_code}")
                st.code(r.text)
        except Exception as exc:
            st.error(str(exc))

# --- Knowledge graph ---
with tabs[12]:
    st.subheader("Biomedical Knowledge Graph")
    kg_action = st.radio("Action", ["Extract", "Entity Lookup", "Ask"], horizontal=True)

    if kg_action == "Extract":
        kg_text = st.text_area("Text to extract entities from", "Insulin resistance is strongly associated with PCOS.")
        kg_source = st.text_input("Source label (optional)", "manual")
        if st.button("Extract Triples"):
            try:
                r = requests.post(f"{API}/kg/extract", json={"text": kg_text, "source": kg_source or None}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))
    elif kg_action == "Entity Lookup":
        entity = st.text_input("Entity name", "PCOS")
        if st.button("Look Up Entity"):
            try:
                r = requests.get(f"{API}/kg/entity/{entity}", timeout=30)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))
    else:
        kg_question = st.text_input("Question", "What is PCOS associated with?", key="kg_question")
        if st.button("Ask Knowledge Graph"):
            try:
                r = requests.post(f"{API}/kg/ask", json={"question": kg_question}, timeout=60)
                show_response(r)
            except Exception as exc:
                st.error(str(exc))

# --- Data Engineering (Role 2) ---
with tabs[13]:
    st.subheader("🧬 Biomedical Data Engineering & Quality Engine (Role 2)")
    st.caption("Upload multiple CSV or Excel datasets for schema matching, automatic merging, missing value detection, benchmark indexing, and AI cleaning recommendations.")

    role2_files = st.file_uploader(
        "Upload one or more CSV or Excel files", 
        type=["csv", "xlsx", "xls"],  # Updated to support Excel files
        accept_multiple_files=True, 
        key="role2_csv_upload"
    )

    if st.button("Process & Validate Datasets", key="role2_process_btn"):
        if not role2_files:
            st.warning("Please upload at least one dataset file (CSV or Excel).")
        else:
            with st.spinner("Merging datasets, running schema checks, calculating metrics & generating suggestions..."):
                try:
                    files_payload = []
                    for f in role2_files:
                        content_type = f.type or mimetypes.guess_type(f.name)[0] or "application/octet-stream"
                        files_payload.append(("files", (f.name, f.getvalue(), content_type)))
                    
                    r = requests.post(f"{API}/dataset/process-and-validate", files=files_payload, timeout=120)
                    
                    if r.status_code == 200:
                        data = r.json()
                        report = data.get("summary") or data.get("validation_report", {})
                        benchmark = data.get("benchmark") or data.get("quality_benchmark", {})
                        suggestions = data.get("recommendations") or data.get("cleaning_suggestions", "")

                        st.success("Processing complete!")

                        # Metrics Dashboard
                        m1, m2, m3, m4 = st.columns(4)
                        m1.metric("Overall Quality Score", f"{benchmark.get('overall_quality_index', 0)}%")
                        m2.metric("Completeness", f"{benchmark.get('completeness_score', 0)}%")
                        m3.metric("Uniqueness", f"{benchmark.get('uniqueness_score', 0)}%")
                        m4.metric("Validity", f"{benchmark.get('validity_score', 0)}%")

                        st.divider()

                        col_a, col_b = st.columns(2)

                        with col_a:
                            st.markdown("### 📊 Dataset Summary")
                            st.json({
                                "Total Rows": report.get("total_rows"),
                                "Total Columns": report.get("total_columns"),
                                "Missing Cells": report.get("missing_cells"),
                                "Missing Percentage": f"{report.get('missing_percentage')}%",
                                "Duplicate Rows": report.get("duplicate_rows")
                            })

                            st.markdown("### 🔍 Missing Values per Column")
                            st.json(report.get("missing_per_column", {}))

                        with col_b:
                            st.markdown("### ⚠️ Biomarker Outlier Detection")
                            anomalies = report.get("biomarker_anomalies", {})
                            if anomalies:
                                st.error(f"Detected out-of-range values in {len(anomalies)} biomarker column(s):")
                                st.json(anomalies)
                            else:
                                st.success("All biomarker values are within normal physiological bounds.")

                        st.divider()

                        st.markdown("### 🤖 AI Data Cleaning Recommendations")
                        st.markdown(suggestions)

                        with st.expander("View Raw API Response"):
                            st.json(data)
                    else:
                        st.error(f"HTTP {r.status_code}")
                        st.code(r.text)

                except Exception as exc:
                    st.error(f"Request failed: {str(exc)}")