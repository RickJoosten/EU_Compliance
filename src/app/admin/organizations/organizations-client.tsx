"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  sector: string;
  employeeCount: number | null;
  userCount: number;
  complianceScore: number;
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

export function OrganizationsClient({
  organizations,
}: {
  organizations: OrgRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sector: "OVERIG",
    employeeCount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
        return;
      }

      setForm({ name: "", slug: "", sector: "OVERIG", employeeCount: "" });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Organisaties</h1>
          <p className="text-sm text-[#64748B]">
            Beheer alle organisaties in het platform
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Nieuwe organisatie
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe organisatie</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="org-name">Naam</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: generateSlug(name),
                    }));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug</Label>
                <Input
                  id="org-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-sector">Sector</Label>
                <select
                  id="org-sector"
                  value={form.sector}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sector: e.target.value }))
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
                <Label htmlFor="org-employees">Aantal medewerkers</Label>
                <Input
                  id="org-employees"
                  type="number"
                  value={form.employeeCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, employeeCount: e.target.value }))
                  }
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Annuleren
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? "Opslaan..." : "Opslaan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Medewerkers</TableHead>
                <TableHead>Compliance Score</TableHead>
                <TableHead className="text-right">Gebruikers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-[#64748B]"
                  >
                    Nog geen organisaties. Klik op &quot;Nieuwe organisatie&quot;
                    om er een toe te voegen.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="font-medium text-[#1F4E79] hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {sectorLabels[org.sector] || org.sector}
                    </TableCell>
                    <TableCell className="text-right text-[#64748B]">
                      {org.employeeCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={org.complianceScore}
                          className="h-2 w-24"
                        />
                        <span className="text-sm font-medium text-[#334155]">
                          {org.complianceScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[#64748B]">
                      {org.userCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
