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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Save,
  Plus,
  Check,
  X,
  Upload,
  AlertTriangle,
  Globe,
  Trash2,
  Key,
  Loader2,
  Eye,
  ExternalLink,
  FileText,
  Link2,
} from "lucide-react";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  sector: string;
  employeeCount: number | null;
  primaryColor: string | null;
  logo: string | null;
  complianceCenterEnabled: boolean;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  loginMethod: string;
}

interface DomainRow {
  id: string;
  domain: string;
  verified: boolean;
  createdAt: string;
}

interface RequirementRow {
  id: string;
  title: string;
  status: string;
}

interface CategoryRow {
  id: string;
  name: string;
  requirements: RequirementRow[];
}

interface RegulationRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  requirementCategories: CategoryRow[];
}

interface DashboardDataRow {
  id: string;
  category: string;
  year: number;
  importedAt: string;
}

interface ActionPlanTask {
  id: string;
  title: string;
  totalChildren: number;
  doneChildren: number;
}

interface ActionPlanRegulation {
  regulationId: string;
  regulationName: string;
  tasks: ActionPlanTask[];
}

interface OAuthInfo {
  googleClientId: string;
  googleClientSecretMasked: string;
  azureAdClientId: string;
  azureAdClientSecretMasked: string;
  azureAdTenantId: string;
}

interface ComplianceDocRow {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  regulationId: string | null;
  regulationName: string | null;
  isPublic: boolean;
}

const sectorLabels: Record<string, string> = {
  GEMEENTE: "Gemeente",
  OVERHEID: "Overheid",
  ONDERWIJS: "Onderwijs",
  ZORG: "Zorg",
  FINANCIEEL: "Financieel",
  OVERIG: "Overig",
};

const sectors = ["GEMEENTE", "OVERHEID", "ONDERWIJS", "ZORG", "FINANCIEEL", "OVERIG"];

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CLIENT_ADMIN: "Client Admin",
  CLIENT_USER: "Client User",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Niet gestart",
  IN_PROGRESS: "In uitvoering",
  UNDER_REVIEW: "In beoordeling",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Niet compliant",
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  COMPLIANT: "bg-green-100 text-green-700",
  NON_COMPLIANT: "bg-red-100 text-red-700",
};

