import { apiFetch } from "./config";
import type {
  HealthCheckResponse,
  LiteratureSearchResponse,
  LiteratureIngestRequest,
  LiteratureIngestResponse,
  PaperSummarizeRequest,
  PaperSummary,
  SemanticSearchResponse,
  CitationFormatRequest,
  CitationFormatResponse,
  ReportGenerateRequest,
  ReportGenerateResponse,
  DatasetSummary,
  DatasetInterpretRequest,
  DatasetInterpretResponse,
  StatisticalAnalysisResponse,
  EvidenceSummarizeRequest,
  EvidenceSummarizeResponse,
  ExplainRequest,
  ExplainResponse,
  QuizRequest,
  Quiz,
  FlashcardsRequest,
  FlashcardSet,
  NotesRequest,
  NotesResponse,
  EducationAskRequest,
  EducationAskResponse,
  KGExtractRequest,
  KGExtractResponse,
  KGEntityResponse,
  KGAskRequest,
  KGAskResponse,
  DocumentUploadResponse,
  ChatRequest,
  ChatResponse,
  URLResearchRequest,
  URLResearchResponse,
} from "./types";

export * from "./config";
export * from "./types";

export const healthApi = {
  check: () => apiFetch<HealthCheckResponse>("/api/v1/health"),
};

export const literatureApi = {
  search: (q: string, source: "pubmed" | "semantic_scholar" | "both" = "both", limit: number = 20) =>
    apiFetch<LiteratureSearchResponse>(
      `/api/v1/literature/search?q=${encodeURIComponent(q)}&source=${source}&limit=${limit}`
    ),
  ingest: (data: LiteratureIngestRequest) =>
    apiFetch<LiteratureIngestResponse>("/api/v1/literature/ingest", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const papersApi = {
  summarize: (data: PaperSummarizeRequest) =>
    apiFetch<PaperSummary>("/api/v1/papers/summarize", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  summarizeUpload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<PaperSummary>("/api/v1/papers/summarize/upload", {
      method: "POST",
      body: formData,
    });
  },
};

export const searchApi = {
  semantic: (q: string, top_k: number = 10) =>
    apiFetch<SemanticSearchResponse>(
      `/api/v1/search/semantic?q=${encodeURIComponent(q)}&top_k=${top_k}`
    ),
};

export const citationsApi = {
  format: (data: CitationFormatRequest) =>
    apiFetch<CitationFormatResponse>("/api/v1/citations/format", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const reportsApi = {
  generate: (data: ReportGenerateRequest) =>
    apiFetch<ReportGenerateResponse>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const statisticsApi = {
  analyze: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<DatasetSummary>("/api/v1/statistics/analyze", {
      method: "POST",
      body: formData,
    });
  },
  analyzeFull: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<StatisticalAnalysisResponse>("/api/v1/statistics/analyze/full", {
      method: "POST",
      body: formData,
    });
  },
  interpret: (data: DatasetInterpretRequest) =>
    apiFetch<DatasetInterpretResponse>("/api/v1/dataset-analysis/interpret", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  processAndValidate: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return apiFetch<unknown>("/api/v1/dataset/process-and-validate", {
      method: "POST",
      body: formData,
    });
  },
};

export const evidenceApi = {
  summarize: (data: EvidenceSummarizeRequest) =>
    apiFetch<EvidenceSummarizeResponse>("/api/v1/evidence/summarize", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const tutorApi = {
  explain: (data: ExplainRequest) =>
    apiFetch<ExplainResponse>("/api/v1/tutor/explain", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  quiz: (data: QuizRequest) =>
    apiFetch<Quiz>("/api/v1/tutor/quiz", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  flashcards: (data: FlashcardsRequest) =>
    apiFetch<FlashcardSet>("/api/v1/tutor/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  notes: (data: NotesRequest) =>
    apiFetch<NotesResponse>("/api/v1/tutor/notes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const educationApi = {
  ask: (data: EducationAskRequest) =>
    apiFetch<EducationAskResponse>("/api/v1/education/ask", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const kgApi = {
  extract: (data: KGExtractRequest) =>
    apiFetch<KGExtractResponse>("/api/v1/kg/extract", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getEntity: (name: string) =>
    apiFetch<KGEntityResponse>(`/api/v1/kg/entity/${encodeURIComponent(name)}`),
  ask: (data: KGAskRequest) =>
    apiFetch<KGAskResponse>("/api/v1/kg/ask", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<DocumentUploadResponse>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
  },
};

export const chatApi = {
  sendMessage: (data: ChatRequest) =>
    apiFetch<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const researchApi = {
  analyzeUrl: (data: URLResearchRequest) =>
    apiFetch<URLResearchResponse>("/api/v1/research/url", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
