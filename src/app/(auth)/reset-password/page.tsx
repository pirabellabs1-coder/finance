"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("6 caractères minimum.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setDone(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-income/10 text-income">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Mot de passe modifié</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Link href="/login">
            <Button className="mt-6 w-full">Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-xl font-bold text-foreground">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
        {!token ? (
          <p className="mt-6 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            Lien invalide. Demandez un nouveau lien de réinitialisation.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input
              type="password"
              label="Nouveau mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && (
              <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Réinitialiser
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="animate-fade-in">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chargement…
          </CardContent>
        </Card>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
