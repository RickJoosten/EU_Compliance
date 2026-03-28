"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

interface RegRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  authority: string;
  officialReference: string | null;
  effectiveDate: string;
  scope: string | null;
  isActive: boolean;
  requirementCount: number;
}

const categoryLabels: Record<string, string> = {
  GENDER: "Gender",
  BELONING: "Beloning",
  DIVERSITEIT: "Diversiteit",
  ESG: "ESG",
  OVERIG: "Overig",
};

const categories = ["GENDER", "BELONING", "DIVERSITEIT", "ESG", "OVERIG"];

export function RegulationsClient({
  regulations,
}: {
  regulations: RegRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    authority: "",
    effectiveDate: "",
    category: "OVERIG",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/regulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
        return;
      }

      setForm({
        name: "",
        slug: "",
        description: "",
        authority: "",
        effectiveDate: "",
        category: "OVERIG",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    try {
      await fetch(`/api/admin/regulations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      router.refresh();
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Richtlijnen</h1>
          <p className="text-sm text-[#64748B]">
            Beheer EU compliance richtlijnen en vereisten
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Nieuwe richtlijn
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nieuwe richtlijn</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Naam</Label>
                  <Input
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
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Autoriteit</Label>
                  <Input
                    value={form.authority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, authority: e.target.value }))
                    }
                    placeholder="bijv. Europese Unie"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ingangsdatum</Label>
                  <Input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, effectiveDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
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

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#64748B]">Filter:</span>
        {["ALL", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === cat
                ? "bg-[#1F4E79] text-white"
                : "bg-gray-100 text-[#64748B] hover:bg-gray-200"
            }`}
          >
            {cat === "ALL" ? "Alle" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Autoriteit</TableHead>
                <TableHead>Ingangsdatum</TableHead>
                <TableHead className="text-right">Vereisten</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regulations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-[#64748B]"
                  >
                    Nog geen richtlijnen. Klik op &quot;Nieuwe richtlijn&quot;
                    om er een toe te voegen.
                  </TableCell>
                </TableRow>
              ) : (
                regulations.filter((reg) => filterCategory === "ALL" || reg.category === filterCategory).map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <Link
                        href={`/admin/regulations/${reg.id}`}
                        className="font-medium text-[#1F4E79] hover:underline"
                      >
                        {reg.name}
                      </Link>
                      {reg.officialReference && (
                        <p className="text-xs text-[#64748B] mt-0.5">{reg.officialReference}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[reg.category] || reg.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {reg.authority}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {new Date(reg.effectiveDate).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell className="text-right text-[#64748B]">
                      {reg.requirementCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() =>
                          handleToggleActive(reg.id, reg.isActive)
                        }
                        disabled={toggling === reg.id}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          reg.isActive ? "bg-[#059669]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            reg.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
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
