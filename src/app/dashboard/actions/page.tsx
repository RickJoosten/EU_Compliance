"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssigneeSelector } from "@/components/shared/assignee-selector";
import {
  Plus,
  Filter,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Save,
  Trash2,
  Pencil,
  ListPlus,
  Info,
  AlertTriangle,
  Calendar,
} from "lucide-react";

// --- Types ---

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ActionChild {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  regulationId: string | null;
}

interface ActionParent {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  regulationId: string | null;
  regulation: { id: string; name: string } | null;
  children: ActionChild[];
}

interface Regulation {
  id: string;
  name: string;
  slug: string;
}

// --- Constants ---

const STATUS_OPTIONS = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "Bezig" },
  { value: "DONE", label: "Afgerond" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "Hoog" },
  { value: "MEDIUM", label: "Middel" },
  { value: "LOW", label: "Laag" },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-50 text-[#DC2626] border-red-200",
  MEDIUM: "bg-yellow-50 text-[#D97706] border-yellow-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "Hoog",
  MEDIUM: "Middel",
  LOW: "Laag",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700 border-gray-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  DONE: "bg-green-50 text-[#059669] border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "Bezig",
  DONE: "Afgerond",
};

// --- Helpers ---

function dueDateColor(dueDate: string | null, status: string): string {
  if (!dueDate || status === "DONE") return "text-[#64748B]";
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return "text-[#DC2626] font-medium";
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) return "text-[#D97706] font-medium";
  return "text-[#64748B]";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

// --- Component ---

