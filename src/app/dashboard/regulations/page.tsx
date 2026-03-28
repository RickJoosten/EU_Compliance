"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ComplianceScoreCircle } from "@/components/shared/compliance-score-circle";
import { StoplichtIndicator } from "@/components/shared/stoplicht-indicator";
import {
  ArrowRight,
  Calendar,
  Scale,
  Loader2,
  FileText,
} from "lucide-react";

interface RegCategory {
  id: string;
  name: string;
  score: number;
  total: number;
  compliant: number;
}

interface Regulation {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  officialReference: string | null;
  effectiveDate: string | null;
  scope: string | null;
  score: number;
  totalRequirements: number;
  compliantRequirements: number;
  categories: RegCategory[];
}

const categoryLabels: Record<string, string> = {
  GENDER: "Gender",
  BELONING: "Beloning",
  DIVERSITEIT: "Diversiteit",
  ESG: "ESG",
  OVERIG: "Overig",
};

const categoryColors: Record<string, string> = {
  GENDER: "bg-purple-100 text-purple-800",
  BELONING: "bg-blue-100 text-blue-800",
  DIVERSITEIT: "bg-orange-100 text-orange-800",
  ESG: "bg-green-100 text-green-800",
  OVERIG: "bg-gray-100 text-gray-800",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export default function RegulationsOverviewPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/regulations");
        if (res.ok) {
          setRegulations(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
      </div>
    );
  }

  const overallTotal = regulations.reduce((sum, r) => sum + r.totalRequirements, 0);
  const overallCompliant = regulations.reduce((sum, r) => sum + r.compliantRequirements, 0);
  const overallScore = overallTotal > 0 ? Math.round((overallCompliant / overallTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#334155]">Regelgeving</h1>
        <p className="text-sm text-[#64748B]">
          Overzicht van alle EU-richtlijnen en Nederlandse wetten waaraan uw organisatie moet voldoen
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <ComplianceScoreCircle score={overallScore} size={64} />
            <div>
              <p className="text-sm text-[#64748B]">Totale compliance</p>
              <p className="text-xl font-bold text-[#334155]">{overallScore}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1F4E79]/10">
              <FileText className="h-6 w-6 text-[#1F4E79]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Richtlijnen</p>
              <p className="text-xl font-bold text-[#334155]">{regulations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#059669]/10">
              <Scale className="h-6 w-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Vereisten voldaan</p>
              <p className="text-xl font-bold text-[#334155]">{overallCompliant} / {overallTotal}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regulation cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {regulations.map((reg) => {
          const isEffective = reg.effectiveDate && new Date(reg.effectiveDate) <= new Date();
          return (
            <Link key={reg.id} href={`/dashboard/regulations/${reg.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <Badge className={`text-xs ${categoryColors[reg.category] || categoryColors.OVERIG}`}>
                          {categoryLabels[reg.category] || reg.category}
                        </Badge>
                        {reg.effectiveDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                            <Calendar className="h-3 w-3" />
                            {isEffective ? "Van kracht sinds" : "Van kracht per"} {formatDate(reg.effectiveDate)}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base text-[#334155] leading-tight">
                        {reg.name}
                      </CardTitle>
                      {reg.officialReference && (
                        <p className="mt-0.5 text-xs text-[#64748B]">{reg.officialReference}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <ComplianceScoreCircle score={reg.score} size={56} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[#64748B] line-clamp-2">
                    {reg.description}
                  </p>

                  {reg.scope && (
                    <p className="text-xs text-[#64748B] bg-[#F8FAFC] rounded px-2 py-1">
                      <span className="font-medium">Scope:</span> {reg.scope}
                    </p>
                  )}

                  {/* Category progress bars */}
                  <div className="space-y-2">
                    {reg.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <StoplichtIndicator score={cat.score} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-xs text-[#64748B]">
                          {cat.name}
                        </span>
                        <span className="text-xs font-medium text-[#334155] tabular-nums w-8 text-right">
                          {cat.score}%
                        </span>
                        <div className="w-20">
                          <Progress value={cat.score} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-xs text-[#64748B]">
                      {reg.compliantRequirements} van {reg.totalRequirements} vereisten voldaan
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#64748B]" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
