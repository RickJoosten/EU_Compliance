"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface RequirementData {
  id: string;
  title: string;
  description: string;
  guidance: string | null;
  evidenceType: string;
  priority: string;
  sortOrder: number;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  requirements: RequirementData[];
}

interface RegulationData {
  id: string;
  name: string;
  slug: string;
  description: string;
  authority: string;
  officialReference: string | null;
  effectiveDate: string;
  transpositionDate: string | null;
  scope: string | null;
  applicableSectors: string | null;
  sourceUrl: string | null;
  penaltyInfo: string | null;
  category: string;
  isActive: boolean;
  requirementCategories: CategoryData[];
}

const categoryLabels: Record<string, string> = {
  GENDER: "Gender",
  BELONING: "Beloning",
  DIVERSITEIT: "Diversiteit",
  ESG: "ESG",
  OVERIG: "Overig",
};

const categories = ["GENDER", "BELONING", "DIVERSITEIT", "ESG", "OVERIG"];

const evidenceTypes = ["DOCUMENT", "DATA_ANALYSIS", "POLICY", "TRAINING", "REPORT"];
const priorities = ["HIGH", "MEDIUM", "LOW"];

const priorityLabels: Record<string, string> = {
  HIGH: "Hoog",
  MEDIUM: "Gemiddeld",
  LOW: "Laag",
};

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

