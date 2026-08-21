import { useState } from "react";
import { ArrowLeft, User, Mail, Lock, Loader2 } from "lucide-react";

interface SettingsProps {
  onBack: () => void;
  authUser: string | null;
  authEmail?: string | null;
  onUpdateProfile: (updates: { username?: string; email?: string; password?: string }) => Promise<void>;
  onSignOut?: () => void;
}

export default function Settings({
  onBack,
  authUser,
  authEmail,
  onUpdateProfile,
  onSignOut,
}: SettingsProps) {
  const [username, setUsername] = useState(authUser ?? "");
  const [email, setEmail] = useState(authEmail ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const hasChanges =
    username.trim() !== (authUser ?? "") ||
    email.trim() !== (authEmail ?? "") ||
    newPassword.length > 0;

  const handleSave = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setIsSaving(true);
    try {
      const updates: { username?: string; email?: string; password?: string } = {};
      if (username.trim() && username.trim() !== authUser) updates.username = username.trim();
      if (email.trim() && email.trim() !== authEmail) updates.email = email.trim();
      if (newPassword) updates.password = newPassword;

      await onUpdateProfile(updates);
      setNewPassword("");
      setSaveMessage("Profile updated.");
    } catch (err: any) {
      setSaveError(err?.message || "Could not update profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center px-6 py-6 min-h-[calc(100vh-88px)] animate-fade-in">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="rounded-[32px] bg-[#1c0f24]/90 p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[#1c0f24] shadow-[0_10px_26px_rgba(255,120,73,0.35)]">
              <User size={20} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/70">Account</p>
              <h2 className="rx-display text-2xl text-white">Settings</h2>
            </div>
          </div>

          {!authUser ? (
            <p className="text-sm text-white/50">Sign in to manage your account.</p>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-3xl bg-[#241530]/95 p-4">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/40">
                  <User size={14} />
                  Username
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  maxLength={20}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="rounded-3xl bg-[#241530]/95 p-4">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/40">
                  <Mail size={14} />
                  Email
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  type="email"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="rounded-3xl bg-[#241530]/95 p-4">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/40">
                  <Lock size={14} />
                  New Password
                </div>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="leave blank to keep current password"
                  type="password"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              {saveError && <p className="text-sm text-red-300">{saveError}</p>}
              {saveMessage && <p className="text-sm text-emerald-300">{saveMessage}</p>}

              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  hasChanges && !isSaving
                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-[#1c0f24]"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {isSaving ? "Saving…" : "Save changes"}
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="rounded-full border border-white/15 px-4 py-3 text-sm text-pink-200/80 hover:bg-white/5 transition"
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}