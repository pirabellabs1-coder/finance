"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, LogOut, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { CURRENCIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

/** Crops to a square and downscales to keep avatars small in localStorage. */
async function fileToAvatar(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const min = Math.min(img.width, img.height);
  ctx.drawImage(
    img,
    (img.width - min) / 2,
    (img.height - min) / 2,
    min,
    min,
    0,
    0,
    size,
    size,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { replaceAll } = useData();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(user?.currency ?? "EUR");
  const [profileMsg, setProfileMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const avatar = await fileToAvatar(file);
    await updateProfile({ avatar });
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setSavingProfile(true);
    try {
      await updateProfile({ firstName, lastName, currency });
      setProfileMsg("Profil mis à jour.");
      setTimeout(() => setProfileMsg(""), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdMsg("");
    if (newPwd.length < 6) {
      setPwdError("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSavingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdMsg("Mot de passe modifié.");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdMsg(""), 2500);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleReset = async () => {
    await replaceAll([]);
    setConfirmReset(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar user={user} className="h-20 w-20 text-2xl" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label="Changer la photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Membre depuis {user ? formatDate(user.createdAt, "medium") : "—"}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Select
              label="Devise principale"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.symbol})
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={savingProfile}>
                Enregistrer
              </Button>
              {profileMsg && (
                <span className="flex items-center gap-1 text-sm text-income">
                  <Check className="h-4 w-4" />
                  {profileMsg}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            label="Thème"
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
          >
            <option value="system">Système</option>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </Select>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <Input
              type="password"
              label="Mot de passe actuel"
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="password"
                label="Nouveau mot de passe"
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <Input
                type="password"
                label="Confirmer"
                autoComplete="new-password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
            </div>
            {pwdError && (
              <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                {pwdError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" variant="secondary" loading={savingPwd}>
                Changer le mot de passe
              </Button>
              {pwdMsg && (
                <span className="flex items-center gap-1 text-sm text-income">
                  <Check className="h-4 w-4" />
                  {pwdMsg}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
          <Button
            variant={confirmReset ? "danger" : "ghost"}
            onClick={() => (confirmReset ? handleReset() : setConfirmReset(true))}
            className={confirmReset ? undefined : "text-expense hover:text-expense"}
          >
            <Trash2 className="h-4 w-4" />
            {confirmReset ? "Confirmer la suppression" : "Effacer mes transactions"}
          </Button>
          {confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="text-sm text-muted-foreground hover:underline"
            >
              Annuler
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
