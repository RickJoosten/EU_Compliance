"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Shield,
  Clock,
  FileText,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2 as CircleDot,
  Lock,
} from "lucide-react";

interface RequirementItem {
  id: string;
  title: string;
  status: string;
}

interface CategoryData {
  id: string;
  name: string;
  score: number;
  total: number;
  compliant: number;
  requirements: RequirementItem[];
}

interface RegulationData {
  id: string;
  name: string;
  slug: string;
  authority: string;
  category: string;
  officialReference: string | null;
  effectiveDate: string | null;
  scope: string | null;
  score: number;
  total: number;
  compliant: number;
  categories: CategoryData[];
}

interface OrgData {
  name: string;
  slug: string;
  sector: string;
  primaryColor: string;
  logo: string | null;
}

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  regulationId: string | null;
  regulationName: string | null;
}

const sectorLabels: Record<string, string> = {
  GEMEENTE: "Gemeente",
  OVERHEID: "Overheid",
  ONDERWIJS: "Onderwijs",
  ZORG: "Zorg",
  FINANCIEEL: "Financieel",
  OVERIG: "Overig",
};

const categoryIcons: Record<string, string> = {
  GENDER: "⚖️",
  BELONING: "💰",
  DIVERSITEIT: "🌍",
  ESG: "🌱",
  OVERIG: "📋",
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  GENDER: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  BELONING: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  DIVERSITEIT: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  ESG: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  OVERIG: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
};

interface ComplianceCenterClientProps {
  org: OrgData;
  overallScore: number;
  totalRequirements: number;
  totalCompliant: number;
  regulations: RegulationData[];
  documents: DocumentItem[];
  lastUpdated: string | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLIANT") return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />;
  if (status === "IN_PROGRESS") return <CircleDot className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
  if (status === "UNDER_REVIEW") return <Circle className="h-4.5 w-4.5 text-blue-500 shrink-0" />;
  return <Circle className="h-4.5 w-4.5 text-gray-300 shrink-0" />;
}

