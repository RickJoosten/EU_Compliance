"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  NoOrganization:
    "Er is geen organisatie gevonden voor uw e-maildomein. Neem contact op met uw beheerder.",
  SSODisabled:
    "SSO-provisioning is uitgeschakeld voor uw organisatie. Neem contact op met uw beheerder.",
  OAuthAccountNotLinked:
    "Dit e-mailadres is al gekoppeld aan een ander account. Log in met uw oorspronkelijke methode.",
  OAuthCallback:
    "SSO is momenteel niet geconfigureerd voor uw organisatie. Neem contact op met uw beheerder.",
  OAuthSignin:
    "SSO is momenteel niet geconfigureerd voor uw organisatie. Neem contact op met uw beheerder.",
  Default: "Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.",
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

type Step = "email" | "login";

interface OrgInfo {
  found: boolean;
  organizationName?: string;
  organizationSlug?: string;
  hasGoogle: boolean;
  hasMicrosoft: boolean;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F4E79] to-[#2E75B6]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorMessages[errorParam] || errorMessages.Default);
    }
  }, [searchParams]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCheckingDomain(true);

    try {
      const res = await fetch("/api/auth/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: OrgInfo = await res.json();
      setOrgInfo(data);

      // Set sso_org cookie so NextAuth route loads the right providers
      if (data.found && data.organizationSlug) {
        document.cookie = `sso_org=${data.organizationSlug};path=/;max-age=300;samesite=lax`;
      }

      setStep("login");
    } catch {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setCheckingDomain(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ongeldig e-mailadres of wachtwoord. Probeer het opnieuw.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role: string = session?.user?.role ?? "";

      // Clear sso_org cookie
      document.cookie = "sso_org=;path=/;max-age=0";

      if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden. Probeer het opnieuw.");
      setIsLoading(false);
    }
  }

  async function handleSSO(provider: string) {
    setSsoLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  function goBack() {
    setStep("email");
    setPassword("");
    setOrgInfo(null);
    setError(null);
    // Clear cookie
    document.cookie = "sso_org=;path=/;max-age=0";
  }

  const hasSSO = orgInfo?.hasGoogle || orgInfo?.hasMicrosoft;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] px-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-[#1F4E79]" />
            <h1 className="text-2xl font-bold text-[#1F4E79] tracking-tight">
              RevAct Comply
            </h1>
          </div>
          <p className="text-sm text-[#64748B]">
            EU Compliance Management Platform
          </p>
        </CardHeader>

        <CardContent className="pt-4 pb-8 px-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#334155]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={checkingDomain}
                  className="h-11"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={checkingDomain}
                className="w-full h-11 bg-[#1F4E79] hover:bg-[#1F4E79]/90 text-white font-medium"
              >
                {checkingDomain ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Controleren...
                  </>
                ) : (
                  "Doorgaan"
                )}
              </Button>
            </form>
          )}

          {step === "login" && (
            <>
              {/* Back button + email display */}
              <div className="mb-5">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#334155] transition-colors mb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Terug
                </button>
                <div className="rounded-md bg-gray-50 border px-3 py-2">
                  <p className="text-sm text-[#334155] font-medium">{email}</p>
                  {orgInfo?.found && orgInfo.organizationName && (
                    <p className="text-xs text-[#64748B]">{orgInfo.organizationName}</p>
                  )}
                </div>
              </div>

              {/* SSO Buttons (if available for this org) */}
              {hasSSO && (
                <>
                  <div className="space-y-3">
                    {orgInfo?.hasMicrosoft && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 bg-[#2F2F2F] hover:bg-[#2F2F2F]/90 text-white border-0 font-medium"
                        disabled={ssoLoading !== null || isLoading}
                        onClick={() => handleSSO("azure-ad")}
                      >
                        {ssoLoading === "azure-ad" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MicrosoftIcon />
                        )}
                        <span className="ml-2">Inloggen met Microsoft</span>
                      </Button>
                    )}

                    {orgInfo?.hasGoogle && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 bg-white hover:bg-gray-50 text-[#334155] border border-gray-300 font-medium"
                        disabled={ssoLoading !== null || isLoading}
                        onClick={() => handleSSO("google")}
                      >
                        {ssoLoading === "google" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                        <span className="ml-2">Inloggen met Google</span>
                      </Button>
                    )}
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[#64748B]">
                        of inloggen met wachtwoord
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Password form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#334155]">
                    Wachtwoord
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Voer uw wachtwoord in"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || ssoLoading !== null}
                    className="h-11"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || ssoLoading !== null}
                  className="w-full h-11 bg-[#1F4E79] hover:bg-[#1F4E79]/90 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inloggen...
                    </>
                  ) : (
                    "Inloggen"
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs text-[#64748B]">
            Beveiligd door RevAct Comply &middot; EU AVG Compliant
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
