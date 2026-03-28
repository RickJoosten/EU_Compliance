"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  organization: { id: string; name: string } | null;
}

interface OrgOption {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CLIENT_ADMIN: "Client Admin",
  CLIENT_USER: "Client User",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  CLIENT_ADMIN: "bg-blue-100 text-blue-700",
  CLIENT_USER: "bg-gray-100 text-gray-700",
};

export function UsersClient({
  users,
  organizations,
}: {
  users: UserRow[];
  organizations: OrgOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT_USER",
    organizationId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          organizationId: form.organizationId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
        return;
      }

      setForm({
        name: "",
        email: "",
        password: "",
        role: "CLIENT_USER",
        organizationId: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Gebruikers</h1>
          <p className="text-sm text-[#64748B]">
            Beheer alle gebruikers in het platform
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Nieuwe gebruiker
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe gebruiker</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Wachtwoord</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="CLIENT_USER">Client User</option>
                  <option value="CLIENT_ADMIN">Client Admin</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Organisatie</Label>
                <select
                  value={form.organizationId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, organizationId: e.target.value }))
                  }
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Geen organisatie</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Organisatie</TableHead>
                <TableHead>Aangemaakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-[#64748B]"
                  >
                    Nog geen gebruikers. Klik op &quot;Nieuwe gebruiker&quot; om
                    er een toe te voegen.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-[#334155]">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          roleColors[user.role] || roleColors.CLIENT_USER
                        }`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {user.organization?.name || "-"}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {new Date(user.createdAt).toLocaleDateString("nl-NL")}
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
