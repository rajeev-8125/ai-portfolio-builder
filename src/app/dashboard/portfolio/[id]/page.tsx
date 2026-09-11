
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

import {
  updatePortfolio,
  deletePortfolio,
  setPortfolioPublished,
  saveResumeFile,
} from "@/lib/database/portfolio";

type Portfolio = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
};

export default function PortfolioManagementPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const portfolioId = params.id as string;

  const [portfolio, setPortfolio] =
    useState<Portfolio | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] =
    useState(false);

  // Resume states
  const [uploadingResume, setUploadingResume] =
    useState(false);

  const [resumeFileName, setResumeFileName] =
    useState("");

  const [resumeError, setResumeError] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD PORTFOLIO
  // =====================================================

  useEffect(() => {
    if (portfolioId) {
      loadPortfolio();
    }
  }, [portfolioId]);

  async function loadPortfolio() {
    setLoading(true);
    setError("");

    try {
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

      const {
        data,
        error: portfolioError,
      } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .single();

      if (portfolioError) {
        console.error(
          "Portfolio loading error:",
          portfolioError
        );

        setError(
          "Portfolio not found or you don't have access to it."
        );

        setLoading(false);
        return;
      }

      setPortfolio(data);

      setTitle(data.title);
      setSlug(data.slug);
      setDescription(data.description ?? "");

      // Load existing resume
      const {
        data: resumeData,
        error: resumeLoadError,
      } = await supabase
        .from("resume_data")
        .select("resume_file_name")
        .eq("portfolio_id", portfolioId)
        .maybeSingle();

      if (resumeLoadError) {
        console.error(
          "Resume information loading error:",
          resumeLoadError
        );
      }

      if (resumeData?.resume_file_name) {
        setResumeFileName(
          resumeData.resume_file_name
        );
      }

      setLoading(false);
    } catch (error) {
      console.error(
        "Portfolio loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load portfolio."
      );

      setLoading(false);
    }
  }

  // =====================================================
  // AI ANALYSIS
  // =====================================================

  async function analyzeResumeWithAI(
    resumeText: string
  ) {
    try {
      setSuccess(
        "Resume extracted. AI is analyzing your resume..."
      );

      const response = await fetch(
        "/api/analyze-resume",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to analyze resume."
        );
      }

      console.log(
        "AI Resume Analysis:",
        result.data
      );

      setSuccess(
        "Resume analyzed successfully."
      );

      return result.data;
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      if (error instanceof Error) {
        setResumeError(error.message);
      } else {
        setResumeError(
          "Failed to analyze resume."
        );
      }

      return null;
    }
  }

  // =====================================================
  // RESUME UPLOAD
  // =====================================================

  async function handleResumeUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setResumeError("");
    setError("");
    setSuccess("");

    // File type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setResumeError(
        "Please upload a PDF or DOCX file."
      );

      event.target.value = "";
      return;
    }

    // File size
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setResumeError(
        "Resume file must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setUploadingResume(true);

    try {
      // Get user
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

      // File extension
      const fileExtension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "pdf";

      // Storage path
      const filePath =
        `${user.id}/${portfolioId}/` +
        `${Date.now()}-resume.${fileExtension}`;

      // Upload
      const {
        error: uploadError,
      } = await supabase.storage
        .from("resume-files")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: true,
          }
        );

      if (uploadError) {
        throw uploadError;
      }

      // Save file information
      await saveResumeFile(
        portfolioId,
        file.name,
        filePath
      );

      // Extract text
      setSuccess(
        "Resume uploaded. Extracting text..."
      );

      const extractResponse =
        await fetch(
          "/api/resume/extract",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              portfolioId,
            }),
          }
        );

      const extractResult =
        await extractResponse.json();

      if (!extractResponse.ok) {
        throw new Error(
          extractResult.error ||
            "Resume text extraction failed."
        );
      }

      const extractedText =
        extractResult.text;

      console.log(
        "Extracted resume text:",
        extractedText
      );

      if (
        !extractedText ||
        !extractedText.trim()
      ) {
        throw new Error(
          "Resume text could not be extracted."
        );
      }

      // AI analysis
      const analyzedData =
        await analyzeResumeWithAI(
          extractedText
        );

      if (!analyzedData) {
        throw new Error(
          "Resume was extracted, but AI analysis failed."
        );
      }

      console.log(
        "Analyzed resume data:",
        analyzedData
      );

      // Prepare profile data
      const profileData = {
        portfolio_id: portfolioId,

        full_name:
          analyzedData.full_name ??
          null,

        email:
          analyzedData.email ??
          null,

        phone:
          analyzedData.phone ??
          null,

        location:
          analyzedData.location ??
          null,

        summary:
          analyzedData.summary ??
          null,

        skills:
          Array.isArray(
            analyzedData.skills
          )
            ? analyzedData.skills
            : [],

        education:
          Array.isArray(
            analyzedData.education
          )
            ? analyzedData.education
            : [],

        experience:
          Array.isArray(
            analyzedData.experience
          )
            ? analyzedData.experience
            : [],

        projects:
          Array.isArray(
            analyzedData.projects
          )
            ? analyzedData.projects
            : [],

        certifications:
          Array.isArray(
            analyzedData.certifications
          )
            ? analyzedData.certifications
            : [],

        updated_at:
          new Date().toISOString(),
      };

      console.log(
        "Saving resume profile:",
        profileData
      );

      // Save profile
      const {
        data: savedProfile,
        error: profileError,
      } = await supabase
        .from("resume_profiles")
        .upsert(
          profileData,
          {
            onConflict:
              "portfolio_id",
          }
        )
        .select()
        .single();

      if (profileError) {
        console.error(
          "Resume profile save error:",
          profileError
        );

        throw new Error(
          profileError.message ||
            "Resume profile could not be saved."
        );
      }

      console.log(
        "Resume profile saved:",
        savedProfile
      );

      setResumeFileName(
        file.name
      );

      setSuccess(
        "Resume uploaded and analyzed successfully."
      );
    } catch (error) {
      console.error(
        "Resume processing error:",
        error
      );

      if (error instanceof Error) {
        setResumeError(
          error.message
        );
      } else {
        setResumeError(
          "Failed to upload or process resume."
        );
      }
    } finally {
      setUploadingResume(false);

      event.target.value = "";
    }
  }

  // =====================================================
  // SAVE PORTFOLIO
  // =====================================================

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError(
        "Portfolio title is required."
      );
      return;
    }

    if (!slug.trim()) {
      setError(
        "Portfolio slug is required."
      );
      return;
    }

    setSaving(true);

    try {
      const updated =
        await updatePortfolio(
          portfolioId,
          title.trim(),
          slug.trim().toLowerCase(),
          description.trim()
        );

      setPortfolio(updated);

      setTitle(updated.title);
      setSlug(updated.slug);
      setDescription(
        updated.description ?? ""
      );

      setSuccess(
        "Portfolio updated successfully."
      );
    } catch (error) {
      console.error(
        "Portfolio update error:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to update portfolio."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // GENERATE PORTFOLIO
  // =====================================================

  function handleGeneratePortfolio() {
    router.push(
      `/dashboard/portfolio/${portfolioId}/generate`
    );
  }

  // =====================================================
  // EDIT RESUME INFORMATION
  // =====================================================

  function handleEditResumeInformation() {
    router.push(
      `/dashboard/portfolio/${portfolioId}/profile`
    );
  }

  // =====================================================
  // PUBLISH / UNPUBLISH
  // =====================================================

  async function handlePublishToggle() {
    if (!portfolio) {
      return;
    }

    setError("");
    setSuccess("");
    setPublishing(true);

    try {
      const updated =
        await setPortfolioPublished(
          portfolio.id,
          !portfolio.is_published
        );

      setPortfolio(updated);

      setSuccess(
        updated.is_published
          ? "Portfolio published successfully."
          : "Portfolio unpublished successfully."
      );
    } catch (error) {
      console.error(
        "Publish error:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to update publishing status."
        );
      }
    } finally {
      setPublishing(false);
    }
  }

  // =====================================================
  // DELETE PORTFOLIO
  // =====================================================

  async function handleDelete() {
    if (!portfolio) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this portfolio? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      await deletePortfolio(
        portfolio.id
      );

      router.push("/dashboard");
    } catch (error) {
      console.error(
        "Portfolio delete error:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to delete portfolio."
        );
      }

      setDeleting(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="portfolio-management-page">
        <div className="portfolio-management-container">
          <div className="portfolio-loading">
            Loading portfolio...
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PORTFOLIO NOT FOUND
  // =====================================================

  if (!portfolio) {
    return (
      <main className="portfolio-management-page">
        <div className="portfolio-management-container">
          <div className="dashboard-error">
            {error}
          </div>

          <Link
            href="/dashboard"
            className="back-dashboard-link"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="portfolio-management-page">
      <div className="portfolio-management-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="portfolio-management-topbar">
          <div>
            <h1>
              Portfolio Management
            </h1>

            <p>
              Manage your portfolio, resume and
              design your professional website.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="back-dashboard-button"
          >
            ← &nbsp; Back to Dashboard
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
            RESUME
        ================================================= */}

        <section className="management-card">

          <div className="management-card-header">

            <div className="management-icon">
              📄
            </div>

            <div>
              <h2>
                Resume
              </h2>

              <p>
                Upload or replace your resume.
                AI will extract your information
                automatically.
              </p>
            </div>

          </div>

          {resumeError && (
            <div className="resume-error">
              {resumeError}
            </div>
          )}

          {resumeFileName ? (
            <div className="resume-file-box">

              <div className="resume-file-left">

                <div className="resume-file-icon">
                  PDF
                </div>

                <div>
                  <strong>
                    {resumeFileName}
                  </strong>

                  <span>
                    Resume uploaded
                  </span>
                </div>

              </div>

              <label className="replace-resume-button">

                ↻ &nbsp;
                {uploadingResume
                  ? "Processing..."
                  : "Replace Resume"}

                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={
                    handleResumeUpload
                  }
                  disabled={
                    uploadingResume
                  }
                  hidden
                />

              </label>

            </div>
          ) : (
            <label className="upload-resume-button">

              {uploadingResume
                ? "Processing Resume..."
                : "Upload Resume"}

              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={
                  handleResumeUpload
                }
                disabled={
                  uploadingResume
                }
                hidden
              />

            </label>
          )}

          <small className="resume-upload-help">
            PDF or DOCX • Maximum 5 MB
          </small>

        </section>

        {/* =================================================
            PORTFOLIO INFORMATION
        ================================================= */}

        <section className="management-card">

          <div className="management-card-header">

            <div className="management-icon">
              ℹ
            </div>

            <div>
              <h2>
                Portfolio Information
              </h2>

              <p>
                Update your portfolio information
                and description.
              </p>
            </div>

          </div>

          <form
            onSubmit={handleSave}
            className="portfolio-information-form"
          >

            <div className="portfolio-information-grid">

              {/* Title */}

              <label>
                <span>
                  Portfolio Title
                </span>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Rajeev's Portfolio"
                />
              </label>

              {/* URL */}

              <label>
                <span>
                  Portfolio URL
                </span>

                <div className="portfolio-url-input">

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
                    placeholder="rajeev-portfolio"
                  />

                </div>
              </label>

              {/* Description */}

              <label>
                <span>
                  Description
                  <small>
                    {" "} (Optional)
                  </small>
                </span>

                <input
                  type="text"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Full Stack Developer | Building modern web applications"
                />
              </label>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="save-portfolio-button"
            >
              💾 &nbsp;
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </form>

        </section>

        {/* =================================================
            YOUR INFORMATION
        ================================================= */}

        <section className="management-card information-card">

          <div className="information-card-content">

            <div>

              <div className="management-card-header">

                <div className="management-icon">
                  👤
                </div>

                <div>
                  <h2>
                    Your Information
                  </h2>

                  <p>
                    AI extracted your information
                    from the resume. Review it,
                    correct anything, or add more
                    information manually.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleEditResumeInformation
                }
                className="edit-information-button"
              >
                ✎ &nbsp;
                Edit Resume Information
              </button>

            </div>

            <div className="information-illustration">
              👤
              <br />
              ───
              <br />
              ───
              <br />
              ───
            </div>

          </div>

        </section>

        {/* =================================================
            GENERATE YOUR PORTFOLIO
        ================================================= */}

        <section className="management-card generate-card">

          <div className="generate-card-content">

            <div>

              <div className="management-card-header">

                <div className="management-icon">
                  🚀
                </div>

                <div>
                  <h2>
                    Generate Your Portfolio
                  </h2>

                  <p>
                    AI will combine your resume
                    information and design preferences
                    to create your portfolio.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleGeneratePortfolio
                }
                className="generate-portfolio-button"
              >
                🚀 &nbsp;
                Generate My Portfolio
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

        {/* =================================================
            PORTFOLIO ACTIONS
        ================================================= */}

        <section className="management-card portfolio-actions-card">

          <div className="management-card-header">

            <div className="management-icon">
              ⚙
            </div>

            <div>
              <h2>
                Portfolio Actions
              </h2>
            </div>

          </div>

          <div className="action-row">

            <button
              type="button"
              onClick={
                handlePublishToggle
              }
              disabled={publishing}
              className="publish-button"
            >
              🌐 &nbsp;
              {publishing
                ? "Updating..."
                : portfolio.is_published
                ? "Unpublish Portfolio"
                : "Publish Portfolio"}
            </button>

            <button
              type="button"
              onClick={
                handleDelete
              }
              disabled={deleting}
              className="delete-button"
            >
              🗑 &nbsp;
              {deleting
                ? "Deleting..."
                : "Delete Portfolio"}
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}