export default function ActionsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const organizationId = (session?.user as any)?.organizationId as string | undefined;

  const [actions, setActions] = useState<ActionParent[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [regulationFilter, setRegulationFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>(() =>
    userRole === "CLIENT_USER" ? "mine" : "all"
  );

  // Expand state
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
    childCount: number;
  } | null>(null);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    regulationId: "",
    parentId: "",
    assignedToId: "",
  });

  // Parent-done suggestion
  const [parentDoneSuggestion, setParentDoneSuggestion] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // --- Data loading ---

  const loadActions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (regulationFilter !== "all") params.set("regulationId", regulationFilter);
      if (assigneeFilter === "mine" && userId) {
        params.set("myActions", "true");
      } else if (assigneeFilter !== "all" && assigneeFilter !== "mine") {
        params.set("assignedToId", assigneeFilter);
      }
      const res = await fetch(`/api/dashboard/actions?${params}`);
      if (res.ok) {
        setActions(await res.json());
      }
    } catch (err) {
      console.error("Failed to load actions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, regulationFilter, assigneeFilter, userId]);

  const loadOrgUsers = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await fetch(`/api/organizations/${organizationId}/users`);
      if (res.ok) {
        setOrgUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to load org users:", err);
    }
  }, [organizationId]);

  const loadRegulations = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/regulations");
      if (res.ok) {
        setRegulations(await res.json());
      }
    } catch (err) {
      console.error("Failed to load regulations:", err);
    }
  }, []);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  useEffect(() => {
    loadOrgUsers();
    loadRegulations();
  }, [loadOrgUsers, loadRegulations]);

  // Update default assignee filter when role becomes available
  useEffect(() => {
    if (userRole === "CLIENT_USER") {
      setAssigneeFilter("mine");
    }
  }, [userRole]);

  // --- Mutations ---

  const patchAction = async (id: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/dashboard/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to patch action:", err);
      return false;
    }
  };

  const handleAssigneeChange = async (actionId: string, newAssigneeId: string | null, isChild: boolean, parentId?: string) => {
    const ok = await patchAction(actionId, { assignedToId: newAssigneeId });
    if (!ok) return;

    if (isChild && parentId) {
      setActions((prev) =>
        prev.map((p) =>
          p.id === parentId
            ? {
                ...p,
                children: p.children.map((c) =>
                  c.id === actionId ? { ...c, assignedToId: newAssigneeId, assignedTo: newAssigneeId ? orgUsers.find((u) => u.id === newAssigneeId) ? { id: newAssigneeId, name: orgUsers.find((u) => u.id === newAssigneeId)!.name } : null : null } : c
                ),
              }
            : p
        )
      );
    } else {
      setActions((prev) =>
        prev.map((p) =>
          p.id === actionId
            ? { ...p, assignedToId: newAssigneeId, assignedTo: newAssigneeId ? orgUsers.find((u) => u.id === newAssigneeId) ? { id: newAssigneeId, name: orgUsers.find((u) => u.id === newAssigneeId)!.name } : null : null }
            : p
        )
      );
    }
  };

  const handleChildStatusToggle = async (parentId: string, childId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    const ok = await patchAction(childId, { status: newStatus });
    if (!ok) return;

    setActions((prev) =>
      prev.map((p) => {
        if (p.id !== parentId) return p;
        const updatedChildren = p.children.map((c) =>
          c.id === childId ? { ...c, status: newStatus } : c
        );
        // Check if all children are now DONE
        const allDone = updatedChildren.length > 0 && updatedChildren.every((c) => c.status === "DONE");
        if (allDone && p.status !== "DONE") {
          setParentDoneSuggestion({ id: p.id, title: p.title });
        }
        return { ...p, children: updatedChildren };
      })
    );
  };

  const handleMarkParentDone = async (parentId: string) => {
    const ok = await patchAction(parentId, { status: "DONE" });
    if (!ok) return;
    setActions((prev) =>
      prev.map((p) => (p.id === parentId ? { ...p, status: "DONE" } : p))
    );
    setParentDoneSuggestion(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/actions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove from local state - could be a parent or a child
        setActions((prev) => {
          // Try removing as parent
          const filtered = prev.filter((p) => p.id !== id);
          if (filtered.length < prev.length) return filtered;
          // Try removing as child
          return prev.map((p) => ({
            ...p,
            children: p.children.filter((c) => c.id !== id),
          }));
        });
      }
    } catch (err) {
      console.error("Failed to delete action:", err);
    }
    setDeleteConfirm(null);
  };

  const handleCreate = async () => {
    if (!addForm.title.trim()) return;
    try {
      const body: Record<string, unknown> = {
        title: addForm.title,
        description: addForm.description || undefined,
        priority: addForm.priority,
        dueDate: addForm.dueDate || undefined,
        regulationId: addForm.regulationId || undefined,
        parentId: addForm.parentId || undefined,
        assignedToId: addForm.assignedToId || undefined,
      };
      const res = await fetch("/api/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setAddForm({
          title: "",
          description: "",
          priority: "MEDIUM",
          dueDate: "",
          regulationId: "",
          parentId: "",
          assignedToId: "",
        });
        loadActions();
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    }
  };

  const openAddSubtask = (parentId: string) => {
    setAddForm({
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
      regulationId: "",
      parentId,
      assignedToId: "",
    });
    setShowAddDialog(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- Computed ---

  const getDoneCount = (parent: ActionParent) =>
    parent.children.filter((c) => c.status === "DONE").length;

  const getProgressPercent = (parent: ActionParent) => {
    if (parent.children.length === 0) return 0;
    return Math.round((getDoneCount(parent) / parent.children.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Actieplan</h1>
        </div>
        <Button
          onClick={() => {
            setAddForm({
              title: "",
              description: "",
              priority: "MEDIUM",
              dueDate: "",
              regulationId: "",
              parentId: "",
              assignedToId: "",
            });
            setShowAddDialog(true);
          }}
          className="bg-[#1F4E79] hover:bg-[#1F4E79]/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Nieuwe actie
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#2E75B6] mt-0.5 shrink-0" />
        <p className="text-sm text-[#334155]">
          Dit actieplan is automatisch aangemaakt op basis van de toegewezen richtlijnen. Wijs acties toe aan teamleden en pas het plan aan naar jullie situatie.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#64748B]" />
          <span className="text-sm text-[#64748B]">Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Prioriteit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regulationFilter} onValueChange={(v) => setRegulationFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Richtlijn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle richtlijnen</SelectItem>
            {regulations.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toegewezen aan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="mine">Mijn acties</SelectItem>
            {orgUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parent-done suggestion toast */}
      {parentDoneSuggestion && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center justify-between">
          <p className="text-sm text-[#334155]">
            Alle subtaken van <span className="font-semibold">&quot;{parentDoneSuggestion.title}&quot;</span> zijn afgerond. Wil je de hoofdtaak ook als afgerond markeren?
          </p>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setParentDoneSuggestion(null)}
            >
              Later
            </Button>
            <Button
              size="sm"
              className="bg-[#059669] hover:bg-[#059669]/90"
              onClick={() => handleMarkParentDone(parentDoneSuggestion.id)}
            >
              Markeer als afgerond
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-[#64748B]">Laden...</div>
            </div>
          ) : actions.length === 0 ? (
            <div className="py-16 text-center text-[#64748B]">
              Geen actie-items gevonden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="min-w-[220px]">Titel</TableHead>
                    <TableHead className="min-w-[100px]">Voortgang</TableHead>
                    <TableHead className="min-w-[170px]">Toegewezen aan</TableHead>
                    <TableHead className="min-w-[110px]">Deadline</TableHead>
                    <TableHead>Prioriteit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((parent) => {
                    const isExpanded = expandedParents.has(parent.id);
                    const doneCount = getDoneCount(parent);
                    const totalChildren = parent.children.length;
                    const progressPct = getProgressPercent(parent);

                    return (
                      <Fragment key={parent.id}>
                        {/* Parent row */}
                        <TableRow
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="pr-0">
                            <button
                              onClick={() => toggleExpand(parent.id)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#64748B]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#64748B]" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-[#334155]">
                              {parent.title}
                            </span>
                            {parent.regulation && (
                              <p className="text-xs text-[#64748B] mt-0.5">
                                {parent.regulation.name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {totalChildren > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full bg-[#059669] rounded-full transition-all"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[#64748B] whitespace-nowrap">
                                  {doneCount}/{totalChildren}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#64748B]">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <AssigneeSelector
                              users={orgUsers}
                              value={parent.assignedToId}
                              onChange={(uid) =>
                                handleAssigneeChange(parent.id, uid, false)
                              }
                              currentUserRole={userRole}
                              currentUserId={userId}
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-1 text-xs ${dueDateColor(parent.dueDate, parent.status)}`}
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDate(parent.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${PRIORITY_COLORS[parent.priority] || ""}`}
                            >
                              {PRIORITY_LABELS[parent.priority] || parent.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${STATUS_COLORS[parent.status] || ""}`}
                            >
                              {STATUS_LABELS[parent.status] || parent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-200 transition-colors">
                                <MoreHorizontal className="h-4 w-4 text-[#64748B]" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openAddSubtask(parent.id)}
                                >
                                  <ListPlus className="h-4 w-4 mr-2" />
                                  Subtaak toevoegen
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteConfirm({
                                      id: parent.id,
                                      title: parent.title,
                                      childCount: parent.children.length,
                                    })
                                  }
                                  className="text-[#DC2626]"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Verwijderen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Children rows */}
                        {isExpanded &&
                          parent.children.map((child) => (
                            <TableRow
                              key={child.id}
                              className="bg-gray-50/30 hover:bg-gray-100/50"
                            >
                              <TableCell className="pr-0"></TableCell>
                              <TableCell className="pl-8">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={child.status === "DONE"}
                                    onChange={() =>
                                      handleChildStatusToggle(
                                        parent.id,
                                        child.id,
                                        child.status
                                      )
                                    }
                                    className="h-4 w-4 rounded border-gray-300 accent-[#1F4E79]"
                                  />
                                  <div className="min-w-0">
                                    <span
                                      className={`text-sm text-[#334155] ${
                                        child.status === "DONE"
                                          ? "line-through text-[#64748B]"
                                          : ""
                                      }`}
                                    >
                                      {child.title}
                                    </span>
                                    {child.description && (
                                      <p className="text-xs text-[#64748B] truncate max-w-[300px]">
                                        {child.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell>
                                <AssigneeSelector
                                  users={orgUsers}
                                  value={child.assignedToId}
                                  onChange={(uid) =>
                                    handleAssigneeChange(
                                      child.id,
                                      uid,
                                      true,
                                      parent.id
                                    )
                                  }
                                  currentUserRole={userRole}
                                  currentUserId={userId}
                                />
                              </TableCell>
                              <TableCell>
                                <div
                                  className={`flex items-center gap-1 text-xs ${dueDateColor(child.dueDate, child.status)}`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(child.dueDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${PRIORITY_COLORS[child.priority] || ""}`}
                                >
                                  {PRIORITY_LABELS[child.priority] || child.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${STATUS_COLORS[child.status] || ""}`}
                                >
                                  {STATUS_LABELS[child.status] || child.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-200 transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-[#64748B]" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDeleteConfirm({
                                          id: child.id,
                                          title: child.title,
                                          childCount: 0,
                                        })
                                      }
                                      className="text-[#DC2626]"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Verwijderen
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
              Actie verwijderen
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm && deleteConfirm.childCount > 0
                ? `Let op: dit verwijdert ook alle ${deleteConfirm.childCount} subtaken. Weet je het zeker?`
                : "Weet je zeker dat je deze actie wilt verwijderen?"}
            </DialogDescription>
          </DialogHeader>
          {deleteConfirm && (
            <p className="text-sm text-[#334155] font-medium px-1">
              &quot;{deleteConfirm.title}&quot;
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Annuleren
            </Button>
            <Button
              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Action Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {addForm.parentId ? "Subtaak toevoegen" : "Nieuwe actie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={addForm.title}
                onChange={(e) =>
                  setAddForm({ ...addForm, title: e.target.value })
                }
                placeholder="Titel van de actie"
              />
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Textarea
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
                placeholder="Beschrijving"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioriteit</Label>
                <Select
                  value={addForm.priority}
                  onValueChange={(val) =>
                    val && setAddForm({ ...addForm, priority: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Hoog</SelectItem>
                    <SelectItem value="MEDIUM">Middel</SelectItem>
                    <SelectItem value="LOW">Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={addForm.dueDate}
                  onChange={(e) =>
                    setAddForm({ ...addForm, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Richtlijn</Label>
                <Select
                  value={addForm.regulationId || "none"}
                  onValueChange={(val: string | null) =>
                    setAddForm({
                      ...addForm,
                      regulationId: !val || val === "none" ? "" : val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer richtlijn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen richtlijn</SelectItem>
                    {regulations.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Toegewezen aan</Label>
                <select
                  value={addForm.assignedToId}
                  onChange={(e) =>
                    setAddForm({ ...addForm, assignedToId: e.target.value })
                  }
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Niet toegewezen</option>
                  {orgUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!addForm.parentId && (
              <div>
                <Label>Hoofdtaak (optioneel - maakt dit een subtaak)</Label>
                <Select
                  value={addForm.parentId || "none"}
                  onValueChange={(val: string | null) =>
                    setAddForm({
                      ...addForm,
                      parentId: !val || val === "none" ? "" : val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Geen (hoofdtaak)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen (hoofdtaak)</SelectItem>
                    {actions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleCreate}
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
