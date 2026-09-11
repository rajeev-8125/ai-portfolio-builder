"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { createPortfolio } from "@/lib/database/portfolio";

type Portfolio = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState("");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    setUserEmail(user.email ?? "");

    const { data, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (portfolioError) {
      setError(portfolioError.message);
      setLoading(false);
      return;
    }

    setPortfolios(data ?? []);
    setLoading(false);
  }

  async function handleCreatePortfolio(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a portfolio name.");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter a portfolio URL.");
      return;
    }

    setCreating(true);

    try {
      const portfolio = await createPortfolio(
        title.trim(),
        slug.trim().toLowerCase()
      );

      setPortfolios((current) => [
        portfolio,
        ...current,
      ]);

      setTitle("");
      setSlug("");
      setShowCreateForm(false);
    } catch (error) {
  console.error("Create portfolio error:", error);

  if (error instanceof Error) {
    setError(error.message);
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    setError(String(error.message));
  } else {
    setError(JSON.stringify(error));
  }
}
    finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">

        {/* Header */}

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back, {userEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </header>

        {/* Main */}

        <section className="dashboard-main">

          <div className="dashboard-title-row">
            <div>
              <h2>Your Portfolios</h2>

              <p>
                Create and manage your professional
                portfolios.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateForm(true)
              }
              className="create-portfolio-button"
            >
              + Create Portfolio
            </button>
          </div>

          {/* Error */}

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {/* Create Form */}

          {showCreateForm && (
            <div className="create-portfolio-card">

              <h3>Create a Portfolio</h3>

              <form
                onSubmit={handleCreatePortfolio}
                className="portfolio-form"
              >

                <label>
                  Portfolio Name

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="Rajeev's Portfolio"
                    required
                  />
                </label>

                <label>
                  Portfolio URL

                  <div className="slug-input">
                    <span>
                      /portfolio/
                    </span>

                    <input
                      type="text"
                      value={slug}
                      onChange={(event) =>
                        setSlug(
                          event.target.value
                            .toLowerCase()
                            .replace(
                              /[^a-z0-9-]/g,
                              "-"
                            )
                        )
                      }
                      placeholder="rajeev"
                      required
                    />
                  </div>
                </label>

                <div className="portfolio-form-actions">

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setTitle("");
                      setSlug("");
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="save-portfolio-button"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Portfolio"}
                  </button>

                </div>

              </form>
            </div>
          )}

          {/* Portfolio List */}

          {portfolios.length === 0 &&
          !showCreateForm ? (
            <div className="empty-portfolio">

              <div className="empty-icon">
                +
              </div>

              <h3>
                Create your first portfolio
              </h3>

              <p>
                Upload your resume, choose a design,
                and we'll turn it into a professional
                website.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCreateForm(true)
                }
                className="create-portfolio-button"
              >
                Create My Portfolio
              </button>

            </div>
          ) : (
            <div className="portfolio-grid">

              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="portfolio-card"
                >

                  <div className="portfolio-card-header">
                    <h3>
                      {portfolio.title}
                    </h3>

                    <span
                      className={
                        portfolio.is_published
                          ? "status-published"
                          : "status-draft"
                      }
                    >
                      {portfolio.is_published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>

                  <p>
                    /portfolio/{portfolio.slug}
                  </p>

                  <div className="portfolio-card-actions">

                    <Link
                      href={`/dashboard/portfolio/${portfolio.id}`}
                      className="manage-button"
                    >
                      Manage
                    </Link>

                    {portfolio.is_published && (
                      <Link
                        href={`/portfolio/${portfolio.slug}`}
                        target="_blank"
                        className="view-button"
                      >
                        View
                      </Link>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>
      </div>
    </main>
  );
}