export function OrganizationDetailClient({
  org,
  users,
  domains: initialDomains,
  autoProvisionSSO: initialAutoProvision,
  assignedRegulationIds,
  allRegulations,
  dashboardData,
  actionPlanData,
  oauthInfo,
  complianceDocs: initialDocs,
}: {
  org: OrgInfo;
  users: UserRow[];
  domains: DomainRow[];
  autoProvisionSSO: boolean;
  assignedRegulationIds: string[];
  allRegulations: RegulationRow[];
  dashboardData: DashboardDataRow[];
  actionPlanData: ActionPlanRegulation[];
  oauthInfo: OAuthInfo;
  complianceDocs: ComplianceDocRow[];
}) {
  const router = useRouter();

  // Org edit state
  const [orgForm, setOrgForm] = useState({
    name: org.name,
    slug: org.slug,
    sector: org.sector,
    employeeCount: org.employeeCount?.toString() || "",
  });
  const [savingOrg, setSavingOrg] = useState(false);

  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT_USER",
  });
  const [savingUser, setSavingUser] = useState(false);
  const [userError, setUserError] = useState("");

  // Regulation checkboxes
  const [selectedRegs, setSelectedRegs] = useState<string[]>(assignedRegulationIds);
  const [savingRegs, setSavingRegs] = useState(false);

  // Dashboard data import
  const [dataForm, setDataForm] = useState({
    category: "",
    year: new Date().getFullYear().toString(),
    data: "",
  });
  const [savingData, setSavingData] = useState(false);
  const [dataError, setDataError] = useState("");

  // Expanded regulation for compliance view
  const [expandedReg, setExpandedReg] = useState<string | null>(null);

  // Domain management
  const [domains, setDomains] = useState<DomainRow[]>(initialDomains);
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);

  // Unlink regulation confirmation
  const [unlinkConfirm, setUnlinkConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // OAuth configuration state
  const [oauthForm, setOauthForm] = useState({
    googleClientId: oauthInfo.googleClientId,
    googleClientSecret: "",
    azureAdClientId: oauthInfo.azureAdClientId,
    azureAdClientSecret: "",
    azureAdTenantId: oauthInfo.azureAdTenantId,
  });
  const [savingOauth, setSavingOauth] = useState(false);
  const [oauthSuccess, setOauthSuccess] = useState(false);
  const [oauthError, setOauthError] = useState("");

  // Compliance Center toggle
  const [complianceCenterEnabled, setComplianceCenterEnabled] = useState(org.complianceCenterEnabled);
  const [savingComplianceCenter, setSavingComplianceCenter] = useState(false);

  const handleToggleComplianceCenter = async () => {
    setSavingComplianceCenter(true);
    try {
      const newValue = !complianceCenterEnabled;
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complianceCenterEnabled: newValue }),
      });
      if (res.ok) {
        setComplianceCenterEnabled(newValue);
      }
    } finally {
      setSavingComplianceCenter(false);
    }
  };

  // Compliance Documents state
  const [docs, setDocs] = useState<ComplianceDocRow[]>(initialDocs);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    title: "",
    url: "",
    description: "",
    type: "LINK",
    regulationId: "",
    isPublic: true,
  });
  const [savingDoc, setSavingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  const docTypeLabels: Record<string, string> = {
    LINK: "Link",
    POLICY: "Beleidsdocument",
    REPORT: "Rapport",
    CERTIFICATE: "Certificaat",
    OTHER: "Overig",
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoc(true);
    setDocError("");
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...docForm,
          regulationId: docForm.regulationId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDocError(data.error || "Fout bij aanmaken");
        return;
      }
      const created = await res.json();
      setDocs((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: created.description,
          url: created.url,
          type: created.type,
          regulationId: created.regulationId,
          regulationName: created.regulation?.name || null,
          isPublic: created.isPublic,
        },
      ]);
      setDocForm({ title: "", url: "", description: "", type: "LINK", regulationId: "", isPublic: true });
      setShowDocForm(false);
    } catch {
      setDocError("Er is een fout opgetreden");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(
        `/api/admin/organizations/${org.id}/documents?docId=${docId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // silent
    }
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      router.refresh();
    } finally {
      setSavingOrg(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    setUserError("");
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setUserError(data.error || "Fout bij aanmaken");
        return;
      }
      setUserForm({ name: "", email: "", password: "", role: "CLIENT_USER" });
      setShowUserForm(false);
      router.refresh();
    } catch {
      setUserError("Er is een fout opgetreden");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveRegs = async () => {
    setSavingRegs(true);
    try {
      await fetch(`/api/admin/organizations/${org.id}/regulations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regulationIds: selectedRegs }),
      });
      router.refresh();
    } finally {
      setSavingRegs(false);
    }
  };

  const handleImportData = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingData(true);
    setDataError("");
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setDataError(data.error || "Fout bij importeren");
        return;
      }
      setDataForm({ category: "", year: new Date().getFullYear().toString(), data: "" });
      router.refresh();
    } catch {
      setDataError("Er is een fout opgetreden");
    } finally {
      setSavingData(false);
    }
  };

  const toggleReg = (id: string) => {
    // If currently assigned, show confirmation before unlinking
    if (selectedRegs.includes(id) && assignedRegulationIds.includes(id)) {
      const reg = allRegulations.find((r) => r.id === id);
      setUnlinkConfirm({ id, name: reg?.name || "" });
      return;
    }
    setSelectedRegs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const confirmUnlink = () => {
    if (unlinkConfirm) {
      setSelectedRegs((prev) => prev.filter((r) => r !== unlinkConfirm.id));
      setUnlinkConfirm(null);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDomain(true);
    setDomainError("");
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDomainError(data.error || "Fout bij toevoegen");
        return;
      }
      const created = await res.json();
      setDomains((prev) => [...prev, created]);
      setNewDomain("");
    } catch {
      setDomainError("Er is een fout opgetreden");
    } finally {
      setSavingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      const res = await fetch(
        `/api/admin/organizations/${org.id}/domains?domainId=${domainId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      }
    } catch {
      // silent
    }
  };

  const handleSaveOauth = async () => {
    setSavingOauth(true);
    setOauthError("");
    setOauthSuccess(false);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleClientId: oauthForm.googleClientId,
          googleClientSecret: oauthForm.googleClientSecret || undefined,
          azureAdClientId: oauthForm.azureAdClientId,
          azureAdClientSecret: oauthForm.azureAdClientSecret || undefined,
          azureAdTenantId: oauthForm.azureAdTenantId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setOauthError(data.error || "Fout bij opslaan");
        return;
      }
      setOauthSuccess(true);
      setOauthForm((f) => ({ ...f, googleClientSecret: "", azureAdClientSecret: "" }));
      router.refresh();
      setTimeout(() => setOauthSuccess(false), 3000);
    } catch {
      setOauthError("Er is een fout opgetreden");
    } finally {
      setSavingOauth(false);
    }
  };

  // Get assigned regulations for compliance view
  const assignedRegs = allRegulations.filter((r) =>
    selectedRegs.includes(r.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">{org.name}</h1>
          <p className="text-sm text-[#64748B]">Organisatie beheer</p>
        </div>
      </div>

      {/* Org Info Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">
            Organisatie informatie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Naam</Label>
              <Input
                value={orgForm.name}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={orgForm.slug}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <select
                value={orgForm.sector}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, sector: e.target.value }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {sectorLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Aantal medewerkers</Label>
              <Input
                type="number"
                value={orgForm.employeeCount}
                onChange={(e) =>
                  setOrgForm((f) => ({ ...f, employeeCount: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveOrg} disabled={savingOrg}>
              <Save className="mr-1.5 h-4 w-4" />
              {savingOrg ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Center (Publiek) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155] flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Compliance Center (Publiek)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B] mb-4">
            Schakel het publieke HR Compliance Center in voor deze organisatie.
            Wanneer ingeschakeld is de compliance status zichtbaar op een openbare pagina.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={complianceCenterEnabled}
                onClick={handleToggleComplianceCenter}
                disabled={savingComplianceCenter}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  complianceCenterEnabled ? "bg-[#059669]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                    complianceCenterEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#334155]">
                {complianceCenterEnabled ? "Ingeschakeld" : "Uitgeschakeld"}
              </span>
              {savingComplianceCenter && (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
              )}
            </div>
            {complianceCenterEnabled && (
              <Link
                href={`/compliance/${org.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F4E79] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Bekijk pagina
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#334155] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Documenten
            </CardTitle>
            <Button size="sm" onClick={() => setShowDocForm(!showDocForm)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Toevoegen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B] mb-4">
            Documenten en links die publiek zichtbaar zijn op het Compliance Center.
          </p>

          {showDocForm && (
            <form onSubmit={handleAddDoc} className="mb-4 space-y-3 rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Titel *</Label>
                  <Input
                    value={docForm.title}
                    onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Naam van het document"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>URL *</Label>
                  <Input
                    value={docForm.url}
                    onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select
                    value={docForm.type}
                    onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {Object.entries(docTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Regulatie (optioneel)</Label>
                  <select
                    value={docForm.regulationId}
                    onChange={(e) => setDocForm((f) => ({ ...f, regulationId: e.target.value }))}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">-- Geen --</option>
                    {allRegulations
                      .filter((r) => selectedRegs.includes(r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Beschrijving (optioneel)</Label>
                <Input
                  value={docForm.description}
                  onChange={(e) => setDocForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Korte beschrijving"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="doc-public"
                  checked={docForm.isPublic}
                  onChange={(e) => setDocForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="doc-public" className="text-sm font-normal">Publiek zichtbaar</Label>
              </div>
              {docError && (
                <p className="text-sm text-red-600">{docError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={savingDoc}>
                  {savingDoc ? "Opslaan..." : "Opslaan"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDocForm(false)}>
                  Annuleren
                </Button>
              </div>
            </form>
          )}

          {docs.length === 0 ? (
            <p className="text-sm text-[#64748B] italic">Nog geen documenten toegevoegd.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4E79]" />
                    <div className="min-w-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#1F4E79] hover:underline"
                      >
                        {doc.title}
                      </a>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {docTypeLabels[doc.type] || doc.type}
                        </Badge>
                        {doc.regulationName && (
                          <span className="text-xs text-[#64748B]">{doc.regulationName}</span>
                        )}
                        {!doc.isPublic && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            Verborgen
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-[#64748B] mt-0.5 truncate">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 shrink-0"
                    onClick={() => handleDeleteDoc(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSO Domain Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155] flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SSO Domeinen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B] mb-4">
            Gebruikers met een e-mailadres op een van deze domeinen worden automatisch
            gekoppeld aan deze organisatie bij SSO-inlog.
          </p>

          {domains.length > 0 && (
            <div className="space-y-2 mb-4">
              {domains.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#64748B]" />
                    <span className="text-sm font-medium text-[#334155]">
                      {d.domain}
                    </span>
                    {d.verified && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Geverifieerd
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDomain(d.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddDomain} className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="bijv. bedrijf.nl"
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" disabled={savingDomain}>
              <Plus className="mr-1 h-4 w-4" />
              {savingDomain ? "Toevoegen..." : "Toevoegen"}
            </Button>
          </form>
          {domainError && (
            <p className="mt-2 text-sm text-red-600">{domainError}</p>
          )}
        </CardContent>
      </Card>

      {/* OAuth / SSO Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155] flex items-center gap-2">
            <Key className="h-5 w-5" />
            SSO Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748B] mb-4">
            Configureer Google OAuth en Microsoft Azure AD voor single sign-on.
            Gebruikers met een gekoppeld domein kunnen inloggen via SSO.
          </p>

          {oauthError && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {oauthError}
            </div>
          )}
          {oauthSuccess && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
              <Check className="h-4 w-4" />
              SSO-instellingen opgeslagen
            </div>
          )}

          {/* Google OAuth */}
          <div className="rounded-lg border p-4 mb-4">
            <h4 className="text-sm font-semibold text-[#334155] mb-3 flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google OAuth
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Client ID</Label>
                <Input
                  value={oauthForm.googleClientId}
                  onChange={(e) => setOauthForm((f) => ({ ...f, googleClientId: e.target.value }))}
                  placeholder="123456789.apps.googleusercontent.com"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Secret</Label>
                <Input
                  type="password"
                  value={oauthForm.googleClientSecret}
                  onChange={(e) => setOauthForm((f) => ({ ...f, googleClientSecret: e.target.value }))}
                  placeholder={oauthInfo.googleClientSecretMasked || "Voer secret in"}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Microsoft Azure AD */}
          <div className="rounded-lg border p-4 mb-4">
            <h4 className="text-sm font-semibold text-[#334155] mb-3 flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 23 23">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
              </svg>
              Microsoft Azure AD
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Client ID</Label>
                <Input
                  value={oauthForm.azureAdClientId}
                  onChange={(e) => setOauthForm((f) => ({ ...f, azureAdClientId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Secret</Label>
                <Input
                  type="password"
                  value={oauthForm.azureAdClientSecret}
                  onChange={(e) => setOauthForm((f) => ({ ...f, azureAdClientSecret: e.target.value }))}
                  placeholder={oauthInfo.azureAdClientSecretMasked || "Voer secret in"}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Tenant ID</Label>
                <Input
                  value={oauthForm.azureAdTenantId}
                  onChange={(e) => setOauthForm((f) => ({ ...f, azureAdTenantId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveOauth} disabled={savingOauth}>
              {savingOauth ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Opslaan...</>
              ) : (
                <><Save className="mr-1.5 h-4 w-4" />SSO Opslaan</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#334155]">Gebruikers</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUserForm(!showUserForm)}
          >
            {showUserForm ? (
              <>
                <X className="mr-1 h-4 w-4" /> Annuleren
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" /> Gebruiker toevoegen
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {showUserForm && (
            <form
              onSubmit={handleAddUser}
              className="mb-4 space-y-3 rounded-lg border bg-gray-50 p-4"
            >
              {userError && (
                <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">
                  {userError}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Naam</Label>
                  <Input
                    value={userForm.name}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Wachtwoord</Label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="CLIENT_USER">Client User</option>
                    <option value="CLIENT_ADMIN">Client Admin</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={savingUser}>
                  {savingUser ? "Toevoegen..." : "Toevoegen"}
                </Button>
              </div>
            </form>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Inlogmethode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-[#64748B]">
                    Geen gebruikers
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-[#64748B]">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#64748B]">
                        {u.loginMethod}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Regulations Assignment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#334155]">
            Toegewezen richtlijnen
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSaveRegs}
            disabled={savingRegs}
          >
            <Save className="mr-1 h-4 w-4" />
            {savingRegs ? "Opslaan..." : "Opslaan"}
          </Button>
        </CardHeader>
        <CardContent>
          {allRegulations.length === 0 ? (
            <p className="text-sm text-[#64748B]">
              Nog geen richtlijnen beschikbaar. Maak eerst richtlijnen aan.
            </p>
          ) : (
            <div className="space-y-2">
              {allRegulations.map((reg) => (
                <label
                  key={reg.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegs.includes(reg.id)}
                    onChange={() => toggleReg(reg.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] accent-[#1F4E79]"
                  />
                  <div>
                    <div className="text-sm font-medium text-[#334155]">
                      {reg.name}
                    </div>
                    <div className="text-xs text-[#64748B]">{reg.category}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Data Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">
            Dashboard Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImportData} className="space-y-4">
            {dataError && (
              <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">
                {dataError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Input
                  value={dataForm.category}
                  onChange={(e) =>
                    setDataForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="bijv. salarisgegevens"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Jaar</Label>
                <Input
                  type="number"
                  value={dataForm.year}
                  onChange={(e) =>
                    setDataForm((f) => ({ ...f, year: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>JSON Data</Label>
              <Textarea
                value={dataForm.data}
                onChange={(e) =>
                  setDataForm((f) => ({ ...f, data: e.target.value }))
                }
                placeholder='{"key": "value", ...}'
                rows={6}
                className="font-mono text-sm"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingData}>
                <Upload className="mr-1.5 h-4 w-4" />
                {savingData ? "Importeren..." : "Importeren"}
              </Button>
            </div>
          </form>

          {dashboardData.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-[#334155]">
                Recente imports
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Jaar</TableHead>
                    <TableHead>Geimporteerd op</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.category}</TableCell>
                      <TableCell>{d.year}</TableCell>
                      <TableCell className="text-[#64748B]">
                        {new Date(d.importedAt).toLocaleDateString("nl-NL")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">
            Compliance Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedRegs.length === 0 ? (
            <p className="text-sm text-[#64748B]">
              Wijs eerst richtlijnen toe om het compliance overzicht te bekijken.
            </p>
          ) : (
            <div className="space-y-3">
              {assignedRegs.map((reg) => (
                <div key={reg.id} className="rounded-lg border">
                  <button
                    onClick={() =>
                      setExpandedReg(expandedReg === reg.id ? null : reg.id)
                    }
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-[#334155]">
                        {reg.name}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {reg.requirementCategories.reduce(
                          (sum, c) => sum + c.requirements.length,
                          0
                        )}{" "}
                        vereisten
                      </div>
                    </div>
                    <span className="text-[#64748B]">
                      {expandedReg === reg.id ? "−" : "+"}
                    </span>
                  </button>
                  {expandedReg === reg.id && (
                    <div className="border-t p-4">
                      {reg.requirementCategories.map((cat) => (
                        <div key={cat.id} className="mb-4 last:mb-0">
                          <h4 className="mb-2 text-sm font-semibold text-[#334155]">
                            {cat.name}
                          </h4>
                          <div className="space-y-1.5">
                            {cat.requirements.map((req) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                              >
                                <span className="text-sm text-[#334155]">
                                  {req.title}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    statusColors[req.status] || statusColors.NOT_STARTED
                                  }`}
                                >
                                  {statusLabels[req.status] || req.status}
                                </span>
                              </div>
                            ))}
                            {cat.requirements.length === 0 && (
                              <p className="text-xs text-[#64748B]">
                                Geen vereisten in deze categorie
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {reg.requirementCategories.length === 0 && (
                        <p className="text-sm text-[#64748B]">
                          Geen categorieën
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Plan Summary (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">Actieplan</CardTitle>
        </CardHeader>
        <CardContent>
          {actionPlanData.length === 0 ? (
            <p className="text-sm text-[#64748B]">
              Er zijn nog geen acties aangemaakt voor deze organisatie.
            </p>
          ) : (
            <div className="space-y-6">
              {actionPlanData.map((regGroup) => (
                <div key={regGroup.regulationId}>
                  <h4 className="text-sm font-semibold text-[#334155] mb-3">
                    {regGroup.regulationName}
                  </h4>
                  <div className="space-y-2">
                    {regGroup.tasks.map((task) => {
                      const pct =
                        task.totalChildren > 0
                          ? Math.round(
                              (task.doneChildren / task.totalChildren) * 100
                            )
                          : 0;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2"
                        >
                          <span className="text-sm text-[#334155] flex-1 min-w-0 truncate">
                            {task.title}
                          </span>
                          {task.totalChildren > 0 ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full bg-[#059669] rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#64748B] whitespace-nowrap">
                                {task.doneChildren}/{task.totalChildren} subtaken
                                afgerond
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#64748B]">
                              Geen subtaken
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unlink regulation confirmation dialog */}
      <Dialog
        open={unlinkConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#D97706]" />
              Richtlijn ontkoppelen
            </DialogTitle>
            <DialogDescription>
              Weet u zeker dat u deze richtlijn wilt ontkoppelen? Alle
              bijbehorende actie-items worden verwijderd.
            </DialogDescription>
          </DialogHeader>
          {unlinkConfirm && (
            <p className="text-sm text-[#334155] font-medium px-1">
              &quot;{unlinkConfirm.name}&quot;
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlinkConfirm(null)}>
              Annuleren
            </Button>
            <Button
              className="bg-[#D97706] hover:bg-[#D97706]/90 text-white"
              onClick={confirmUnlink}
            >
              Ontkoppelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
