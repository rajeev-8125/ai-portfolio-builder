"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

import {
  getLatestPortfolioGeneration,
  createPortfolioGeneration,
} from "@/lib/database/portfolio";

type ResumeProfile = {
  id?: string;
  portfolio_id: string;

  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;

  skills: unknown[];
  education: unknown[];
  experience: unknown[];
  projects: unknown[];
  certifications: unknown[];

  profile_image_name?: string | null;
  profile_image_path?: string | null;
};

type PortfolioGeneration = {
  id: string;
  portfolio_id: string;
  generated_data: unknown;
  design_prompt: string | null;
  style: string | null;
  theme: string | null;
  animation: string | null;
  created_at: string;
};

export default function GeneratePortfolioPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const portfolioId = params.id as string;

  // =====================================================
  // STATES
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [profile, setProfile] =
    useState<ResumeProfile | null>(null);

  const [existingGeneration, setExistingGeneration] =
    useState<PortfolioGeneration | null>(null);

  const [style, setStyle] =
    useState("Modern");

  const [theme, setTheme] =
    useState("Professional");

  const [animation, setAnimation] =
    useState("Smooth");

  const [designPrompt, setDesignPrompt] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (portfolioId) {
      loadGenerationData();
    }
  }, [portfolioId]);

  async function loadGenerationData() {
    setLoading(true);
    setError("");

    try {
      // -------------------------------------------------
      // AUTHENTICATION
      // -------------------------------------------------

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // -------------------------------------------------
      // VERIFY PORTFOLIO
      // -------------------------------------------------

      const {
        data: portfolio,
        error: portfolioError,
      } = await supabase
        .from("portfolios")
        .select("id, title")
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .single();

      if (portfolioError || !portfolio) {
        throw new Error(
          "Portfolio not found or you don't have access to it."
        );
      }

      // -------------------------------------------------
      // LOAD RESUME PROFILE
      // -------------------------------------------------

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("resume_profiles")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `Unable to load resume profile: ${profileError.message}`
        );
      }

      if (!profileData) {
        throw new Error(
          "Resume information is not available. Please upload and analyze your resume first."
        );
      }

      setProfile(profileData);

      // -------------------------------------------------
      // LOAD PREVIOUS GENERATION
      // -------------------------------------------------

      try {
        const latestGeneration =
          await getLatestPortfolioGeneration(
            portfolioId
          );

        if (latestGeneration) {
          setExistingGeneration(
            latestGeneration
          );

          if (latestGeneration.style) {
            setStyle(
              latestGeneration.style
            );
          }

          if (latestGeneration.theme) {
            setTheme(
              latestGeneration.theme
            );
          }

          if (latestGeneration.animation) {
            setAnimation(
              latestGeneration.animation
            );
          }

          if (
            latestGeneration.design_prompt
          ) {
            setDesignPrompt(
              latestGeneration.design_prompt
            );
          }
        }
      } catch (generationError) {
        console.log(
          "No previous generation found:",
          generationError
        );
      }

      setLoading(false);
    } catch (error) {
      console.error(
        "Generation page loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load portfolio generation page."
      );

      setLoading(false);
    }
  }
  async function handleGenerate(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!profile) {
    setError(
      "Resume information is not available."
    );

    return;
  }

  setGenerating(true);

  try {
    // ============================================
    // 1. GENERATE PORTFOLIO USING AI
    // ============================================

    const response = await fetch(
      "/api/generate-portfolio",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          portfolioId,
          profile,
          style,
          theme,
          animation,
          designPrompt:
            designPrompt.trim(),
        }),
      }
    );

    // Safely read response
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Portfolio generation failed."
      );
    }

    // ============================================
    // 2. CHECK GENERATED DATA
    // ============================================

    if (!result?.data) {
      throw new Error(
        "AI did not return portfolio data."
      );
    }

    console.log(
      "AI generated portfolio:",
      result.data
    );

    // ============================================
    // 3. SAVE GENERATED PORTFOLIO
    // ============================================

    const savedGeneration =
      await createPortfolioGeneration(
        portfolioId,
        result.data,
        designPrompt.trim(),
        style,
        theme,
        animation
      );

    console.log(
      "Portfolio generation saved:",
      savedGeneration
    );

    if (!savedGeneration) {
      throw new Error(
        "Portfolio was generated but could not be saved."
      );
    }

    // ============================================
    // 4. SUCCESS
    // ============================================

    setSuccess(
      "Portfolio generated successfully."
    );

    // ============================================
    // 5. OPEN PREVIEW
    // ============================================

    router.push(
      `/dashboard/portfolio/${portfolioId}/preview`
    );
  } catch (error) {
    console.error(
      "Portfolio generation error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to generate portfolio."
    );
  } finally {
    setGenerating(false);
  }
}

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="portfolio-generation-page">
        <div className="portfolio-generation-container">

          <div className="portfolio-generation-loading">
            Loading portfolio generator...
          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR WITHOUT PROFILE
  // =====================================================

  if (!profile) {
    return (
      <main className="portfolio-generation-page">
        <div className="portfolio-generation-container">

          <div className="dashboard-error">
            {error}
          </div>

          <Link
            href={`/dashboard/portfolio/${portfolioId}`}
            className="back-dashboard-link"
          >
            ← Back to Portfolio
          </Link>

        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="portfolio-generation-page">

      <div className="portfolio-generation-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="portfolio-generation-topbar">

          <div>

            <h1>
              Generate Your Portfolio
            </h1>

            <p>
              Create a professional portfolio
              using your resume information and
              your preferred design.
            </p>

          </div>

          <Link
            href={`/dashboard/portfolio/${portfolioId}`}
            className="back-dashboard-button"
          >
            ← &nbsp; Back to Portfolio
          </Link>

        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="dashboard-success">
            ✓ &nbsp; {success}
          </div>
        )}

        {/* =================================================
            PROFILE SUMMARY
        ================================================= */}

        <section className="management-card">

          <div className="management-card-header">

            <div className="management-icon">
              👤
            </div>

            <div>

              <h2>
                Resume Information
              </h2>

              <p>
                This information will be used
                to create your portfolio.
              </p>

            </div>

          </div>

          <div className="generation-profile-summary">

            <div className="generation-profile-item">

              <span>
                Name
              </span>

              <strong>
                {profile.full_name ||
                  "Not available"}
              </strong>

            </div>

            <div className="generation-profile-item">

              <span>
                Email
              </span>

              <strong>
                {profile.email ||
                  "Not available"}
              </strong>

            </div>

            <div className="generation-profile-item">

              <span>
                Skills
              </span>

              <strong>
                {Array.isArray(
                  profile.skills
                )
                  ? profile.skills.length
                  : 0}{" "}
                skills
              </strong>

            </div>

            <div className="generation-profile-item">

              <span>
                Experience
              </span>

              <strong>
                {Array.isArray(
                  profile.experience
                )
                  ? profile.experience.length
                  : 0}{" "}
                entries
              </strong>

            </div>

            <div className="generation-profile-item">

              <span>
                Projects
              </span>

              <strong>
                {Array.isArray(
                  profile.projects
                )
                  ? profile.projects.length
                  : 0}{" "}
                projects
              </strong>

            </div>

            <div className="generation-profile-item">

              <span>
                Education
              </span>

              <strong>
                {Array.isArray(
                  profile.education
                )
                  ? profile.education.length
                  : 0}{" "}
                entries
              </strong>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/portfolio/${portfolioId}/profile`
              )
            }
            className="edit-information-button"
          >
            ✎ &nbsp; Edit Resume Information
          </button>

        </section>

        {/* =================================================
            DESIGN SETTINGS
        ================================================= */}

        <form
          onSubmit={handleGenerate}
        >

          <section className="management-card">

            <div className="management-card-header">

              <div className="management-icon">
                🎨
              </div>

              <div>

                <h2>
                  Design Your Portfolio
                </h2>

                <p>
                  Choose how your portfolio
                  should look and feel.
                </p>

              </div>

            </div>

            {/* =================================================
                STYLE
            ================================================= */}

            <div className="generation-setting">

              <label>
                <span>
                  Portfolio Style
                </span>

                <small>
                  Choose the overall layout
                  style.
                </small>
              </label>

              <div className="generation-options">

                {[
                  {
                    value: "Modern",
                    icon: "✨",
                    description:
                      "Clean and modern",
                  },

                  {
                    value: "Minimal",
                    icon: "◻️",
                    description:
                      "Simple and elegant",
                  },

                  {
                    value: "Creative",
                    icon: "🎨",
                    description:
                      "Creative and unique",
                  },

                  {
                    value: "Professional",
                    icon: "💼",
                    description:
                      "Corporate and professional",
                  },
                ].map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={`generation-option ${
                        style ===
                        option.value
                          ? "generation-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setStyle(
                          option.value
                        )
                      }
                    >

                      <div className="generation-option-icon">
                        {
                          option.icon
                        }
                      </div>

                      <strong>
                        {
                          option.value
                        }
                      </strong>

                      <small>
                        {
                          option.description
                        }
                      </small>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* =================================================
                THEME
            ================================================= */}

            <div className="generation-setting">

              <label>
                <span>
                  Color Theme
                </span>

                <small>
                  Select your portfolio
                  color direction.
                </small>
              </label>

              <div className="generation-options">

                {[
                  {
                    value:
                      "Professional",
                    icon: "🔵",
                    description:
                      "Professional blue",
                  },

                  {
                    value:
                      "Dark",
                    icon: "🌑",
                    description:
                      "Dark modern",
                  },

                  {
                    value:
                      "Light",
                    icon: "☀️",
                    description:
                      "Bright and clean",
                  },

                  {
                    value:
                      "Elegant",
                    icon: "🖤",
                    description:
                      "Elegant premium",
                  },
                ].map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={`generation-option ${
                        theme ===
                        option.value
                          ? "generation-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setTheme(
                          option.value
                        )
                      }
                    >

                      <div className="generation-option-icon">
                        {
                          option.icon
                        }
                      </div>

                      <strong>
                        {
                          option.value
                        }
                      </strong>

                      <small>
                        {
                          option.description
                        }
                      </small>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* =================================================
                ANIMATION
            ================================================= */}

            <div className="generation-setting">

              <label>
                <span>
                  Animation
                </span>

                <small>
                  Choose how elements appear
                  on the page.
                </small>
              </label>

              <div className="generation-options">

                {[
                  {
                    value:
                      "None",
                    icon: "⏹️",
                    description:
                      "No animations",
                  },

                  {
                    value:
                      "Smooth",
                    icon: "✨",
                    description:
                      "Smooth animations",
                  },

                  {
                    value:
                      "Interactive",
                    icon: "⚡",
                    description:
                      "Interactive effects",
                  },
                ].map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={`generation-option ${
                        animation ===
                        option.value
                          ? "generation-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setAnimation(
                          option.value
                        )
                      }
                    >

                      <div className="generation-option-icon">
                        {
                          option.icon
                        }
                      </div>

                      <strong>
                        {
                          option.value
                        }
                      </strong>

                      <small>
                        {
                          option.description
                        }
                      </small>

                    </button>
                  )
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              AI DESIGN PROMPT
          ================================================= */}

          <section className="management-card">

            <div className="management-card-header">

              <div className="management-icon">
                🤖
              </div>

              <div>

                <h2>
                  AI Design Instructions
                </h2>

                <p>
                  Tell AI how you want your
                  portfolio to look.
                </p>

              </div>

            </div>

            <div className="generation-prompt-wrapper">

              <label>
                <span>
                  Describe your preferred
                  portfolio
                </span>

                <textarea
                  value={
                    designPrompt
                  }
                  onChange={(event) =>
                    setDesignPrompt(
                      event.target.value
                    )
                  }
                  placeholder="Example: Create a modern portfolio for a software developer. Use a clean professional layout with a strong hero section, skills section, projects section and subtle animations."
                  rows={6}
                />

              </label>

              <small>
                This is optional. AI will use
                your instructions along with
                the selected style and theme.
              </small>

            </div>

          </section>

          {/* =================================================
              GENERATE
          ================================================= */}

          <section className="management-card generate-final-card">

            <div className="generate-final-content">

              <div>

                <div className="management-card-header">

                  <div className="management-icon">
                    🚀
                  </div>

                  <div>

                    <h2>
                      Ready to Generate?
                    </h2>

                    <p>
                      AI will create your
                      portfolio using your
                      resume information and
                      design preferences.
                    </p>

                  </div>

                </div>

                <div className="generation-summary">

                  <div>
                    <span>
                      Style
                    </span>

                    <strong>
                      {style}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Theme
                    </span>

                    <strong>
                      {theme}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Animation
                    </span>

                    <strong>
                      {animation}
                    </strong>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={
                    generating
                  }
                  className="generate-portfolio-button"
                >

                  🚀 &nbsp;

                  {generating
                    ? "Generating Portfolio..."
                    : existingGeneration
                    ? "Regenerate My Portfolio"
                    : "Generate My Portfolio"}

                  <span>
                    →
                  </span>

                </button>

              </div>

              <div className="generate-illustration">
                ✨
              </div>

            </div>

          </section>

        </form>

      </div>

    </main>
  );
}