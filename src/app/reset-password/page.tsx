"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Your password has been updated successfully."
    );

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Portify<span>AI</span>
        </div>

        <h1>Reset your password</h1>

        <p className="auth-description">
          Create a new password for your account.
        </p>

        <form
          onSubmit={handleResetPassword}
          className="auth-form"
        >
          <label>
            New Password

            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Enter new password"
              minLength={6}
              required
            />
          </label>

          <label>
            Confirm Password

            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading
              ? "Updating..."
              : "Update Password"}
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
      </div>
    </main>
  );
}