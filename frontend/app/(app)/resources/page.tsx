"use client";

import * as React from "react";
import {
  ExternalLink,
  Search,
  Sparkles,
  Loader2,
  Globe,
  Quote,
  AlertCircle,
  Database,
  Plus,
  Copy,
  Check,
  FileText,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  literatureApi,
  citationsApi,
  reportsApi,
  researchApi,
  type Paper,
  type ReportGenerateResponse,
} from "@/lib/api";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = React.useState<"library" | "live-search" | "citations" | "report">("library");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSource, setSelectedSource] = React.useState<"both" | "pubmed" | "semantic_scholar">("both");
  
  // Dynamic Papers Data State (fetched from backend)
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = React.useState(true);
  const [paperError, setPaperError] = React.useState<string | null>(null);

  // Ingestion State
  const [ingestingId, setIngestingId] = React.useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = React.useState<Record<string, string>>({});

  // Citation Formatter State
  const [citationStyle, setCitationStyle] = React.useState<"apa" | "vancouver" | "bibtex">("apa");
  const [formattedCitations, setFormattedCitations] = React.useState<string[]>([]);
  const [isFormatting, setIsFormatting] = React.useState(false);
  const [copiedCitations, setCopiedCitations] = React.useState(false);

  // Report Generator State
  const [reportTopic, setReportTopic] = React.useState("");
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [generatedReport, setGeneratedReport] = React.useState<ReportGenerateResponse | null>(null);
  const [reportError, setReportError] = React.useState<string | null>(null);
  const [copiedReport, setCopiedReport] = React.useState(false);

  // URL Research Sheet State
  const [isUrlSheetOpen, setIsUrlSheetOpen] = React.useState(false);
  const [targetUrl, setTargetUrl] = React.useState("");
  const [isAnalyzingUrl, setIsAnalyzingUrl] = React.useState(false);
  const [urlResult, setUrlResult] = React.useState<{ title: string; preview: string } | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  // Fetch initial real literature dynamically from backend API on mount
  const fetchLiterature = React.useCallback(async (queryToSearch: string) => {
    setIsLoadingPapers(true);
    setPaperError(null);
    try {
      const res = await literatureApi.search(queryToSearch, selectedSource, 20);
      setPapers(res.papers || []);
    } catch (err: any) {
      setPaperError(err.message || "Failed to fetch literature from backend API.");
    } finally {
      setIsLoadingPapers(false);
    }
  }, [selectedSource]);

  React.useEffect(() => {
    fetchLiterature("hormone research");
  }, [fetchLiterature]);

  async function handleLiveSearch() {
    const q = searchQuery.trim() || "hormone research";
    await fetchLiterature(q);
    setActiveTab("live-search");
  }

  async function handleIngestPaper(paper: Paper) {
    setIngestingId(paper.id);
    try {
      const res = await literatureApi.ingest({
        doi: paper.doi || undefined,
        pmid: paper.pmid || undefined,
      });
      setIngestStatus((prev) => ({
        ...prev,
        [paper.id]: `Ingested ${res.chunks_ingested} chunks`,
      }));
    } catch (err: any) {
      setIngestStatus((prev) => ({
        ...prev,
        [paper.id]: `Ingest failed: ${err.message}`,
      }));
    } finally {
      setIngestingId(null);
    }
  }

  async function handleFormatCitations() {
    if (papers.length === 0) return;
    setIsFormatting(true);
    try {
      const res = await citationsApi.format({
        papers: papers.slice(0, 10),
        style: citationStyle,
      });
      setFormattedCitations(res.formatted || []);
    } catch (err: any) {
      setPaperError(err.message || "Failed to format citations.");
    } finally {
      setIsFormatting(false);
    }
  }

  async function handleGenerateReport() {
    if (!reportTopic.trim()) return;
    setIsGeneratingReport(true);
    setReportError(null);
    setGeneratedReport(null);

    try {
      const res = await reportsApi.generate({
        topic: reportTopic.trim(),
        auto_search: true,
        citation_style: citationStyle,
      });
      setGeneratedReport(res);
    } catch (err: any) {
      setReportError(err.message || "Failed to generate AI report.");
    } finally {
      setIsGeneratingReport(false);
    }
  }

  async function handleAnalyzeUrl() {
    if (!targetUrl.trim()) return;
    setIsAnalyzingUrl(true);
    setUrlError(null);
    setUrlResult(null);

    try {
      const res = await researchApi.analyzeUrl({ url: targetUrl.trim() });
      setUrlResult({ title: res.title, preview: res.content_preview });
    } catch (err: any) {
      setUrlError(err.message || "Failed to analyze URL.");
    } finally {
      setIsAnalyzingUrl(false);
    }
  }

  const copyToClipboard = (text: string, type: "citations" | "report") => {
    navigator.clipboard.writeText(text);
    if (type === "citations") {
      setCopiedCitations(true);
      setTimeout(() => setCopiedCitations(false), 2000);
    } else {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Resource Library & Literature"
        description="Search PubMed & Semantic Scholar, format citations, and generate AI research reports."
      />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        
        {/* Search & Actions Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search PubMed & Semantic Scholar APIs..."
              className="pl-9 pr-24 text-xs sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLiveSearch()}
            />
            <Button
              size="sm"
              onClick={handleLiveSearch}
              disabled={isLoadingPapers}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 gap-1 text-xs"
            >
              {isLoadingPapers ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search API"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedSource} onValueChange={(val: any) => setSelectedSource(val)}>
              <SelectTrigger className="w-44 text-xs">
                <SelectValue placeholder="Source API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both (PubMed + Semantic)</SelectItem>
                <SelectItem value="pubmed">PubMed API</SelectItem>
                <SelectItem value="semantic_scholar">Semantic Scholar API</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="gap-2 text-xs"
              onClick={() => setIsUrlSheetOpen(true)}
            >
              <Globe className="h-4 w-4 text-primary" />
              Analyze Web URL
            </Button>
          </div>
        </div>

        {paperError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{paperError}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="library">Live API Corpus ({papers.length})</TabsTrigger>
            <TabsTrigger value="live-search">Search Stream</TabsTrigger>
            <TabsTrigger value="citations">Citation Formatter</TabsTrigger>
            <TabsTrigger value="report">AI Report Generator</TabsTrigger>
          </TabsList>

          {/* Dynamic API Library Index Tab */}
          <TabsContent value="library" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-xs">
              {isLoadingPapers ? (
                <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Fetching live paper metadata from backend API...</span>
                </div>
              ) : papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Database className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No live papers returned from backend API.</p>
                  <p className="text-xs">Type a query in the search bar above to fetch live data.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paper Title</TableHead>
                      <TableHead>Authors</TableHead>
                      <TableHead>Year / Journal</TableHead>
                      <TableHead>Source API</TableHead>
                      <TableHead>DOI / PMID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {papers.map((paper) => (
                      <TableRow key={paper.id}>
                        <TableCell className="max-w-xs font-medium text-foreground text-xs sm:text-sm">
                          {paper.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {paper.authors?.slice(0, 2).join(", ")}
                          {paper.authors && paper.authors.length > 2 ? " et al." : ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {paper.year || "N/A"} {paper.journal ? `· ${paper.journal}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {paper.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {paper.doi || paper.pmid || paper.id}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleIngestPaper(paper)}
                              disabled={ingestingId === paper.id}
                              className="text-[11px] gap-1"
                            >
                              {ingestingId === paper.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              Ingest
                            </Button>

                            {paper.url && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                render={
                                  <a href={paper.url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                }
                              />
                            )}
                          </div>
                          {ingestStatus[paper.id] && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                              {ingestStatus[paper.id]}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Search Stream Tab */}
          <TabsContent value="live-search" className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Returned {papers.length} live papers from backend API
                </span>
                <Button size="sm" variant="outline" onClick={handleFormatCitations} disabled={isFormatting || papers.length === 0}>
                  {isFormatting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Quote className="h-3 w-3 mr-1" />}
                  Format Citations ({citationStyle.toUpperCase()})
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {papers.map((paper) => (
                  <div key={paper.id} className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-colors shadow-xs">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold leading-snug text-foreground">{paper.title}</h4>
                        <Badge variant="secondary" className="shrink-0 text-[10px] uppercase font-mono">
                          {paper.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{paper.abstract || "No abstract provided in API payload."}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[200px]">{paper.authors?.slice(0, 2).join(", ")} ({paper.year || "N/A"})</span>
                      {paper.url && (
                        <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium shrink-0">
                          View Paper <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Citations Formatter Tab */}
          <TabsContent value="citations" className="mt-4">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">API Citation Formatter</h3>
                <p className="text-xs text-muted-foreground">
                  Format search results into standard academic citation styles.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground">Style:</label>
                <Select value={citationStyle} onValueChange={(val: any) => setCitationStyle(val)}>
                  <SelectTrigger className="w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apa">APA Style</SelectItem>
                    <SelectItem value="vancouver">Vancouver Style</SelectItem>
                    <SelectItem value="bibtex">BibTeX</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleFormatCitations} disabled={isFormatting || papers.length === 0} className="text-xs">
                  {isFormatting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Quote className="h-4 w-4 mr-1" />}
                  Format ({papers.length} Papers)
                </Button>

                {formattedCitations.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(formattedCitations.join("\n\n"), "citations")}
                    className="text-xs gap-1 ml-auto"
                  >
                    {copiedCitations ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCitations ? "Copied!" : "Copy All Citations"}
                  </Button>
                )}
              </div>

              {formattedCitations.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg bg-muted/40 p-4 border border-border">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Backend API Formatted Output ({citationStyle.toUpperCase()})
                  </span>
                  <div className="flex flex-col gap-2 font-mono text-xs text-foreground">
                    {formattedCitations.map((cite, i) => (
                      <div key={i} className="p-2.5 bg-background rounded border border-border/60">
                        {cite}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Report Generator Tab */}
          <TabsContent value="report" className="mt-4">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">Auto Research Report Generator API</h3>
                <p className="text-xs text-muted-foreground">
                  Sends topic to `/api/v1/reports/generate` for full scientific synthesis.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="e.g. Cortisol Awakening Response and Metabolic Markers"
                  value={reportTopic}
                  onChange={(e) => setReportTopic(e.target.value)}
                  className="text-xs sm:text-sm"
                />
                <Button onClick={handleGenerateReport} disabled={isGeneratingReport || !reportTopic.trim()} className="gap-2 shrink-0 text-xs sm:text-sm">
                  {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Report
                </Button>
              </div>

              {reportError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {generatedReport && (
                <div className="mt-2 flex flex-col gap-4 rounded-lg border border-border bg-background p-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Backend API Report Output
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{generatedReport.sources?.length || 0} Sources Cited</Badge>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedReport.markdown, "report")}
                        className="gap-1 text-xs"
                      >
                        {copiedReport ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copiedReport ? "Copied Markdown!" : "Copy Report"}
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-xs text-foreground leading-relaxed">
                    {generatedReport.markdown}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Web URL Research Sheet */}
      <Sheet open={isUrlSheetOpen} onOpenChange={setIsUrlSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5 text-primary" />
              Web URL Research Extractor API
            </SheetTitle>
            <SheetDescription>
              Backend URL scraping & context extraction endpoint (`/api/v1/research/url`).
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Target Web URL</label>
              <Input
                placeholder="https://example.com/article"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>

            <Button onClick={handleAnalyzeUrl} disabled={isAnalyzingUrl || !targetUrl.trim()} className="gap-2">
              {isAnalyzingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Fetch & Analyze URL
            </Button>

            {urlError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            {urlResult && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-xs">
                <div>
                  <span className="font-semibold text-primary">Page Title:</span>
                  <p className="font-medium text-foreground mt-0.5">{urlResult.title}</p>
                </div>
                <div>
                  <span className="font-semibold text-primary">Content Preview:</span>
                  <div className="mt-1 rounded bg-muted p-3 text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono text-[11px]">
                    {urlResult.preview}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
