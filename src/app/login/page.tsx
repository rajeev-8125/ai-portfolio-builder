"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Portify<span>AI</span>
        </div>

        <h1>Welcome back</h1>

        <p className="auth-description">
          Login to continue building your portfolio.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              required
            />
          </label>
          <label>
  Password

  <PasswordInput
    value={password}
    onChange={setPassword}
    placeholder="Your password"
    required
  />
</label>
<div className="forgot-password">
  <Link href="/forgot-password">
    Forgot password?
  </Link>
</div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="auth-divider">
  <span>OR</span>
</div>

<GoogleSignInButton />

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}