"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { ComplianceScoreCircle } from "@/components/shared/compliance-score-circle";
import { StoplichtIndicator } from "@/components/shared/stoplicht-indicator";
import {
  ArrowLeft,
  ChevronDown,
  Info,
  Plus,
  Save,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Requirement {
  id: string;
  title: string;
  description: string;
  guidance: string | null;
  evidenceType: string;
  priority: string;
  status: string;
  notes: string;
  actionItemCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  score: number;
  total: number;
  compliant: number;
  requirements: Requirement[];
}

interface RegulationInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  authority: string;
  category: string;
}

interface Props {
  regulation: RegulationInfo;
  categories: Category[];
  overallScore: number;
  isAdmin: boolean;
}

const STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-50 text-[#DC2626] border-red-200",
  MEDIUM: "bg-yellow-50 text-[#D97706] border-yellow-200",
  LOW: "bg-green-50 text-[#059669] border-green-200",
};

export function RegulationDetailClient({
  regulation,
  categories: initialCategories,
  overallScore: initialScore,
  isAdmin,
}: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [overallScore, setOverallScore] = useState(initialScore);
  const [saving, setSaving] = useState<string | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState<Record<string, boolean>>({});
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionRequirementId, setActionRequirementId] = useState<string | null>(
    null
  );
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "MEDIUM",
  });

  const recalculateScores = (cats: Category[]) => {
    const allReqs = cats.flatMap((c) => c.requirements);
    const total = allReqs.length;
    const compliant = allReqs.filter((r) => r.status === "COMPLIANT").length;
    setOverallScore(total > 0 ? Math.round((compliant / total) * 100) : 0);
  };

  const handleStatusChange = async (
    categoryIndex: number,
    reqIndex: number,
    requirementId: string,
    newStatus: string
  ) => {
    setSaving(requirementId);
    try {
      const res = await fetch("/api/dashboard/compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId, status: newStatus }),
      });
      if (res.ok) {
        const updated = [...categories];
        updated[categoryIndex].requirements[reqIndex].status = newStatus;
        // Recalculate category score
        const cat = updated[categoryIndex];
        const catCompliant = cat.requirements.filter(
          (r) => r.status === "COMPLIANT"
        ).length;
        cat.score =
          cat.total > 0
            ? Math.round((catCompliant / cat.total) * 100)
            : 0;
        cat.compliant = catCompliant;
        setCategories(updated);
        recalculateScores(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setSaving(null);
    }
  };

  const handleNotesBlur = async (
    categoryIndex: number,
    reqIndex: number,
    requirementId: string,
    notes: string
  ) => {
    try {
      await fetch("/api/dashboard/compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId,
          status: categories[categoryIndex].requirements[reqIndex].status,
          notes,
        }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  const handleCreateAction = async () => {
    if (!actionForm.title.trim()) return;
    try {
      const res = await fetch("/api/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...actionForm,
          requirementId: actionRequirementId,
          dueDate: actionForm.dueDate || undefined,
        }),
      });
      if (res.ok) {
        setActionDialogOpen(false);
        setActionForm({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          priority: "MEDIUM",
        });
        // Increment action count on the requirement
        if (actionRequirementId) {
          const updated = categories.map((cat) => ({
            ...cat,
            requirements: cat.requirements.map((req) =>
              req.id === actionRequirementId
                ? { ...req, actionItemCount: req.actionItemCount + 1 }
                : req
            ),
          }));
          setCategories(updated);
        }
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link + title */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#334155] mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#334155]">
              {regulation.name}
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              {regulation.description}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-[#64748B]">
              <span>Autoriteit: {regulation.authority}</span>
              <span>Categorie: {regulation.category}</span>
            </div>
          </div>
          <ComplianceScoreCircle score={overallScore} size={100} />
        </div>
      </div>

      {/* Progress per category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voortgang per Categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#334155] truncate">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StoplichtIndicator score={cat.score} />
                    <span className="text-sm font-bold text-[#334155]">
                      {cat.score}%
                    </span>
                  </div>
                </div>
                <Progress value={cat.score} className="h-2" />
                <p className="mt-1.5 text-xs text-[#64748B]">
                  {cat.compliant} / {cat.total} compliant
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements accordion */}
      <div className="space-y-4">
        {categories.map((cat, catIdx) => (
          <Card key={cat.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <StoplichtIndicator score={cat.score} showLabel />
                  <span className="text-sm font-semibold text-[#334155]">
                    {cat.score}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion multiple className="space-y-2">
                {cat.requirements.map((req, reqIdx) => (
                  <AccordionItem
                    key={req.id}
                    value={req.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                        <StatusBadge status={req.status} />
                        <span className="text-sm font-medium text-[#334155] truncate">
                          {req.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${PRIORITY_COLORS[req.priority] || ""}`}
                        >
                          {req.priority}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                      {/* Description */}
                      <p className="text-sm text-[#64748B]">
                        {req.description}
                      </p>

                      {/* Evidence type */}
                      <div className="text-xs text-[#64748B]">
                        Bewijstype:{" "}
                        <span className="font-medium text-[#334155]">
                          {req.evidenceType.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Status dropdown (admin only) */}
                      {isAdmin && (
                        <div className="flex items-center gap-3">
                          <Label className="text-sm text-[#64748B] shrink-0">
                            Status:
                          </Label>
                          <Select
                            value={req.status}
                            onValueChange={(val) =>
                              val && handleStatusChange(catIdx, reqIdx, req.id, val)
                            }
                            disabled={saving === req.id}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {saving === req.id && (
                            <span className="text-xs text-[#64748B]">
                              Opslaan...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <Label className="text-sm text-[#64748B]">
                          Notities
                        </Label>
                        <Textarea
                          className="mt-1"
                          placeholder="Voeg notities toe..."
                          defaultValue={req.notes}
                          rows={2}
                          readOnly={!isAdmin}
                          onBlur={(e) =>
                            isAdmin &&
                            handleNotesBlur(
                              catIdx,
                              reqIdx,
                              req.id,
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {/* Guidance */}
                      {req.guidance && (
                        <div>
                          <button
                            onClick={() =>
                              setGuidanceOpen((prev) => ({
                                ...prev,
                                [req.id]: !prev[req.id],
                              }))
                            }
                            className="flex items-center gap-1.5 text-sm text-[#2E75B6] hover:text-[#1F4E79] font-medium"
                          >
                            <Info className="h-4 w-4" />
                            {guidanceOpen[req.id]
                              ? "Verberg richtlijn"
                              : "Bekijk richtlijn"}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                guidanceOpen[req.id] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {guidanceOpen[req.id] && (
                            <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-[#334155]">
                              {req.guidance}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action item button */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-[#64748B]">
                          {req.actionItemCount} actie-item(s)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionRequirementId(req.id);
                            setActionForm({
                              ...actionForm,
                              title: `Actie: ${req.title}`,
                            });
                            setActionDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Maak actie-item
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Item Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuw Actie-item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={actionForm.title}
                onChange={(e) =>
                  setActionForm({ ...actionForm, title: e.target.value })
                }
                placeholder="Titel van het actie-item"
              />
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Textarea
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm({
                    ...actionForm,
                    description: e.target.value,
                  })
                }
                placeholder="Beschrijving"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verantwoordelijke</Label>
                <Input
                  value={actionForm.assignee}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, assignee: e.target.value })
                  }
                  placeholder="Naam"
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Prioriteit</Label>
              <Select
                value={actionForm.priority}
                onValueChange={(val) =>
                  val && setActionForm({ ...actionForm, priority: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">Hoog</SelectItem>
                  <SelectItem value="MEDIUM">Gemiddeld</SelectItem>
                  <SelectItem value="LOW">Laag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleCreateAction}
                className="bg-[#1F4E79] hover:bg-[#1F4E79]/90"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Aanmaken
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
