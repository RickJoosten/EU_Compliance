"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Mail,
  Shield,
  Lock,
  Bell,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Notification toggles (placeholder)
  const [notifications, setNotifications] = useState({
    deadlineReminders: true,
    statusChanges: true,
    weeklyDigest: false,
    newRegulations: true,
  });

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Vul alle velden in.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Nieuw wachtwoord moet minimaal 8 tekens bevatten.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Wachtwoorden komen niet overeen.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess("Wachtwoord succesvol gewijzigd.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Er is een fout opgetreden.");
      }
    } catch {
      setPasswordError("Er is een fout opgetreden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#334155]">Instellingen</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Beheer uw account en organisatie-instellingen.
        </p>
      </div>

      {/* Organization profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F4E79] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Organisatie Profiel</CardTitle>
              <CardDescription>
                Overzicht van uw organisatie-informatie.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">Organisatie</Label>
              <div className="flex items-center gap-2 text-sm text-[#334155] font-medium">
                <Building2 className="h-4 w-4 text-[#64748B]" />
                {session?.user?.organizationName || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">Naam</Label>
              <div className="flex items-center gap-2 text-sm text-[#334155] font-medium">
                <User className="h-4 w-4 text-[#64748B]" />
                {session?.user?.name || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">E-mail</Label>
              <div className="flex items-center gap-2 text-sm text-[#334155] font-medium">
                <Mail className="h-4 w-4 text-[#64748B]" />
                {session?.user?.email || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">Rol</Label>
              <div className="flex items-center gap-2 text-sm text-[#334155] font-medium">
                <Shield className="h-4 w-4 text-[#64748B]" />
                {session?.user?.role === "CLIENT_ADMIN"
                  ? "Beheerder"
                  : session?.user?.role === "ADMIN"
                    ? "Platform Admin"
                    : "Gebruiker"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D9488] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Wachtwoord Wijzigen</CardTitle>
              <CardDescription>
                Wijzig uw wachtwoord voor meer veiligheid.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            <div>
              <Label>Huidig wachtwoord</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Voer uw huidige wachtwoord in"
              />
            </div>
            <div>
              <Label>Nieuw wachtwoord</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimaal 8 tekens"
              />
            </div>
            <div>
              <Label>Bevestig nieuw wachtwoord</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal nieuw wachtwoord"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-[#DC2626]">
                <AlertCircle className="h-4 w-4" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-sm text-[#059669]">
                <Check className="h-4 w-4" />
                {passwordSuccess}
              </div>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={saving}
              className="bg-[#1F4E79] hover:bg-[#1F4E79]/90 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Opslaan..." : "Wachtwoord Wijzigen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D97706] text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                Notificatie Voorkeuren
              </CardTitle>
              <CardDescription>
                Stel in welke notificaties u wilt ontvangen.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            {[
              {
                key: "deadlineReminders" as const,
                label: "Deadline herinneringen",
                desc: "Ontvang herinneringen voor naderende deadlines.",
              },
              {
                key: "statusChanges" as const,
                label: "Status wijzigingen",
                desc: "Meldingen bij wijzigingen in compliance status.",
              },
              {
                key: "weeklyDigest" as const,
                label: "Wekelijks overzicht",
                desc: "Wekelijks compliance-overzicht per e-mail.",
              },
              {
                key: "newRegulations" as const,
                label: "Nieuwe regelgeving",
                desc: "Meldingen bij nieuwe of gewijzigde regelgeving.",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-[#334155]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[#64748B]">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key]
                      ? "bg-[#059669]"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      notifications[item.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