export function RegulationDetailClient({
  regulation,
}: {
  regulation: RegulationData;
}) {
  const router = useRouter();

  // Edit regulation info
  const [regForm, setRegForm] = useState({
    name: regulation.name,
    slug: regulation.slug,
    description: regulation.description,
    authority: regulation.authority,
    effectiveDate: regulation.effectiveDate,
    category: regulation.category,
  });
  const [savingReg, setSavingReg] = useState(false);

  // Add category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState("");

  // Expanded categories
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  // Add requirement forms per category
  const [showReqForm, setShowReqForm] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState({
    title: "",
    description: "",
    guidance: "",
    evidenceType: "DOCUMENT",
    priority: "MEDIUM",
  });
  const [savingReq, setSavingReq] = useState(false);
  const [reqError, setReqError] = useState("");

  const handleSaveReg = async () => {
    setSavingReg(true);
    try {
      await fetch(`/api/admin/regulations/${regulation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      router.refresh();
    } finally {
      setSavingReg(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    setCatError("");
    try {
      const res = await fetch(
        `/api/admin/regulations/${regulation.id}/categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setCatError(data.error || "Fout");
        return;
      }
      setCatForm({ name: "", description: "" });
      setShowCatForm(false);
      router.refresh();
    } catch {
      setCatError("Er is een fout opgetreden");
    } finally {
      setSavingCat(false);
    }
  };

  const handleAddRequirement = async (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    setSavingReq(true);
    setReqError("");
    try {
      const res = await fetch(
        `/api/admin/regulations/${regulation.id}/categories/${catId}/requirements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqForm),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setReqError(data.error || "Fout");
        return;
      }
      setReqForm({
        title: "",
        description: "",
        guidance: "",
        evidenceType: "DOCUMENT",
        priority: "MEDIUM",
      });
      setShowReqForm(null);
      router.refresh();
    } catch {
      setReqError("Er is een fout opgetreden");
    } finally {
      setSavingReq(false);
    }
  };

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">
            {regulation.name}
          </h1>
          <p className="text-sm text-[#64748B]">Richtlijn beheer</p>
        </div>
      </div>

      {/* Edit regulation info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">
            Richtlijn informatie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input
                value={regForm.name}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={regForm.slug}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Beschrijving</Label>
              <Textarea
                value={regForm.description}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Autoriteit</Label>
              <Input
                value={regForm.authority}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, authority: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ingangsdatum</Label>
              <Input
                type="date"
                value={regForm.effectiveDate}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, effectiveDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categorie</Label>
              <select
                value={regForm.category}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, category: e.target.value }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveReg} disabled={savingReg}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingReg ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extended regulation info (read-only) */}
      {(regulation.officialReference || regulation.scope || regulation.penaltyInfo || regulation.sourceUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#334155]">
              Aanvullende informatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {regulation.officialReference && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Officiële referentie</p>
                  <p className="mt-1 text-sm text-[#334155]">{regulation.officialReference}</p>
                </div>
              )}
              {regulation.transpositionDate && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Omzettingsdatum</p>
                  <p className="mt-1 text-sm text-[#334155]">{new Date(regulation.transpositionDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              )}
              {regulation.scope && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Scope</p>
                  <p className="mt-1 text-sm text-[#334155]">{regulation.scope}</p>
                </div>
              )}
              {regulation.applicableSectors && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Toepasselijke sectoren</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(JSON.parse(regulation.applicableSectors) as string[]).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {regulation.penaltyInfo && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Sancties</p>
                  <p className="mt-1 text-sm text-[#334155]">{regulation.penaltyInfo}</p>
                </div>
              )}
              {regulation.sourceUrl && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Bron</p>
                  <a href={regulation.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-[#1F4E79] hover:underline break-all">
                    {regulation.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories & Requirements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#334155]">
            Categorieën & Vereisten
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCatForm(!showCatForm)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Categorie toevoegen
          </Button>
        </CardHeader>
        <CardContent>
          {showCatForm && (
            <form
              onSubmit={handleAddCategory}
              className="mb-4 space-y-3 rounded-lg border bg-gray-50 p-4"
            >
              {catError && (
                <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">
                  {catError}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Naam</Label>
                  <Input
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Beschrijving</Label>
                  <Input
                    value={catForm.description}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatForm(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" size="sm" disabled={savingCat}>
                  {savingCat ? "Toevoegen..." : "Toevoegen"}
                </Button>
              </div>
            </form>
          )}

          {regulation.requirementCategories.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#64748B]">
              Nog geen categorieën. Voeg een categorie toe om vereisten te
              beheren.
            </p>
          ) : (
            <div className="space-y-2">
              {regulation.requirementCategories.map((cat) => {
                const isExpanded = expandedCats.includes(cat.id);
                return (
                  <div key={cat.id} className="rounded-lg border">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#64748B]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#64748B]" />
                        )}
                        <div>
                          <div className="font-medium text-[#334155]">
                            {cat.name}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {cat.description} &middot;{" "}
                            {cat.requirements.length} vereisten
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t p-4">
                        {/* Add requirement button */}
                        <div className="mb-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setShowReqForm(
                                showReqForm === cat.id ? null : cat.id
                              )
                            }
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Vereiste toevoegen
                          </Button>
                        </div>

                        {/* Add requirement form */}
                        {showReqForm === cat.id && (
                          <form
                            onSubmit={(e) => handleAddRequirement(e, cat.id)}
                            className="mb-4 space-y-3 rounded-lg border bg-gray-50 p-4"
                          >
                            {reqError && (
                              <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">
                                {reqError}
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <Label>Titel</Label>
                              <Input
                                value={reqForm.title}
                                onChange={(e) =>
                                  setReqForm((f) => ({
                                    ...f,
                                    title: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Beschrijving</Label>
                              <Textarea
                                value={reqForm.description}
                                onChange={(e) =>
                                  setReqForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                  }))
                                }
                                rows={2}
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Richtlijn / Guidance</Label>
                              <Textarea
                                value={reqForm.guidance}
                                onChange={(e) =>
                                  setReqForm((f) => ({
                                    ...f,
                                    guidance: e.target.value,
                                  }))
                                }
                                rows={2}
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Bewijs type</Label>
                                <select
                                  value={reqForm.evidenceType}
                                  onChange={(e) =>
                                    setReqForm((f) => ({
                                      ...f,
                                      evidenceType: e.target.value,
                                    }))
                                  }
                                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                  {evidenceTypes.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Prioriteit</Label>
                                <select
                                  value={reqForm.priority}
                                  onChange={(e) =>
                                    setReqForm((f) => ({
                                      ...f,
                                      priority: e.target.value,
                                    }))
                                  }
                                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                  {priorities.map((p) => (
                                    <option key={p} value={p}>
                                      {priorityLabels[p]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowReqForm(null)}
                              >
                                Annuleren
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={savingReq}
                              >
                                {savingReq ? "Toevoegen..." : "Toevoegen"}
                              </Button>
                            </div>
                          </form>
                        )}

                        {/* Requirements list */}
                        {cat.requirements.length === 0 ? (
                          <p className="text-center text-sm text-[#64748B]">
                            Geen vereisten in deze categorie
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cat.requirements.map((req) => (
                              <div
                                key={req.id}
                                className="rounded-md border bg-white p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-medium text-[#334155]">
                                      {req.title}
                                    </div>
                                    <div className="mt-1 text-xs text-[#64748B]">
                                      {req.description}
                                    </div>
                                    {req.guidance && (
                                      <div className="mt-1 text-xs italic text-[#64748B]">
                                        Guidance: {req.guidance}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {req.evidenceType}
                                    </Badge>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        priorityColors[req.priority] || ""
                                      }`}
                                    >
                                      {priorityLabels[req.priority]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
