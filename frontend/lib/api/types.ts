export interface HealthCheckResponse {
  status: string;
  environment: string;
  model: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year?: number | null;
  journal?: string | null;
  abstract?: string | null;
  doi?: string | null;
  pmid?: string | null;
  url?: string | null;
  source: string;
  citation_count?: number | null;
}

export interface LiteratureSearchResponse {
  papers: Paper[];
}

export interface LiteratureIngestRequest {
  doi?: string | null;
  pmid?: string | null;
}

export interface LiteratureIngestResponse {
  paper_id: string;
  chunks_ingested: number;
}

export interface PaperSummarizeRequest {
  doi?: string | null;
  pmid?: string | null;
  text?: string | null;
}

export interface PaperSummary {
  background: string;
  methods: string;
  key_findings: string;
  limitations: string;
  relevance_to_hormonal_health: string;
  plain_language_summary: string;
}

export interface SemanticSearchResult {
  content: string;
  source: string;
  page?: number | null;
  score?: number | null;
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
}

export interface CitationFormatRequest {
  papers: Paper[];
  style?: "apa" | "vancouver" | "bibtex";
}

export interface CitationFormatResponse {
  formatted: string[];
}

export interface ReportGenerateRequest {
  topic: string;
  auto_search?: boolean;
  citation_style?: "apa" | "vancouver" | "bibtex";
}

export interface ReportGenerateResponse {
  markdown: string;
  sources: Paper[];
  references: string[];
}

export interface DatasetSummary {
  dataset_name?: string | null;
  row_count?: number | null;
  column_count?: number | null;
  columns?: Record<string, any>[];
  missing_value_summary?: Record<string, any>;
  detected_features?: string[];
  basic_stats?: Record<string, any>;
  notes?: string | null;
}

export interface DatasetInterpretRequest {
  dataset_summary: DatasetSummary;
}

export interface DatasetInterpretResponse {
  interpretation: string;
}

export interface StatisticalAnalysisResponse {
  dataset_summary: DatasetSummary;
  interpretation: string;
}

export interface EvidenceSummarizeRequest {
  topic_or_claim: string;
}

export interface EvidenceSummarizeResponse {
  claim: string;
  summary: string;
  supporting_sources: Paper[];
  citations: string[];
}

export interface ExplainRequest {
  topic: string;
  level?: "beginner" | "intermediate" | "advanced";
}

export interface ExplainResponse {
  explanation: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizRequest {
  topic: string;
  num_questions?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardSet {
  cards: Flashcard[];
}

export interface FlashcardsRequest {
  topic: string;
  count?: number;
}

export interface NotesRequest {
  topic: string;
}

export interface NotesResponse {
  notes_markdown: string;
}

export interface EducationAskRequest {
  question: string;
}

export interface EducationAskResponse {
  answer: string;
  disclaimer: string;
  related_resources?: string[];
}

export interface KGExtractRequest {
  text: string;
  source?: string | null;
}

export interface KGExtractResponse {
  triples_extracted: number;
}

export interface KGEntityResponse {
  entity: string;
  relations: Record<string, any>[];
}

export interface KGAskRequest {
  question: string;
}

export interface KGAskResponse {
  answer: string;
  facts_used: string[];
}

export interface DocumentUploadResponse {
  filename: string;
  status: string;
  pages: number;
  chunks: number;
}

export interface ChatRequest {
  message: string;
  thread_id?: string;
}

export interface ChatResponse {
  answer: string;
  route_used: string;
  docs_retrieved?: Record<string, any>[] | null;
  citations?: Record<string, any>[] | null;
}

export interface URLResearchRequest {
  url: string;
}

export interface URLResearchResponse {
  url: string;
  title: string;
  content_preview: string;
}
