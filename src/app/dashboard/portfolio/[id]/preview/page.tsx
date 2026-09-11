"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PortfolioData = {
  hero?: {
    headline?: string;
    subheadline?: string;
    description?: string;
    primary_button?: string;
    secondary_button?: string;
  };

  about?: {
    title?: string;
    content?: string;
  };

  skills?: {
    title?: string;
    items?: string[];
  };

  experience?: {
    title?: string;
    items?: Array<Record<string, unknown>>;
  };

  education?: {
    title?: string;
    items?: Array<Record<string, unknown>>;
  };

  projects?: {
    title?: string;
    items?: Array<Record<string, unknown>>;
  };

  certifications?: {
    title?: string;
    items?: Array<Record<string, unknown>>;
  };

  contact?: {
    title?: string;
    description?: string;
    email?: string;
    phone?: string;
    location?: string;
  };

  social_links?: {
    linkedin?: string;
    github?: string;
    hackerrank?: string;
    leetcode?: string;
    portfolio?: string;
  };

  navigation?: string[];

  design?: {
    style?: string;
    theme?: string;
    animation?: string;
    layout_description?: string;
  };
};

type Portfolio = {
  id: string;
  title: string;
  slug: string;
  generated_data: PortfolioData | null;
  is_published?: boolean;
};

type ResumeProfile = Record<string, unknown> & {
  profile_image_path?: string | null;
  profile_image_name?: string | null;
};

type SocialLinks = {
  linkedin?: string;
  github?: string;
  hackerrank?: string;
  leetcode?: string;
  portfolio?: string;
};

