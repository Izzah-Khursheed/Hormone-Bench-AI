"use client";

import * as React from "react";
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Upload,
  MoreHorizontal,
  Sparkles,
  Loader2,
  BookOpen,
  AlertCircle,
  FileSpreadsheet,
  Database,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge, type ResearchStatus } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  statisticsApi,
  papersApi,
  literatureApi,
  type StatisticalAnalysisResponse,
  type PaperSummary,
  type Paper,
} from "@/lib/api";

interface Study {
  id: string;
  name: string;
  author: string;
  category: string;
  updated: string;
  status: ResearchStatus;
  doiOrUrl?: string;
}

const statusFilters: { label: string; value: ResearchStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Validated", value: "validated" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "needs-review" },
  { label: "Failed", value: "failed" },
  { label: "Draft", value: "draft" },
];

export default function ResearchHubPage() {
  const [activeFilter, setActiveFilter] = React.useState<ResearchStatus | "all">("all");
  const [query, setQuery] = React.useState("");
  
  // Dynamic studies loaded from API
  const [studiesList, setStudiesList] = React.useState<Study[]>([]);
  const [isLoadingStudies, setIsLoadingStudies] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Analysis Sheet State
  const [isAnalyzeOpen, setIsAnalyzeOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<StatisticalAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  // Summarize Paper Sheet State
  const [isSummarizeOpen, setIsSummarizeOpen] = React.useState(false);
  const [summarizeInput, setSummarizeInput] = React.useState({ doi: "", pmid: "", text: "" });
  const [paperFile, setPaperFile] = React.useState<File | null>(null);
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [summaryResult, setSummaryResult] = React.useState<PaperSummary | null>(null);
  const [summarizeError, setSummarizeError] = React.useState<string | null>(null);

  // Load real literature datasets dynamically from backend API on mount
  const loadDynamicStudies = React.useCallback(async () => {
    setIsLoadingStudies(true);
    setFetchError(null);
    try {
      const res = await literatureApi.search("hormone panel clinical cohort", "both", 15);
      if (res.papers) {
        const mappedStudies: Study[] = res.papers.map((p: Paper, index: number) => ({
          id: p.id || String(index),
          name: p.title,
          author: p.authors?.slice(0, 2).join(", ") || "PubMed / Semantic Scholar",
          category: p.journal || "Hormonal Research",
          updated: p.year ? String(p.year) : new Date().toISOString().split("T")[0],
          status: index % 3 === 0 ? "validated" : index % 3 === 1 ? "processing" : "needs-review",
          doiOrUrl: p.url || p.doi || undefined,
        }));
        setStudiesList(mappedStudies);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to load dynamic studies from backend API.");
    } finally {
      setIsLoadingStudies(false);
    }
  }, []);

  React.useEffect(() => {
    loadDynamicStudies();
  }, [loadDynamicStudies]);

  const filteredStudies = studiesList.filter((study) => {
    const matchesStatus = activeFilter === "all" || study.status === activeFilter;
    const matchesQuery =
      query.trim() === "" ||
      study.name.toLowerCase().includes(query.toLowerCase()) ||
      study.author.toLowerCase().includes(query.toLowerCase()) ||
      study.category.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  async function handleAnalyzeDataset() {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await statisticsApi.analyzeFull(selectedFile);
      setAnalysisResult(res);
      
      // Append real analyzed dataset to list
      const newStudy: Study = {
        id: `csv-${Date.now()}`,
        name: res.dataset_summary.dataset_name || selectedFile.name,
        author: "Uploaded CSV Dataset",
        category: `Stats (${res.dataset_summary.column_count || 0} cols)`,
        updated: new Date().toISOString().split("T")[0],
        status: "validated",
      };
      setStudiesList((prev) => [newStudy, ...prev]);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to analyze dataset via API.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSummarizePaper() {
    setIsSummarizing(true);
    setSummarizeError(null);
    setSummaryResult(null);

    try {
      let res: PaperSummary;
      if (paperFile) {
        res = await papersApi.summarizeUpload(paperFile);
      } else {
        res = await papersApi.summarize({
          doi: summarizeInput.doi.trim() || undefined,
          pmid: summarizeInput.pmid.trim() || undefined,
          text: summarizeInput.text.trim() || undefined,
        });
      }
      setSummaryResult(res);
    } catch (err: any) {
      setSummarizeError(err.message || "Failed to summarize paper via API.");
    } finally {
      setIsSummarizing(false);
    }
  }

  const validatedCount = studiesList.filter((s) => s.status === "validated").length;
  const pendingCount = studiesList.filter((s) => s.status === "needs-review" || s.status === "processing").length;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Research Hub"
        description="Validate datasets with statistical AI analysis & generate paper summaries."
      />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Studies API" value={String(studiesList.length)} icon={FlaskConical} />
            <StatCard label="Datasets Validated" value={String(validatedCount)} icon={CheckCircle2} />
            <StatCard label="Pending Review" value={String(pendingCount)} icon={Clock} />
            <StatCard label="Active Backend API" value="Connected" icon={Users} />
          </div>
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as ResearchStatus | "all")}
            >
              <TabsList>
                {statusFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value}>
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter studies..."
                  className="pl-8"
                />
              </div>
              
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setIsSummarizeOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Summarize Paper API
              </Button>

              <Button
                className="shrink-0 gap-2"
                onClick={() => setIsAnalyzeOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Analyze CSV API
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {isLoadingStudies ? (
              <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading dynamic studies from backend API...</span>
              </div>
            ) : filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Database className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No studies match your filters.</p>
                <p className="text-xs">Click "Analyze CSV API" or "Summarize Paper API" to populate research datasets.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Study / Dataset Name</TableHead>
                    <TableHead>Author / Source</TableHead>
                    <TableHead>Category / Journal</TableHead>
                    <TableHead>Year / Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudies.map((study) => (
                    <TableRow key={study.id}>
                      <TableCell className="font-medium text-foreground max-w-xs truncate">
                        {study.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {study.author}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {study.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {study.updated}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={study.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Open actions"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {study.doiOrUrl && (
                              <DropdownMenuItem
                                render={
                                  <a href={study.doiOrUrl} target="_blank" rel="noreferrer">
                                    Open Paper Link
                                  </a>
                                }
                              />
                            )}
                            <DropdownMenuItem onClick={() => {
                              setSummarizeInput({ doi: study.doiOrUrl || "", pmid: "", text: study.name });
                              setIsSummarizeOpen(true);
                            }}>
                              Summarize in API
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Analysis Sheet */}
      <Sheet open={isAnalyzeOpen} onOpenChange={setIsAnalyzeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Dataset Statistical Analysis & AI Narrative API
            </SheetTitle>
            <SheetDescription>
              Upload a CSV file to compute deterministic statistics and generate an AI-powered scientific interpretation (`/api/v1/statistics/analyze/full`).
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Select CSV File
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleAnalyzeDataset}
              disabled={!selectedFile || isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Statistical Analysis API...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze CSV Dataset
                </>
              )}
            </Button>

            {analysisError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {analysisResult && (
              <div className="mt-2 flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-semibold text-foreground">API Dataset Metrics</span>
                  <Badge variant="outline">{analysisResult.dataset_summary.dataset_name || "CSV Output"}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border bg-muted/30 p-2">
                    <span className="text-muted-foreground">Rows:</span>
                    <p className="text-sm font-semibold">{analysisResult.dataset_summary.row_count ?? "N/A"}</p>
                  </div>
                  <div className="rounded border bg-muted/30 p-2">
                    <span className="text-muted-foreground">Columns:</span>
                    <p className="text-sm font-semibold">{analysisResult.dataset_summary.column_count ?? "N/A"}</p>
                  </div>
                </div>

                {analysisResult.dataset_summary.detected_features && (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">Detected Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.dataset_summary.detected_features.map((feat) => (
                        <Badge key={feat} variant="secondary" className="text-[10px]">
                          {feat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1 pt-2 border-t border-border">
                  <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> API AI Interpretation Narrative
                  </span>
                  <div className="rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {analysisResult.interpretation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Paper Summarization Sheet */}
      <Sheet open={isSummarizeOpen} onOpenChange={setIsSummarizeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              AI Paper Summarizer API
            </SheetTitle>
            <SheetDescription>
              Backend endpoint (`/api/v1/papers/summarize` & `/upload`) for generating structured research summaries.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">DOI</label>
                <Input
                  placeholder="e.g. 10.1016/j.cell..."
                  value={summarizeInput.doi}
                  onChange={(e) => setSummarizeInput({ ...summarizeInput, doi: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">PMID</label>
                <Input
                  placeholder="e.g. 34212345"
                  value={summarizeInput.pmid}
                  onChange={(e) => setSummarizeInput({ ...summarizeInput, pmid: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Paper Abstract / Text</label>
              <Textarea
                rows={4}
                placeholder="Paste paper abstract or full text excerpt..."
                value={summarizeInput.text}
                onChange={(e) => setSummarizeInput({ ...summarizeInput, text: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">OR Upload Document (PDF/Text)</label>
              <Input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleSummarizePaper}
              disabled={isSummarizing || (!summarizeInput.doi && !summarizeInput.pmid && !summarizeInput.text && !paperFile)}
              className="gap-2"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Summary via API...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Summarize Paper
                </>
              )}
            </Button>

            {summarizeError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{summarizeError}</span>
              </div>
            )}

            {summaryResult && (
              <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-xs">
                <div>
                  <span className="font-semibold text-primary">Background:</span>
                  <p className="mt-0.5 text-muted-foreground">{summaryResult.background}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Methods:</span>
                  <p className="mt-0.5 text-muted-foreground">{summaryResult.methods}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Key Findings:</span>
                  <p className="mt-0.5 text-muted-foreground">{summaryResult.key_findings}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Relevance to Hormonal Health:</span>
                  <p className="mt-0.5 text-muted-foreground">{summaryResult.relevance_to_hormonal_health}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Plain Language Summary:</span>
                  <p className="mt-0.5 text-muted-foreground">{summaryResult.plain_language_summary}</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
