"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getAuthErrorMessage, useAdminSession } from "@/lib/firebase/admin-session";

export default function AdminLoginPage() {
  const router = useRouter();
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.user && session.isAdmin) router.replace("/admin");
  }, [router, session.isAdmin, session.user]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const auth = getFirebaseAuth();
      await setPersistence(
        auth,
        keepSignedIn ? browserLocalPersistence : browserSessionPersistence,
      );
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await result.user.getIdTokenResult(true);
      if (!result.user.emailVerified || token.claims.email_verified !== true) {
        await sendEmailVerification(result.user).finally(() =>
          signOut(getFirebaseAuth()),
        );
        setMessage(
          "A verification link has been sent. Verify your email, then sign in again.",
        );
        return;
      }
      if (token.claims.admin !== true) {
        await signOut(getFirebaseAuth());
        setError("This account does not have admin access.");
        return;
      }
      router.replace("/admin");
    } catch (reason) {
      setError(getAuthErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Enter your email address first to receive a password reset link.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setMessage("If an account exists for this address, a reset link has been sent.");
    } catch (reason) {
      setError(getAuthErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login-visual">
        <Link href="/" className="admin-login-kicker">
          Kitari Studio admin
        </Link>
        <p>Manage every project, package, and inquiry in one place.</p>
        <h2>
          Kitari Studio<sup>©</sup>
        </h2>
      </section>
      <section className="admin-login-form-panel">
        <form onSubmit={login} className="admin-login-form">
          <h1>Welcome back</h1>
          <p className="admin-login-subtitle">
            Sign in to manage the Kitari Studio website.
          </p>
          {session.error && (
            <p className="admin-alert admin-alert-error">{session.error}</p>
          )}
          {session.user && !session.isAdmin && !session.loading && (
            <p className="admin-alert admin-alert-error">
              This signed-in account is not an administrator. Contact the project owner.
            </p>
          )}
          {error && (
            <p role="alert" className="admin-alert admin-alert-error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="admin-alert admin-alert-success">
              {message}
            </p>
          )}
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              aria-label="Email address"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <span className="admin-password-field">
              <input
                aria-label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="admin-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide" : "Show"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          <div className="admin-login-options">
            <label className="admin-remember">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(event) => setKeepSignedIn(event.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
            <button
              type="button"
              className="admin-login-link"
              onClick={resetPassword}
              disabled={busy}
            >
              Forgot password?
            </button>
          </div>
          <button
            className="admin-button admin-button-primary admin-login-submit"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