export default function PortfolioPreviewPage() {
  const params = useParams();
  const router = useRouter();

  const portfolioId = params.id as string;

  const [portfolio, setPortfolio] =
    useState<Portfolio | null>(null);

  const [resumeProfile, setResumeProfile] =
    useState<ResumeProfile | null>(null);

  const [profileImageUrl, setProfileImageUrl] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // PUBLISH STATES
  const [publishing, setPublishing] =
    useState(false);

  const [publishedUrl, setPublishedUrl] =
    useState("");

  const [publishError, setPublishError] =
    useState("");

  // =====================================================
  // LOAD PORTFOLIO + PROFILE
  // =====================================================

  useEffect(() => {
    async function loadPortfolio() {
      try {
        if (!portfolioId) {
          throw new Error(
            "Portfolio ID is missing."
          );
        }

        const supabase = createClient();

        // ================================================
        // GET CURRENT USER
        // ================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // ================================================
        // LOAD PORTFOLIO
        // ================================================

        const {
          data,
          error: portfolioError,
        } = await supabase
          .from("portfolios")
          .select(
            "id, title, slug, generated_data, is_published"
          )
          .eq("id", portfolioId)
          .eq("user_id", user.id)
          .single();

        if (portfolioError) {
          throw portfolioError;
        }

        if (!data) {
          throw new Error(
            "Portfolio not found."
          );
        }

        setPortfolio(data as Portfolio);

        // If already published, prepare URL
        if (
          data.is_published &&
          data.slug
        ) {
          const baseUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            window.location.origin;

          setPublishedUrl(
            `${baseUrl}/portfolio/${data.slug}`
          );
        }

        // ================================================
        // LOAD RESUME PROFILE
        // ================================================

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("resume_profiles")
          .select("*")
          .eq("portfolio_id", portfolioId)
          .single();

        if (profileError) {
          console.warn(
            "Resume profile could not be loaded:",
            profileError
          );
        } else if (profile) {
          setResumeProfile(
            profile as ResumeProfile
          );

          // ==============================================
          // PROFILE IMAGE
          // ==============================================

          if (profile.profile_image_path) {
            const {
              data: signedUrlData,
              error: imageError,
            } = await supabase.storage
              .from("profile-images")
              .createSignedUrl(
                profile.profile_image_path,
                60 * 60
              );

            if (imageError) {
              console.error(
                "Profile image URL error:",
                imageError
              );
            } else if (
              signedUrlData?.signedUrl
            ) {
              setProfileImageUrl(
                signedUrlData.signedUrl
              );
            }
          }
        }
      } catch (err) {
        console.error(
          "Preview loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load portfolio preview."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [portfolioId, router]);

  // =====================================================
  // PUBLISH PORTFOLIO
  // =====================================================

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setPublishError("");

      if (!portfolio) {
        throw new Error(
          "Portfolio is not available."
        );
      }

      if (!portfolio.generated_data) {
        throw new Error(
          "Portfolio data is not available."
        );
      }

      const response = await fetch(
        "/api/portfolio/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portfolioId: portfolio.id,
            portfolio:
              portfolio.generated_data,
            title: portfolio.title,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to publish portfolio."
        );
      }

      if (!result.url) {
        throw new Error(
          "Portfolio published, but public URL was not returned."
        );
      }

      setPublishedUrl(result.url);

      setPortfolio((previous) =>
        previous
          ? {
              ...previous,
              slug:
                result.portfolio?.slug ||
                previous.slug,
              is_published: true,
            }
          : previous
      );
    } catch (err) {
      console.error(
        "Portfolio publishing error:",
        err
      );

      setPublishError(
        err instanceof Error
          ? err.message
          : "Failed to publish portfolio."
      );
    } finally {
      setPublishing(false);
    }
  };

  // =====================================================
  // COPY URL
  // =====================================================

  const handleCopyUrl = async () => {
    if (!publishedUrl) return;

    try {
      await navigator.clipboard.writeText(
        publishedUrl
      );

      alert(
        "Portfolio link copied to clipboard!"
      );
    } catch (err) {
      console.error(
        "Copy URL error:",
        err
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-main">
            <div className="form-section">
              <h2>
                Loading Portfolio Preview...
              </h2>

              <p>
                Please wait while we load your
                generated portfolio.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-main">
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
        </div>
      </main>
    );
  }

  if (!portfolio) {
    return null;
  }

  // =====================================================
  // GENERATED DATA CHECK
  // =====================================================

  if (!portfolio.generated_data) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-main">
            <div className="form-section">
              <h1>
                Portfolio Not Generated
              </h1>

              <p>
                Generate your portfolio first
                before opening the preview.
              </p>

              <Link
                href={`/dashboard/portfolio/${portfolioId}/generate`}
                className="save-portfolio-button"
                style={{
                  display: "inline-block",
                  marginTop: "20px",
                  textDecoration: "none",
                }}
              >
                Generate Portfolio
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const data = portfolio.generated_data;

  const design = data.design || {};

  const theme = design.theme || "Dark";

  const isDark =
    theme === "Dark" ||
    theme === "Black & White";

  const isBlue = theme === "Blue";
  const isPurple = theme === "Purple";
  const isGreen = theme === "Green";

  const accentClass = isBlue
    ? "preview-blue"
    : isPurple
    ? "preview-purple"
    : isGreen
    ? "preview-green"
    : "";

  const experienceItems =
    data.experience?.items || [];

  const educationItems =
    data.education?.items || [];

  const projectItems =
    data.projects?.items || [];

  const certificationItems =
    data.certifications?.items || [];

  // =====================================================
  // EXTRACT SOCIAL LINKS
  // =====================================================

  const socialLinks = getSocialLinks(
    resumeProfile,
    data
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main
      className={`portfolio-preview ${
        isDark
          ? "preview-dark"
          : "preview-light"
      } ${accentClass}`}
    >
      {/* ==========================================
          PREVIEW TOOLBAR
      ========================================== */}

      <div className="preview-toolbar">
        <Link
          href={`/dashboard/portfolio/${portfolioId}`}
          className="preview-toolbar-button"
        >
          ← Dashboard
        </Link>

        <div>
          <strong>
            {portfolio.title}
          </strong>

          <span
            style={{
              marginLeft: "10px",
              opacity: 0.7,
            }}
          >
            Preview
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/dashboard/portfolio/${portfolioId}/generate`}
            className="preview-toolbar-button"
          >
            ✨ Regenerate
          </Link>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="preview-toolbar-button"
            style={{
              border: "none",
              cursor: publishing
                ? "not-allowed"
                : "pointer",
              opacity: publishing
                ? 0.6
                : 1,
            }}
          >
            {publishing
              ? "Publishing..."
              : portfolio.is_published
              ? "🚀 Update Published"
              : "🚀 Publish"}
          </button>
        </div>
      </div>

      {/* ==========================================
          PUBLISHED URL
      ========================================== */}

      {publishedUrl && (
        <div
          style={{
            padding: "16px 24px",
            background:
              "rgba(34, 197, 94, 0.10)",
            borderBottom:
              "1px solid rgba(34, 197, 94, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <strong>
            🎉 Portfolio Published!
          </strong>

          <input
            type="text"
            value={publishedUrl}
            readOnly
            style={{
              minWidth: "320px",
              maxWidth: "600px",
              padding: "9px 12px",
              borderRadius: "8px",
              border:
                "1px solid rgba(128,128,128,0.4)",
              background: "transparent",
            }}
          />

          <button
            type="button"
            onClick={handleCopyUrl}
            className="preview-toolbar-button"
          >
            📋 Copy Link
          </button>

          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-toolbar-button"
          >
            🔗 Open
          </a>
        </div>
      )}

      {/* ==========================================
          PUBLISH ERROR
      ========================================== */}

      {publishError && (
        <div
          style={{
            padding: "12px 24px",
            textAlign: "center",
            color: "#dc2626",
            background:
              "rgba(220, 38, 38, 0.08)",
          }}
        >
          {publishError}
        </div>
      )}

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav className="preview-navigation">
        <div className="preview-nav-container">
          <div className="preview-logo">
            {portfolio.title}
          </div>

          <div className="preview-nav-links">
            {(data.navigation || [
              "Home",
              "About",
              "Skills",
              "Experience",
              "Projects",
              "Education",
              "Contact",
            ]).map((item) => (
              <a
                key={item}
                href={`#${item
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO
      ========================================== */}

      <section
        id="home"
        className="preview-section preview-hero"
      >
        <div
          className="preview-content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 500px",
            }}
          >
            <span className="preview-eyebrow">
              {data.hero?.subheadline ||
                "Welcome to my portfolio"}
            </span>

            <h1>
              {data.hero?.headline ||
                "Welcome to My Portfolio"}
            </h1>

            <p className="preview-hero-description">
              {data.hero?.description || ""}
            </p>

            <div className="preview-buttons">
              {data.hero?.primary_button && (
                <a
                  href="#projects"
                  className="preview-primary-button"
                >
                  {data.hero.primary_button}
                </a>
              )}

              {data.hero?.secondary_button && (
                <a
                  href="#contact"
                  className="preview-secondary-button"
                >
                  {data.hero.secondary_button}
                </a>
              )}
            </div>

            <SocialLinks
              links={socialLinks}
            />
          </div>

          {/* PROFILE PHOTO */}

          {profileImageUrl && (
            <div
              style={{
                flex: "0 0 220px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={profileImageUrl}
                alt="Profile"
                style={{
                  width: "220px",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border:
                    "4px solid rgba(255,255,255,0.2)",
                  boxShadow:
                    "0 15px 40px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          ABOUT
      ========================================== */}

      {data.about && (
        <section
          id="about"
          className="preview-section"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.about.title ||
                "About Me"
              }
            />

            <p className="preview-text">
              {data.about.content || ""}
            </p>
          </div>
        </section>
      )}

      {/* ==========================================
          SKILLS
      ========================================== */}

      {data.skills && (
        <section
          id="skills"
          className="preview-section preview-alt"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.skills.title ||
                "Skills"
              }
            />

            <div className="preview-grid">
              {(data.skills.items || []).map(
                (skill, index) => (
                  <div
                    className="preview-card"
                    key={`${skill}-${index}`}
                  >
                    <strong>
                      {skill}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          EXPERIENCE
      ========================================== */}

      {experienceItems.length > 0 && (
        <section
          id="experience"
          className="preview-section"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.experience?.title ||
                "Experience"
              }
            />

            <div className="preview-list">
              {experienceItems.map(
                (item, index) => (
                  <DynamicCard
                    key={index}
                    item={item}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          PROJECTS
      ========================================== */}

      {projectItems.length > 0 && (
        <section
          id="projects"
          className="preview-section preview-alt"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.projects?.title ||
                "Projects"
              }
            />

            <div className="preview-grid">
              {projectItems.map(
                (item, index) => (
                  <DynamicCard
                    key={index}
                    item={item}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          EDUCATION
      ========================================== */}

      {educationItems.length > 0 && (
        <section
          id="education"
          className="preview-section"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.education?.title ||
                "Education"
              }
            />

            <div className="preview-list">
              {educationItems.map(
                (item, index) => (
                  <DynamicCard
                    key={index}
                    item={item}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          CERTIFICATIONS
      ========================================== */}

      {certificationItems.length > 0 && (
        <section
          id="certifications"
          className="preview-section preview-alt"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.certifications?.title ||
                "Certifications"
              }
            />

            <div className="preview-grid">
              {certificationItems.map(
                (item, index) => (
                  <DynamicCard
                    key={index}
                    item={item}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          CONTACT
      ========================================== */}

      {data.contact && (
        <section
          id="contact"
          className="preview-section preview-contact"
        >
          <div className="preview-content">
            <SectionTitle
              title={
                data.contact.title ||
                "Let's Connect"
              }
            />

            <p className="preview-text">
              {data.contact.description ||
                ""}
            </p>

            <div className="preview-contact-grid">
              {data.contact.email && (
                <a
                  href={`mailto:${data.contact.email}`}
                  className="preview-contact-item"
                >
                  <strong>Email</strong>

                  <span>
                    {data.contact.email}
                  </span>
                </a>
              )}

              {data.contact.phone && (
                <a
                  href={`tel:${data.contact.phone}`}
                  className="preview-contact-item"
                >
                  <strong>Phone</strong>

                  <span>
                    {data.contact.phone}
                  </span>
                </a>
              )}

              {data.contact.location && (
                <div className="preview-contact-item">
                  <strong>
                    Location
                  </strong>

                  <span>
                    {data.contact.location}
                  </span>
                </div>
              )}
            </div>

            <SocialLinks
              links={socialLinks}
            />
          </div>
        </section>
      )}

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="preview-footer">
        <p>
          © {new Date().getFullYear()}{" "}
          {portfolio.title}. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}

/* ==================================================
   SOCIAL LINK EXTRACTION
================================================== */

function getSocialLinks(
  profile: ResumeProfile | null,
  portfolioData: PortfolioData
): SocialLinks {
  const result: SocialLinks = {};

  const generatedLinks =
    portfolioData.social_links || {};

  const getValue = (
    keys: string[]
  ): string => {
    if (!profile) return "";

    for (const key of keys) {
      const value = profile[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  };

  result.linkedin =
    getValue([
      "linkedin_url",
      "linkedin",
      "linkedin_profile",
      "linkedin_link",
    ]) ||
    generatedLinks.linkedin ||
    "";

  result.github =
    getValue([
      "github_url",
      "github",
      "github_profile",
      "github_link",
    ]) ||
    generatedLinks.github ||
    "";

  result.hackerrank =
    getValue([
      "hackerrank_url",
      "hackerrank",
      "hacker_rank_url",
      "hacker_rank",
      "hackerrank_profile",
    ]) ||
    generatedLinks.hackerrank ||
    "";

  result.leetcode =
    getValue([
      "leetcode_url",
      "leetcode",
      "leetcode_profile",
      "leetcode_link",
    ]) ||
    generatedLinks.leetcode ||
    "";

  result.portfolio =
    getValue([
      "portfolio_url",
      "portfolio",
      "personal_website",
      "website",
      "website_url",
    ]) ||
    generatedLinks.portfolio ||
    "";

  return result;
}

/* ==================================================
   SOCIAL LINKS COMPONENT
================================================== */

function SocialLinks({
  links,
}: {
  links: SocialLinks;
}) {
  const availableLinks = [
    {
      label: "LinkedIn",
      icon: "in",
      url: links.linkedin,
    },
    {
      label: "GitHub",
      icon: "Git",
      url: links.github,
    },
    {
      label: "HackerRank",
      icon: "HR",
      url: links.hackerrank,
    },
    {
      label: "LeetCode",
      icon: "LC",
      url: links.leetcode,
    },
    {
      label: "Website",
      icon: "Web",
      url: links.portfolio,
    },
  ].filter(
    (item) => item.url
  );

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "24px",
      }}
    >
      {availableLinks.map((item) => (
        <a
          key={item.label}
          href={normalizeUrl(item.url!)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 14px",
            borderRadius: "8px",
            border:
              "1px solid rgba(128,128,128,0.35)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontSize: "12px",
              opacity: 0.75,
            }}
          >
            {item.icon}
          </span>

          {item.label}
        </a>
      ))}
    </div>
  );
}

/* ==================================================
   NORMALIZE URL
================================================== */

function normalizeUrl(
  value: string
): string {
  const trimmed = value.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/* ==================================================
   SECTION TITLE
================================================== */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div className="preview-section-title">
      <span />
      <h2>{title}</h2>
    </div>
  );
}

/* ==================================================
   DYNAMIC CARD
================================================== */

function DynamicCard({
  item,
}: {
  item: Record<string, unknown>;
}) {
  const entries = Object.entries(item);

  return (
    <article className="preview-card">
      {entries.map(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return null;
        }

        if (
          typeof value === "object"
        ) {
          return null;
        }

        const label = key
          .replace(/_/g, " ")
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          );

        return (
          <div
            key={key}
            className="preview-card-field"
          >
            <span>{label}</span>

            <p>
              {String(value)}
            </p>
          </div>
        );
      })}
    </article>
  );
}