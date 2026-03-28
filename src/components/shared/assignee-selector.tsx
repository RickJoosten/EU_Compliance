"use client";

interface OrgUser {
  id: string;
  name: string;
  email: string;
}

interface AssigneeSelectorProps {
  users: OrgUser[];
  value: string | null;
  onChange: (userId: string | null) => void;
  currentUserRole?: string;
  currentUserId?: string;
}

export function AssigneeSelector({
  users,
  value,
  onChange,
  currentUserRole,
  currentUserId,
}: AssigneeSelectorProps) {
  const selectedUser = users.find((u) => u.id === value);

  // CLIENT_USER can only assign to self or unassign
  const availableUsers =
    currentUserRole === "CLIENT_USER" && currentUserId
      ? users.filter((u) => u.id === currentUserId)
      : users;

  return (
    <div className="flex items-center gap-1.5">
      {selectedUser && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F4E79] text-[10px] font-medium text-white">
          {selectedUser.name.charAt(0).toUpperCase()}
        </div>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-7 w-full max-w-[160px] truncate rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      >
        <option value="">Niet toegewezen</option>
        {availableUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
