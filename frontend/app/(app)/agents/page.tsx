"use client";

import * as React from "react";
import {
  ChartSpline,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  Key,
  ExternalLink,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  chatApi,
  tutorApi,
  educationApi,
  kgApi,
  type QuizQuestion,
  type Flashcard,
} from "@/lib/api";

type AgentType = "research" | "education" | "tutor" | "kg";

interface AgentDef {
  id: AgentType;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  capabilities: string[];
  suggestedActions: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "research",
    name: "Research Agent",
    tagline: "RAG Literature Assistant",
    description: "Synthesizes literature, retrieves context, and answers complex scientific queries with citations.",
    icon: FlaskConical,
    capabilities: ["Literature RAG", "Study Design", "Citation Search"],
    suggestedActions: [
      "Summarize recent cortisol circadian rhythm research",
      "What is the correlation between TSH and BMI?",
      "Compare testosterone replacement therapy outcomes",
    ],
  },
  {
    id: "education",
    name: "Hormone Education Agent",
    tagline: "Approachable & safe",
    description: "Explains hormone concepts in plain language with trusted source citations and medical disclaimers.",
    icon: HeartPulse,
    capabilities: ["Plain Language", "Symptom Context", "Evidence Guidelines"],
    suggestedActions: [
      "Why does cortisol peak in the morning?",
      "What affects thyroid hormone levels?",
      "Explain estrogen's role across the menstrual cycle",
    ],
  },
  {
    id: "tutor",
    name: "Student Mentor",
    tagline: "Educational guidance & study tools",
    description: "Generates interactive quizzes, flashcards, study notes, and concept explanations.",
    icon: GraduationCap,
    capabilities: ["Quiz Generation", "Flashcard Sets", "Study Notes"],
    suggestedActions: [
      "Quiz me on thyroid hormone regulation",
      "Generate flashcards for the HPA axis feedback loop",
      "Explain negative vs positive feedback in endocrinology",
    ],
  },
  {
    id: "kg",
    name: "Knowledge Graph Agent",
    tagline: "Structured entity reasoning",
    description: "Queries knowledge graph triples to uncover hormone-gene-symptom relationships.",
    icon: ChartSpline,
    capabilities: ["Entity Lookup", "Fact Triplets", "Graph Q&A"],
    suggestedActions: [
      "What pathways relate Cortisol to Insulin Resistance?",
      "List entity relations for Thyroid Stimulating Hormone",
      "How does Estradiol interact with Progesterone receptors?",
    ],
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  isUnavailableModel?: boolean;
  citations?: any[];
  disclaimer?: string;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentType>("research");
  const [messages, setMessages] = React.useState<Record<AgentType, ChatMessage[]>>({
    research: [
      {
        id: "m-1",
        role: "agent",
        text: "Hello! I am your AI Research Agent. Ask me anything about hormonal research, literature synthesis, or clinical cohorts.",
      },
    ],
    education: [
      {
        id: "m-2",
        role: "agent",
        text: "Welcome to the Hormone Education Center. Ask any question about biology, symptoms, or hormone regulation.",
      },
    ],
    tutor: [
      {
        id: "m-3",
        role: "agent",
        text: "Hi! I am your Student Mentor. Ask for concept explanations, interactive quizzes, flashcards, or study notes!",
      },
    ],
    kg: [
      {
        id: "m-4",
        role: "agent",
        text: "Knowledge Graph Agent active. Query entity relationships, fact triples, and biological pathways.",
      },
    ],
  });

  const [inputMessage, setInputMessage] = React.useState("");
  const [tutorTool, setTutorTool] = React.useState<"chat" | "quiz" | "flashcards" | "notes">("chat");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const currentAgentDef = AGENTS.find((a) => a.id === selectedAgent)!;
  const currentMessages = messages[selectedAgent] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  async function handleSend(textToSend?: string) {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: messageText,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), userMsg],
    }));
    if (!textToSend) setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      if (selectedAgent === "research") {
        const res = await chatApi.sendMessage({ message: messageText });
        const isUnavailable = res.answer?.toLowerCase().includes("model is currently unavailable");
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          isUnavailableModel: isUnavailable,
          citations: res.citations || undefined,
        };
        setMessages((prev) => ({ ...prev, research: [...prev.research, agentMsg] }));
      } else if (selectedAgent === "education") {
        const res = await educationApi.ask({ question: messageText });
        const isUnavailable = res.answer?.toLowerCase().includes("model is currently unavailable");
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          isUnavailableModel: isUnavailable,
          disclaimer: res.disclaimer,
        };
        setMessages((prev) => ({ ...prev, education: [...prev.education, agentMsg] }));
      } else if (selectedAgent === "kg") {
        const res = await kgApi.ask({ question: messageText });
        const isUnavailable = res.answer?.toLowerCase().includes("model is currently unavailable");
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          isUnavailableModel: isUnavailable,
          citations: res.facts_used?.map((f) => ({ fact: f })),
        };
        setMessages((prev) => ({ ...prev, kg: [...prev.kg, agentMsg] }));
      } else if (selectedAgent === "tutor") {
        if (tutorTool === "quiz") {
          const res = await tutorApi.quiz({ topic: messageText, num_questions: 3 });
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: `Generated interactive quiz for "${messageText}":`,
            quiz: res.questions,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        } else if (tutorTool === "flashcards") {
          const res = await tutorApi.flashcards({ topic: messageText, count: 4 });
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: `Flashcard set for "${messageText}":`,
            flashcards: res.cards,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        } else if (tutorTool === "notes") {
          const res = await tutorApi.notes({ topic: messageText });
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: res.notes_markdown,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        } else {
          const res = await tutorApi.explain({ topic: messageText });
          const isUnavailable = res.explanation?.toLowerCase().includes("model is currently unavailable");
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: res.explanation,
            isUnavailableModel: isUnavailable,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with agent endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <AppHeader
        title="AI Agents Hub"
        description="Interact with specialized research, educational, tutoring, and graph AI agents."
      />

      <div className="flex flex-1 flex-col gap-4 p-3 sm:p-6 overflow-y-auto">
        {/* Responsive Agent Selection Cards Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex flex-col justify-between text-left rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                    : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-muted/50">
                      <Icon className="size-4 text-primary" />
                    </div>
                    {isSelected && <Badge variant="default" className="text-[9px] h-4">Active</Badge>}
                  </div>
                  <h3 className="font-semibold text-xs text-foreground mt-1">{agent.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">{agent.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Interactive Playground */}
        <Card className="flex flex-1 flex-col overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/80 bg-muted/20 px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-xs">
                  {React.createElement(currentAgentDef.icon, { className: "size-4 text-primary" })}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{currentAgentDef.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{currentAgentDef.tagline}</CardDescription>
                </div>
              </div>

              {selectedAgent === "tutor" && (
                <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background p-1 text-xs self-start sm:self-auto">
                  <Button
                    size="xs"
                    variant={tutorTool === "chat" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("chat")}
                    className="h-6 text-[11px]"
                  >
                    Explain
                  </Button>
                  <Button
                    size="xs"
                    variant={tutorTool === "quiz" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("quiz")}
                    className="h-6 text-[11px]"
                  >
                    Quiz
                  </Button>
                  <Button
                    size="xs"
                    variant={tutorTool === "flashcards" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("flashcards")}
                    className="h-6 text-[11px]"
                  >
                    Flashcards
                  </Button>
                  <Button
                    size="xs"
                    variant={tutorTool === "notes" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("notes")}
                    className="h-6 text-[11px]"
                  >
                    Notes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0 overflow-hidden">
            {/* Suggested Prompt Chips */}
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/10 px-4 sm:px-6 py-2.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Try asking:</span>
              {currentAgentDef.suggestedActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-border active:scale-95"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Chat Thread Area */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6 min-h-[350px] max-h-[500px]">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 text-xs ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "agent" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10">
                      <Bot className="size-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-2 rounded-2xl p-3.5 max-w-[90%] sm:max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                        : "bg-muted/50 border border-border/80 text-foreground rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Friendly Alert when Backend LLM Key is not set on Render */}
                    {msg.isUnavailableModel && (
                      <div className="mt-1 flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Key className="h-3.5 w-3.5 shrink-0" />
                          Backend LLM API Key Notice
                        </div>
                        <p className="text-[11px] leading-normal opacity-90">
                          Your backend server on Render is online, but <strong>GROQ_API_KEY</strong> or <strong>OPENAI_API_KEY</strong> is not configured in your Render project environment variables.
                        </p>
                        <a
                          href="https://dashboard.render.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary underline hover:opacity-80"
                        >
                          Configure API key on Render Dashboard <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {msg.disclaimer && (
                      <div className="mt-1 rounded bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        ⚠️ <strong>Disclaimer:</strong> {msg.disclaimer}
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">Retrieved Context / Facts:</span>
                        {msg.citations.map((c: any, idx: number) => (
                          <div key={idx} className="rounded bg-background p-1.5 border border-border/40 font-mono text-[10px]">
                            {c.title || c.fact || JSON.stringify(c)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Quiz Component */}
                    {msg.quiz && (
                      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
                        <span className="font-semibold text-xs text-primary">Interactive Quiz:</span>
                        {msg.quiz.map((q, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 rounded-lg bg-background p-3 border border-border">
                            <span className="font-medium text-foreground text-xs">{idx + 1}. {q.question}</span>
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`rounded p-2 text-[11px] border ${
                                    optIdx === q.correct_index
                                      ? "border-emerald-500/50 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300"
                                      : "border-border/60 bg-muted/30"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">
                              Explanation: {q.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Flashcards Component */}
                    {msg.flashcards && (
                      <div className="mt-2 grid grid-cols-1 gap-2 border-t border-border pt-2 sm:grid-cols-2">
                        {msg.flashcards.map((fc, idx) => (
                          <div key={idx} className="flex flex-col justify-between rounded-lg border border-primary/30 bg-background p-2.5">
                            <span className="font-semibold text-primary text-[11px]">Front: {fc.front}</span>
                            <Separator className="my-1.5" />
                            <span className="text-muted-foreground text-[11px]">Back: {fc.back}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                      U
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{currentAgentDef.name} is communicating with backend API...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 border-t border-border/80 bg-background p-3 sm:p-4">
              <Input
                placeholder={`Ask ${currentAgentDef.name} standard query or prompt...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="text-xs sm:text-sm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !inputMessage.trim()}
                className="gap-1.5 shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
