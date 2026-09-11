"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResetRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          `${window.location.origin}/reset-password`,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "If an account exists with this email, a password reset link has been sent."
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Portify<span>AI</span>
        </div>

        <h1>Forgot your password?</h1>

        <p className="auth-description">
          Enter your email address and we'll send you a
          password reset link.
        </p>

        <form
          onSubmit={handleResetRequest}
          className="auth-form"
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="auth-success">
            {message}
          </p>
        )}

        {error && (
          <p className="auth-message">
            {error}
          </p>
        )}

        <p className="auth-switch">
          Remember your password?{" "}
          <Link href="/login">Back to Login</Link>
        </p>
      </div>
    </main>
  );
}