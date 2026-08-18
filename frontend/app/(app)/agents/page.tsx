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
  BookOpen,
  HelpCircle,
  Layers,
  FileText,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  context: string;
  suggestedActions: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "research",
    name: "Research Agent",
    tagline: "Research & RAG Assistant",
    description: "Synthesizes literature, retrieves context, and answers complex scientific queries.",
    icon: FlaskConical,
    capabilities: ["Literature RAG", "Study Design", "Citation Retrieval"],
    context: "Connected to literature database and RAG vector store.",
    suggestedActions: [
      "Summarize recent cortisol circadian rhythm research",
      "What is the correlation between TSH and BMI in hypothyroidism?",
      "Compare testosterone replacement therapy outcomes",
    ],
  },
  {
    id: "education",
    name: "Hormone Education Agent",
    tagline: "Approachable & safe",
    description: "Explains hormone concepts in plain language with trusted sources and disclaimers.",
    icon: HeartPulse,
    capabilities: ["Plain Language", "Symptom Context", "Evidence Guidelines"],
    context: "Non-diagnostic educational guidance.",
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
    context: "Paced for physiology and endocrinology coursework.",
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
    context: "Built from structured endocrine entity relations.",
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
        text: "Hello! I am your AI Research Agent. I can search literature, analyze research context, and answer scientific inquiries with citations.",
      },
    ],
    education: [
      {
        id: "m-2",
        role: "agent",
        text: "Welcome to the Hormone Education Center. Ask me any question about hormonal health, symptoms, or biology.",
      },
    ],
    tutor: [
      {
        id: "m-3",
        role: "agent",
        text: "Hi! I am your Student Mentor. Ask for a concept explanation, quiz, flashcard set, or study notes!",
      },
    ],
    kg: [
      {
        id: "m-4",
        role: "agent",
        text: "Knowledge Graph Agent active. Ask about entity relationships, pathways, or fact triples.",
      },
    ],
  });

  const [inputMessage, setInputMessage] = React.useState("");
  const [tutorTool, setTutorTool] = React.useState<"chat" | "quiz" | "flashcards" | "notes">("chat");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentAgentDef = AGENTS.find((a) => a.id === selectedAgent)!;
  const currentMessages = messages[selectedAgent] || [];

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
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          citations: res.citations || undefined,
        };
        setMessages((prev) => ({ ...prev, research: [...prev.research, agentMsg] }));
      } else if (selectedAgent === "education") {
        const res = await educationApi.ask({ question: messageText });
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          disclaimer: res.disclaimer,
        };
        setMessages((prev) => ({ ...prev, education: [...prev.education, agentMsg] }));
      } else if (selectedAgent === "kg") {
        const res = await kgApi.ask({ question: messageText });
        const agentMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "agent",
          text: res.answer,
          citations: res.facts_used?.map((f) => ({ fact: f })),
        };
        setMessages((prev) => ({ ...prev, kg: [...prev.kg, agentMsg] }));
      } else if (selectedAgent === "tutor") {
        if (tutorTool === "quiz") {
          const res = await tutorApi.quiz({ topic: messageText, num_questions: 3 });
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: `Generated a 3-question quiz for topic: "${messageText}"`,
            quiz: res.questions,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        } else if (tutorTool === "flashcards") {
          const res = await tutorApi.flashcards({ topic: messageText, count: 4 });
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: `Here is a set of flashcards on "${messageText}":`,
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
          const agentMsg: ChatMessage = {
            id: String(Date.now() + 1),
            role: "agent",
            text: res.explanation,
          };
          setMessages((prev) => ({ ...prev, tutor: [...prev.tutor, agentMsg] }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to get response from AI agent.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="AI Agents Hub"
        description="Interact with specialized research, educational, tutoring, and graph AI agents."
      />

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Agent Selection Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
                      <Icon className="size-4 text-primary" />
                    </div>
                    {isSelected && <Badge variant="default" className="text-[10px]">Active</Badge>}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Playground */}
        <Card className="flex flex-1 flex-col overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-background">
                  {React.createElement(currentAgentDef.icon, { className: "size-5 text-primary" })}
                </div>
                <div>
                  <CardTitle className="text-base">{currentAgentDef.name}</CardTitle>
                  <CardDescription className="text-xs">{currentAgentDef.tagline}</CardDescription>
                </div>
              </div>

              {selectedAgent === "tutor" && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
                  <Button
                    size="sm"
                    variant={tutorTool === "chat" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("chat")}
                    className="h-7 text-xs"
                  >
                    Explain
                  </Button>
                  <Button
                    size="sm"
                    variant={tutorTool === "quiz" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("quiz")}
                    className="h-7 text-xs"
                  >
                    Quiz
                  </Button>
                  <Button
                    size="sm"
                    variant={tutorTool === "flashcards" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("flashcards")}
                    className="h-7 text-xs"
                  >
                    Flashcards
                  </Button>
                  <Button
                    size="sm"
                    variant={tutorTool === "notes" ? "secondary" : "ghost"}
                    onClick={() => setTutorTool("notes")}
                    className="h-7 text-xs"
                  >
                    Notes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            {/* Suggested Prompt Chips */}
            <div className="flex flex-wrap gap-2 border-b border-border/60 bg-muted/10 px-6 py-3">
              <span className="text-xs font-semibold text-muted-foreground self-center">Try asking:</span>
              {currentAgentDef.suggestedActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Chat Thread Area */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 max-h-[450px]">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "agent" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10">
                      <Bot className="size-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-2 rounded-xl p-4 max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/50 border border-border text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {msg.disclaimer && (
                      <div className="mt-1 rounded bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        ⚠️ <strong>Disclaimer:</strong> {msg.disclaimer}
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">Retrieved Context / Facts:</span>
                        {msg.citations.map((c: any, idx: number) => (
                          <div key={idx} className="rounded bg-background p-1.5 border border-border/40">
                            {c.title || c.fact || JSON.stringify(c)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Quiz Component */}
                    {msg.quiz && (
                      <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                        <span className="font-semibold text-xs text-primary">Interactive Quiz:</span>
                        {msg.quiz.map((q, idx) => (
                          <div key={idx} className="flex flex-col gap-2 rounded-lg bg-background p-3 border border-border">
                            <span className="font-medium text-foreground">{idx + 1}. {q.question}</span>
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`rounded p-2 text-xs border ${
                                    optIdx === q.correct_index
                                      ? "border-emerald-500/50 bg-emerald-500/10 font-medium"
                                      : "border-border bg-muted/30"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground italic mt-1">
                              Explanation: {q.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Flashcards Component */}
                    {msg.flashcards && (
                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2">
                        {msg.flashcards.map((fc, idx) => (
                          <div key={idx} className="flex flex-col justify-between rounded-lg border border-primary/30 bg-background p-3">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{currentAgentDef.name} is thinking...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 border-t border-border bg-background p-4">
              <Input
                placeholder={`Ask ${currentAgentDef.name} standard query or prompt...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !inputMessage.trim()}
                className="gap-2 shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
