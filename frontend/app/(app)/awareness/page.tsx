"use client";

import * as React from "react";
import {
  Clock,
  Sparkles,
  HelpCircle,
  Loader2,
  FileCheck,
  AlertCircle,
  Send,
  ShieldCheck,
  BookOpen,
  Database,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  educationApi,
  evidenceApi,
  literatureApi,
  type EducationAskResponse,
  type EvidenceSummarizeResponse,
  type Paper,
} from "@/lib/api";

const CATEGORIES = [
  "All",
  "Thyroid",
  "Reproductive Health",
  "Metabolic",
  "Stress & Cortisol",
  "Aging",
];

export default function AwarenessPage() {
  const [activeCategory, setActiveCategory] = React.useState("All");

  // Dynamic API articles loaded from backend
  const [articles, setArticles] = React.useState<Paper[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = React.useState(true);
  const [articleError, setArticleError] = React.useState<string | null>(null);

  // Ask AI Education State
  const [question, setQuestion] = React.useState("");
  const [isAsking, setIsAsking] = React.useState(false);
  const [educationResult, setEducationResult] = React.useState<EducationAskResponse | null>(null);
  const [askError, setAskError] = React.useState<string | null>(null);

  // Evidence Summarizer State
  const [evidenceClaim, setEvidenceClaim] = React.useState("");
  const [isEvidenceLoading, setIsEvidenceLoading] = React.useState(false);
  const [evidenceResult, setEvidenceResult] = React.useState<EvidenceSummarizeResponse | null>(null);
  const [evidenceError, setEvidenceError] = React.useState<string | null>(null);

  // Load real educational literature dynamically from backend API on mount
  const loadDynamicArticles = React.useCallback(async () => {
    setIsLoadingArticles(true);
    setArticleError(null);
    try {
      const res = await literatureApi.search("hormone health education clinical evidence", "both", 12);
      setArticles(res.papers || []);
    } catch (err: any) {
      setArticleError(err.message || "Failed to load dynamic articles from backend API.");
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  React.useEffect(() => {
    loadDynamicArticles();
  }, [loadDynamicArticles]);

  async function handleAskEducation() {
    if (!question.trim()) return;
    setIsAsking(true);
    setAskError(null);
    setEducationResult(null);

    try {
      const res = await educationApi.ask({ question: question.trim() });
      setEducationResult(res);
    } catch (err: any) {
      setAskError(err.message || "Failed to get answer from Education Assistant API.");
    } finally {
      setIsAsking(false);
    }
  }

  async function handleSummarizeEvidence() {
    if (!evidenceClaim.trim()) return;
    setIsEvidenceLoading(true);
    setEvidenceError(null);
    setEvidenceResult(null);

    try {
      const res = await evidenceApi.summarize({ topic_or_claim: evidenceClaim.trim() });
      setEvidenceResult(res);
    } catch (err: any) {
      setEvidenceError(err.message || "Failed to summarize evidence via API.");
    } finally {
      setIsEvidenceLoading(false);
    }
  }

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Awareness & Education Center"
        description="Evidence-based education on hormone health powered by trusted AI backend APIs."
      />

      <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
        
        {/* Interactive AI Ask & Evidence Widgets */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Ask AI Health Educator Widget */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Ask AI Health Educator API</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Backend `/api/v1/education/ask` endpoint for grounded medical educational answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. What is the role of progesterone in the luteal phase?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskEducation()}
                />
                <Button
                  onClick={handleAskEducation}
                  disabled={isAsking || !question.trim()}
                  className="gap-2 shrink-0"
                >
                  {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask API
                </Button>
              </div>

              {askError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{askError}</span>
                </div>
              )}

              {educationResult && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <ShieldCheck className="h-4 w-4" /> Backend API Grounded Answer
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{educationResult.answer}</p>

                  <div className="rounded bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    ⚠️ <strong>Disclaimer:</strong> {educationResult.disclaimer}
                  </div>

                  {educationResult.related_resources && educationResult.related_resources.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-border/60">
                      <span className="font-semibold text-muted-foreground">Related Resources:</span>
                      <div className="flex flex-wrap gap-1">
                        {educationResult.related_resources.map((r, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Summarizer Widget */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Scientific Evidence Synthesizer API</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Backend `/api/v1/evidence/summarize` endpoint for claim synthesis across literature.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Does ashwagandha lower morning cortisol levels?"
                  value={evidenceClaim}
                  onChange={(e) => setEvidenceClaim(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSummarizeEvidence()}
                />
                <Button
                  onClick={handleSummarizeEvidence}
                  disabled={isEvidenceLoading || !evidenceClaim.trim()}
                  className="gap-2 shrink-0"
                >
                  {isEvidenceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Synthesize API
                </Button>
              </div>

              {evidenceError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{evidenceError}</span>
                </div>
              )}

              {evidenceResult && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs">
                  <div>
                    <span className="font-semibold text-primary">Target Claim:</span>
                    <p className="font-medium text-foreground mt-0.5">{evidenceResult.claim}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">API Synthesis Summary:</span>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{evidenceResult.summary}</p>
                  </div>
                  {evidenceResult.citations && evidenceResult.citations.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-border/60">
                      <span className="font-semibold text-muted-foreground">Citations:</span>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px]">
                        {evidenceResult.citations.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Navigation */}
        <nav aria-label="Categories" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category
                  ? "text-sm font-semibold text-primary border-b-2 border-primary pb-1"
                  : "text-sm text-muted-foreground transition-colors hover:text-foreground pb-1"
              }
            >
              {category}
            </button>
          ))}
        </nav>

        {articleError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{articleError}</span>
          </div>
        )}

        {/* Featured Article Section (Loaded dynamically from API) */}
        {isLoadingArticles ? (
          <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2 border border-border rounded-xl">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading live educational research articles from backend API...</span>
          </div>
        ) : featuredArticle ? (
          <Card className="overflow-hidden p-0 border-border">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="aspect-video w-full bg-muted/60 lg:aspect-auto flex items-center justify-center text-muted-foreground">
                <BookOpen className="h-12 w-12 opacity-30" />
              </div>
              <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                <span className="text-xs font-medium uppercase tracking-wide text-secondary">
                  Featured Article · {featuredArticle.source}
                </span>
                <h2 className="text-2xl font-medium leading-snug text-foreground sm:text-3xl">
                  {featuredArticle.title}
                </h2>
                <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {featuredArticle.abstract || "No abstract snippet provided by API."}
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <span>{featuredArticle.authors?.slice(0, 2).join(", ") || "PubMed"}</span>
                  <span aria-hidden="true">·</span>
                  <span>Year: {featuredArticle.year || "2026"}</span>
                  {featuredArticle.url && (
                    <>
                      <span aria-hidden="true">·</span>
                      <a href={featuredArticle.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                        Read Source Paper
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center p-8 text-xs text-muted-foreground border border-border rounded-xl">
            No educational articles found in API payload.
          </div>
        )}

        {/* Dynamic Articles Grid */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Live API Educational Articles ({remainingArticles.length})
          </h3>
          {remainingArticles.length === 0 && !isLoadingArticles ? (
            <p className="text-xs text-muted-foreground">No additional articles loaded.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {remainingArticles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden p-0 border-border"
                >
                  <div className="aspect-video w-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-20" />
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {article.journal || article.source}
                    </span>
                    <h4 className="text-base font-medium leading-snug text-foreground line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {article.abstract || "No abstract snippet provided."}
                    </p>
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/40 mt-1">
                      <span className="truncate max-w-[150px]">{article.authors?.slice(0, 1).join("") || "Author"}</span>
                      {article.url && (
                        <a href={article.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] font-medium shrink-0">
                          View API Paper
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
