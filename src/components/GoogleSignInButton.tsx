"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  async function handleGoogleLogin() {
    const supabase = createClient();

    const redirectUrl =
      `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="google-button"
    >
      <span className="google-icon">G</span>
      Continue with Google
    </button>
  );
}