export function ComplianceCenterClient({
  org,
  overallScore,
  totalRequirements,
  totalCompliant,
  regulations,
  documents,
  lastUpdated,
}: ComplianceCenterClientProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "controls", label: "Controls" },
    ...(documents.length > 0 ? [{ id: "resources", label: "Resources" }] : []),
  ];

  // Group documents by type for resources tab
  const docGroups: Record<string, { label: string; docs: DocumentItem[] }> = {};
  const docTypeOrder = ["POLICY", "REPORT", "CERTIFICATE", "LINK", "OTHER"];
  const docTypeLabels: Record<string, string> = {
    POLICY: "Beleidsdocumenten",
    REPORT: "Rapporten",
    CERTIFICATE: "Certificaten",
    LINK: "Referenties",
    OTHER: "Overig",
  };
  for (const doc of documents) {
    const key = doc.type || "OTHER";
    if (!docGroups[key]) docGroups[key] = { label: docTypeLabels[key] || key, docs: [] };
    docGroups[key].docs.push(doc);
  }

  // Build control categories from all regulation categories
  const allControlCategories = regulations.flatMap((reg) =>
    reg.categories.map((cat) => ({
      ...cat,
      regulationName: reg.name,
      regulationCategory: reg.category,
    }))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner — Clay-style with gradient background */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${org.primaryColor}15 0%, ${org.primaryColor}08 50%, #f0fdf4 100%)`,
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10">
          <h1 className="text-3xl font-bold text-[#1a1a2e] sm:text-4xl">
            {org.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#64748B] leading-relaxed">
            Compliance overzicht voor EU HR-regelgeving. {org.name} werkt actief aan naleving van {regulations.length} richtlijnen op het gebied van gendergelijkheid, belonings­transparantie, diversiteit en duurzaamheid.
          </p>
          {formattedDate && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-[#64748B]">
              <Clock className="h-4 w-4" />
              Laatst bijgewerkt: {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Tab Navigation — Clay-style underline tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-10">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-[#1a1a2e]"
                    : "text-[#94a3b8] hover:text-[#64748B]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a2e] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10">

        {/* === OVERVIEW TAB === */}
        {activeTab === "overview" && (
          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            {/* Left Column — Compliance Badges */}
            <div>
              <h2 className="text-lg font-semibold text-[#1a1a2e] mb-5">Compliance</h2>
              <div className="space-y-3">
                {regulations.map((reg) => {
                  const colors = categoryColors[reg.category] || categoryColors.OVERIG;
                  const icon = categoryIcons[reg.category] || "📋";
                  return (
                    <div
                      key={reg.id}
                      className={`flex items-center gap-3.5 rounded-xl border p-4 ${colors.border} ${colors.bg}`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm text-lg border border-gray-100">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {reg.name}
                        </p>
                        {reg.officialReference && (
                          <p className="text-xs text-[#94a3b8] truncate">
                            {reg.officialReference}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <span className={`text-sm font-bold ${
                          reg.score >= 80 ? "text-emerald-600" : reg.score >= 40 ? "text-amber-600" : "text-red-500"
                        }`}>
                          {reg.score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column — Controls Grid */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#1a1a2e]">Controls</h2>
                {formattedDate && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Updated {formattedDate}
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {allControlCategories.map((cat) => {
                  const visibleReqs = cat.requirements.slice(0, 3);
                  const moreCount = cat.requirements.length - 3;
                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3.5">
                        <h3 className="text-sm font-semibold text-[#1a1a2e]">
                          {cat.name}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-2.5">
                        {visibleReqs.map((req) => (
                          <div key={req.id} className="flex items-start gap-2">
                            <StatusIcon status={req.status} />
                            <span className="text-sm text-[#475569] leading-tight">
                              {req.title}
                            </span>
                          </div>
                        ))}
                      </div>
                      {moreCount > 0 && (
                        <button
                          onClick={() => {
                            setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                          }}
                          className="mt-3 text-xs font-medium text-[#38bdf8] hover:text-[#0ea5e9]"
                        >
                          {expandedCategory === cat.id ? "Minder tonen" : `Bekijk ${moreCount} meer ${cat.name.toLowerCase()} controls`}
                        </button>
                      )}
                      {expandedCategory === cat.id && moreCount > 0 && (
                        <div className="mt-2.5 space-y-2.5 border-t pt-2.5">
                          {cat.requirements.slice(3).map((req) => (
                            <div key={req.id} className="flex items-start gap-2">
                              <StatusIcon status={req.status} />
                              <span className="text-sm text-[#475569] leading-tight">
                                {req.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resources preview on overview */}
            {documents.length > 0 && (
              <div className="lg:col-span-2 mt-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-[#1a1a2e]">Resources</h2>
                  <button
                    onClick={() => setActiveTab("resources")}
                    className="text-xs font-medium text-[#38bdf8] hover:text-[#0ea5e9]"
                  >
                    View all
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documents.slice(0, 6).map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-all hover:shadow-sm hover:border-gray-300"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                        <FileText className="h-4.5 w-4.5 text-[#64748B]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#38bdf8] truncate">
                          {doc.title}
                        </p>
                        {doc.regulationName && (
                          <p className="text-xs text-[#94a3b8] truncate">{doc.regulationName}</p>
                        )}
                      </div>
                      <Lock className="h-4 w-4 text-gray-300 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === CONTROLS TAB === */}
        {activeTab === "controls" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">All Controls</h2>
              <span className="text-sm text-[#64748B]">
                {totalCompliant} of {totalRequirements} compliant
              </span>
            </div>

            <div className="space-y-8">
              {regulations.map((reg) => {
                const colors = categoryColors[reg.category] || categoryColors.OVERIG;
                return (
                  <div key={reg.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${colors.bg}`}>
                        {categoryIcons[reg.category] || "📋"}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#1a1a2e]">{reg.name}</h3>
                        <p className="text-xs text-[#94a3b8]">
                          {reg.compliant} of {reg.total} compliant · {reg.score}%
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {reg.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="rounded-xl border border-gray-200 p-5"
                        >
                          <div className="flex items-center justify-between mb-3.5">
                            <h4 className="text-sm font-semibold text-[#1a1a2e]">
                              {cat.name}
                            </h4>
                            <span className="text-xs text-[#94a3b8]">
                              {cat.compliant}/{cat.total}
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {cat.requirements.map((req) => (
                              <div key={req.id} className="flex items-start gap-2">
                                <StatusIcon status={req.status} />
                                <span className="text-sm text-[#475569] leading-tight">
                                  {req.title}
                                </span>
                              </div>
                            ))}
                            {cat.requirements.length === 0 && (
                              <p className="text-xs text-[#94a3b8] italic">
                                Geen zichtbare vereisten
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === RESOURCES TAB === */}
        {activeTab === "resources" && (
          <div>
            <h2 className="text-lg font-semibold text-[#1a1a2e] mb-6">Resources</h2>
            <div className="space-y-8">
              {docTypeOrder
                .filter((type) => docGroups[type])
                .map((type) => {
                  const group = docGroups[type];
                  return (
                    <div key={type}>
                      <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">{group.label}</h3>
                      <div className="space-y-1">
                        {group.docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-4 w-4 text-[#38bdf8] shrink-0" />
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-[#38bdf8] group-hover:text-[#0ea5e9]">
                                  {doc.title}
                                </span>
                                {doc.description && (
                                  <p className="text-xs text-[#94a3b8] truncate">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <Lock className="h-4 w-4 text-gray-300 shrink-0 ml-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10">
          <p className="text-sm text-[#94a3b8]">
            Powered by{" "}
            <span className="font-semibold text-[#64748B]">RevAct Comply</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
