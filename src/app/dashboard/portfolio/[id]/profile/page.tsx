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
  getCertifications,
  addCertification,
  deleteCertification,
  getCertificateViewUrl,
  saveProfileImage,
} from "@/lib/database/portfolio";

type Education = {
  degree?: string;
  institution?: string;
  year?: string;
  description?: string;
};

type Experience = {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
};

type Project = {
  name?: string;
  description?: string;
  technologies?: string[];
  url?: string;
};

type SocialLink = {
  platform: string;
  url: string;
};

type Certification = {
  id: string;
  name: string;
  organization: string | null;
  issue_date: string | null;
  credential_url: string | null;
  file_name: string | null;
  file_path: string | null;
};

type ResumeProfile = {
  id?: string;
  portfolio_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  social_links: SocialLink[];
  profile_image_name?: string | null;
  profile_image_path?: string | null;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const portfolioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] =
    useState<ResumeProfile | null>(null);

  const [photoPreview, setPhotoPreview] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [education, setEducation] =
    useState<Education[]>([]);

  const [experience, setExperience] =
    useState<Experience[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [certifications, setCertifications] =
    useState<Certification[]>([]);

  /* ---------------------------------------------
     SOCIAL LINKS
  --------------------------------------------- */

  const [socialLinks, setSocialLinks] =
    useState<SocialLink[]>([]);

  const [socialPlatform, setSocialPlatform] =
    useState("LinkedIn");

  const [socialUrl, setSocialUrl] = useState("");

  /* ---------------------------------------------
     CERTIFICATE STATES
  --------------------------------------------- */

  const [certificateName, setCertificateName] =
    useState("");

  const [certificateOrganization, setCertificateOrganization] =
    useState("");

  const [certificateDate, setCertificateDate] =
    useState("");

  const [certificateUrl, setCertificateUrl] =
    useState("");

  const [certificateFile, setCertificateFile] =
    useState<File | null>(null);

  useEffect(() => {
    if (portfolioId) {
      loadProfile();
    }
  }, [portfolioId]);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  async function loadProfile() {
    setLoading(true);
    setError("");
    setSuccess("");

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

      /* ---------------------------------------------
         VERIFY PORTFOLIO OWNERSHIP
      --------------------------------------------- */

      const {
        data: portfolio,
        error: portfolioError,
      } = await supabase
        .from("portfolios")
        .select("id")
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (portfolioError) {
        throw new Error(
          portfolioError.message ||
            "Unable to load portfolio."
        );
      }

      if (!portfolio) {
        throw new Error(
          "Portfolio not found or access denied."
        );
      }

      /* ---------------------------------------------
         LOAD RESUME PROFILE
      --------------------------------------------- */

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
          profileError.message ||
            "Unable to load resume profile."
        );
      }

      if (profileData) {
        const loadedSocialLinks =
          Array.isArray(profileData.social_links)
            ? profileData.social_links
            : [];

        const loadedProfile: ResumeProfile = {
          ...profileData,
          skills: Array.isArray(profileData.skills)
            ? profileData.skills
            : [],
          education: Array.isArray(profileData.education)
            ? profileData.education
            : [],
          experience: Array.isArray(profileData.experience)
            ? profileData.experience
            : [],
          projects: Array.isArray(profileData.projects)
            ? profileData.projects
            : [],
          certifications: [],
          social_links: loadedSocialLinks,
        };

        setProfile(loadedProfile);

        setFullName(profileData.full_name ?? "");
        setEmail(profileData.email ?? "");
        setPhone(profileData.phone ?? "");
        setLocation(profileData.location ?? "");
        setSummary(profileData.summary ?? "");

        setSkills(
          Array.isArray(profileData.skills)
            ? profileData.skills
            : []
        );

        setEducation(
          Array.isArray(profileData.education)
            ? profileData.education
            : []
        );

        setExperience(
          Array.isArray(profileData.experience)
            ? profileData.experience
            : []
        );

        setProjects(
          Array.isArray(profileData.projects)
            ? profileData.projects
            : []
        );

        setSocialLinks(loadedSocialLinks);

        /* ---------------------------------------------
           PROFILE IMAGE
        --------------------------------------------- */

        if (profileData.profile_image_path) {
          const { data: publicUrlData } =
            supabase.storage
              .from("profile-images")
              .getPublicUrl(
                profileData.profile_image_path
              );

          setPhotoPreview(
            publicUrlData.publicUrl
          );
        }
      }

      /* ---------------------------------------------
         LOAD CERTIFICATIONS
      --------------------------------------------- */

      try {
        const certificationData =
          await getCertifications(portfolioId);

        setCertifications(
          Array.isArray(certificationData)
            ? certificationData
            : []
        );
      } catch (certificateError) {
        console.error(
          "Certification loading error:",
          certificateError
        );

        setCertifications([]);
      }
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  /* =========================================================
     PROFILE PHOTO
  ========================================================= */

  async function handleProfilePhoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearMessages();

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a JPG, PNG, or WEBP image."
      );

      event.target.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Profile image must be smaller than 2 MB."
      );

      event.target.value = "";
      return;
    }

    const localPreview =
      URL.createObjectURL(file);

    setPhotoPreview(localPreview);
    setUploadingPhoto(true);

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

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/${portfolioId}/` +
        `profile-${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("profile-images")
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

      await saveProfileImage(
        portfolioId,
        file.name,
        filePath
      );

      const { data: publicUrlData } =
        supabase.storage
          .from("profile-images")
          .getPublicUrl(filePath);

      setPhotoPreview(
        publicUrlData.publicUrl
      );

      setProfile((current) => ({
        ...(current ?? {
          portfolio_id: portfolioId,
          full_name: null,
          email: null,
          phone: null,
          location: null,
          summary: null,
          skills: [],
          education: [],
          experience: [],
          projects: [],
          certifications: [],
          social_links: [],
        }),
        profile_image_name: file.name,
        profile_image_path: filePath,
      }));

      setSuccess(
        "Profile photo updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile photo error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  /* =========================================================
     SKILLS
  ========================================================= */

  function addSkill() {
    const skill = skillInput.trim();

    if (!skill) {
      return;
    }

    if (
      skills.some(
        (item) =>
          item.toLowerCase() ===
          skill.toLowerCase()
      )
    ) {
      setSkillInput("");
      return;
    }

    setSkills((current) => [
      ...current,
      skill,
    ]);

    setSkillInput("");
  }

  function removeSkill(index: number) {
    setSkills((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =========================================================
     EDUCATION
  ========================================================= */

  function updateEducation(
    index: number,
    field: keyof Education,
    value: string
  ) {
    setEducation((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addEducation() {
    setEducation((current) => [
      ...current,
      {
        degree: "",
        institution: "",
        year: "",
        description: "",
      },
    ]);
  }

  function removeEducation(index: number) {
    setEducation((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =========================================================
     EXPERIENCE
  ========================================================= */

  function updateExperience(
    index: number,
    field: keyof Experience,
    value: string
  ) {
    setExperience((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addExperience() {
    setExperience((current) => [
      ...current,
      {
        company: "",
        role: "",
        duration: "",
        description: "",
      },
    ]);
  }

  function removeExperience(index: number) {
    setExperience((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =========================================================
     PROJECTS
  ========================================================= */

  function updateProject(
    index: number,
    field: keyof Project,
    value: string
  ) {
    setProjects((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "technologies"
                  ? value
                      .split(",")
                      .map((tech) =>
                        tech.trim()
                      )
                      .filter(Boolean)
                  : value,
            }
          : item
      )
    );
  }

  function addProject() {
    setProjects((current) => [
      ...current,
      {
        name: "",
        description: "",
        technologies: [],
        url: "",
      },
    ]);
  }

  function removeProject(index: number) {
    setProjects((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =========================================================
     SOCIAL LINKS
  ========================================================= */

  function addSocialLink() {
    const url = socialUrl.trim();

    if (!url) {
      setError("Please enter a social profile URL.");
      return;
    }

    let finalUrl = url;

    if (
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://")
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    const duplicate = socialLinks.some(
      (link) =>
        link.url.toLowerCase() ===
        finalUrl.toLowerCase()
    );

    if (duplicate) {
      setError("This social link has already been added.");
      return;
    }

    setSocialLinks((current) => [
      ...current,
      {
        platform: socialPlatform,
        url: finalUrl,
      },
    ]);

    setSocialUrl("");
    clearMessages();
  }

  function removeSocialLink(index: number) {
    setSocialLinks((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  function updateSocialLink(
    index: number,
    field: keyof SocialLink,
    value: string
  ) {
    setSocialLinks((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function handleSaveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();
    setSaving(true);

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

      const profileData = {
        portfolio_id: portfolioId,

        full_name:
          fullName.trim() || null,

        email:
          email.trim() || null,

        phone:
          phone.trim() || null,

        location:
          location.trim() || null,

        summary:
          summary.trim() || null,

        skills,

        education,

        experience,

        projects,

        social_links: socialLinks,

        updated_at:
          new Date().toISOString(),
      };

      const {
        data,
        error: saveError,
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

      if (saveError) {
        throw saveError;
      }

      setProfile((current) => ({
        ...(current ?? {}),
        ...data,
        certifications,
        social_links: socialLinks,
      }) as ResumeProfile);

      setSuccess(
        "Your resume information has been saved successfully."
      );

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CERTIFICATE FILE
  ========================================================= */

  function handleCertificateFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setCertificateFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Certificate must be a PDF, JPG, PNG, or WEBP file."
      );

      event.target.value = "";
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Certificate file must be smaller than 10 MB."
      );

      event.target.value = "";
      return;
    }

    clearMessages();
    setCertificateFile(file);
  }

  async function handleAddCertificate() {
    setError("");
    setSuccess("");

    if (!certificateName.trim()) {
      setError("Certificate name is required.");
      return;
    }

    if (!certificateFile) {
      setError("Please select a certificate file.");
      return;
    }

    setUploadingCertificate(true);

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

      const extension =
        certificateFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "pdf";

      const filePath =
        `${user.id}/${portfolioId}/` +
        `${Date.now()}-certificate.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("certificate-files")
          .upload(
            filePath,
            certificateFile,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const certificate =
        await addCertification(
          portfolioId,
          certificateName.trim(),
          certificateOrganization.trim(),
          certificateDate,
          certificateUrl.trim(),
          certificateFile.name,
          filePath
        );

      setCertifications((current) => [
        certificate,
        ...current,
      ]);

      setCertificateName("");
      setCertificateOrganization("");
      setCertificateDate("");
      setCertificateUrl("");
      setCertificateFile(null);

      setSuccess(
        "Certificate added successfully."
      );
    } catch (err) {
      console.error(
        "Certificate upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload certificate."
      );
    } finally {
      setUploadingCertificate(false);
    }
  }

  async function handleViewCertificate(
    filePath: string
  ) {
    try {
      const url =
        await getCertificateViewUrl(
          filePath
        );

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error(
        "Certificate view error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to open certificate."
      );
    }
  }

  async function handleDownloadCertificate(
    filePath: string,
    fileName: string | null
  ) {
    try {
      const url =
        await getCertificateViewUrl(
          filePath
        );

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Certificate download failed."
        );
      }

      const blob =
        await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement("a");

      anchor.href = downloadUrl;

      anchor.download =
        fileName || "certificate";

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (err) {
      console.error(
        "Certificate download error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download certificate."
      );
    }
  }

  async function handleDeleteCertificate(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this certificate?"
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await deleteCertification(id);

      setCertifications((current) =>
        current.filter(
          (certificate) =>
            certificate.id !== id
        )
      );

      setSuccess(
        "Certificate deleted successfully."
      );
    } catch (err) {
      console.error(
        "Certificate delete error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete certificate."
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading-screen">
          <div className="loading-spinner" />

          <h2>
            Loading your profile
          </h2>

          <p>
            Preparing your resume information...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* HEADER */}

        <header className="modern-profile-header">
          <div className="header-left">

            <Link
              href={`/dashboard/portfolio/${portfolioId}`}
              className="profile-back-link"
            >
              <span>←</span>
              Portfolio Management
            </Link>

            <div className="header-title">

              <div className="header-badge">
                Resume Editor
              </div>

              <h1>
                Edit Resume Information
              </h1>

              <p>
                Review your AI extracted
                information and build a
                polished professional profile.
              </p>

            </div>
          </div>

          <div className="header-profile-mini">

            <div className="mini-avatar">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                />
              ) : (
                fullName
                  ? fullName
                      .charAt(0)
                      .toUpperCase()
                  : "U"
              )}
            </div>

            <div>
              <strong>
                {fullName || "Your Profile"}
              </strong>

              <span>
                {email ||
                  "Complete your information"}
              </span>
            </div>

          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="profile-alert profile-alert-error">

            <div className="alert-icon">
              !
            </div>

            <div>
              <strong>
                Something went wrong
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="profile-alert profile-alert-success">

            <div className="alert-icon">
              ✓
            </div>

            <div>
              <strong>
                Changes saved
              </strong>

              <span>
                {success}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ×
            </button>

          </div>
        )}

        <form
          onSubmit={handleSaveProfile}
          className="profile-editor-form"
        >

          {/* =================================================
              AI EXTRACTION REVIEW
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                AI
              </div>

              <div>
                <h2>
                  AI Extraction Review
                </h2>

                <p>
                  Review everything extracted
                  from your resume before your
                  portfolio is generated.
                </p>
              </div>

            </div>

            <div
              className="profile-alert profile-alert-success"
              style={{
                marginBottom: "20px",
              }}
            >

              <div className="alert-icon">
                ✓
              </div>

              <div>
                <strong>
                  Review your extracted information
                </strong>

                <span>
                  AI extraction can sometimes
                  miss or misunderstand information.
                  Check each section and make any
                  corrections below.
                </span>
              </div>

            </div>

            <div className="modern-form-grid">

              <label className="modern-field">
                <span>
                  Extracted full name
                </span>

                <input
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="modern-field">
                <span>
                  Extracted email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="modern-field">
                <span>
                  Extracted phone
                </span>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="modern-field">
                <span>
                  Extracted location
                </span>

                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                />
              </label>

            </div>

            <div
              className="empty-inline"
              style={{
                marginTop: "18px",
              }}
            >
              ✓ Personal information reviewed
              · ✓ Skills reviewed · ✓ Education
              reviewed · ✓ Experience reviewed ·
              ✓ Projects reviewed
            </div>

          </section>

          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <section className="modern-profile-card profile-photo-card">

            <div className="section-heading">

              <div className="section-number">
                01
              </div>

              <div>
                <h2>
                  Profile Photo
                </h2>

                <p>
                  Use a clear professional photo
                  to personalize your portfolio.
                </p>
              </div>

            </div>

            <div className="photo-editor">

              <div className="large-profile-preview">

                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                  />
                ) : (
                  <div className="profile-placeholder">
                    {fullName
                      ? fullName
                          .charAt(0)
                          .toUpperCase()
                      : "👤"}
                  </div>
                )}

              </div>

              <div className="photo-editor-content">

                <span className="photo-label">
                  Profile picture
                </span>

                <h3>
                  Make your profile memorable
                </h3>

                <p>
                  A professional image helps
                  recruiters and visitors
                  connect with your portfolio.
                </p>

                <label className="primary-upload-button">

                  <span>
                    {uploadingPhoto
                      ? "Uploading photo..."
                      : photoPreview
                      ? "Replace photo"
                      : "Upload photo"}
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleProfilePhoto
                    }
                    disabled={
                      uploadingPhoto
                    }
                    hidden
                  />

                </label>

                <small>
                  JPG, PNG or WEBP · Maximum 2 MB
                </small>

              </div>
            </div>
          </section>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                02
              </div>

              <div>
                <h2>
                  Personal Information
                </h2>

                <p>
                  The basic information displayed
                  on your professional portfolio.
                </p>
              </div>

            </div>

            <div className="modern-form-grid">

              <label className="modern-field">
                <span>
                  Full name
                </span>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Rajeev Thotakura"
                />
              </label>

              <label className="modern-field">
                <span>
                  Email address
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="rajeev@example.com"
                />
              </label>

              <label className="modern-field">
                <span>
                  Phone number
                </span>

                <input
                  type="text"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="modern-field">
                <span>
                  Location
                </span>

                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="Chennai, India"
                />
              </label>

            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                03
              </div>

              <div>
                <h2>
                  Professional Summary
                </h2>

                <p>
                  Give visitors a quick
                  introduction to your background,
                  strengths and career goals.
                </p>
              </div>

            </div>

            <label className="modern-field">

              <span>
                About you
              </span>

              <textarea
                value={summary}
                onChange={(event) =>
                  setSummary(
                    event.target.value
                  )
                }
                rows={7}
                placeholder="Write a concise professional summary..."
              />

              <small className="field-hint">
                Keep it clear, professional and
                focused on your strongest qualities.
              </small>

            </label>

          </section>

          {/* =================================================
              SKILLS
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                04
              </div>

              <div>
                <h2>
                  Skills & Technologies
                </h2>

                <p>
                  Highlight the tools, technologies
                  and professional skills you know.
                </p>
              </div>

            </div>

            <div className="skill-editor">

              <input
                type="text"
                value={skillInput}
                onChange={(event) =>
                  setSkillInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter..."
              />

              <button
                type="button"
                className="dark-action-button"
                onClick={addSkill}
              >
                Add skill
              </button>

            </div>

            <div className="professional-skills">

              {skills.length > 0 ? (
                skills.map(
                  (skill, index) => (
                    <div
                      className="professional-skill"
                      key={`${skill}-${index}`}
                    >

                      <span>
                        {skill}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSkill(index)
                        }
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>

                    </div>
                  )
                )
              ) : (
                <div className="empty-inline">
                  Add your first skill above.
                </div>
              )}

            </div>

          </section>

          {/* =================================================
              SOCIAL LINKS
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                05
              </div>

              <div>
                <h2>
                  Social & Professional Links
                </h2>

                <p>
                  Add links that AI could not
                  extract from your resume. These
                  links will be clickable on your
                  generated portfolio.
                </p>
              </div>

            </div>

            <div className="modern-form-grid">

              <label className="modern-field">

                <span>
                  Platform
                </span>

                <select
                  value={socialPlatform}
                  onChange={(event) =>
                    setSocialPlatform(
                      event.target.value
                    )
                  }
                >
                  <option value="LinkedIn">
                    LinkedIn
                  </option>

                  <option value="GitHub">
                    GitHub
                  </option>

                  <option value="Portfolio">
                    Portfolio / Website
                  </option>

                  <option value="X">
                    X / Twitter
                  </option>

                  <option value="YouTube">
                    YouTube
                  </option>

                  <option value="LeetCode">
                    LeetCode
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </label>

              <label className="modern-field">

                <span>
                  Profile URL
                </span>

                <input
                  type="url"
                  value={socialUrl}
                  onChange={(event) =>
                    setSocialUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://linkedin.com/in/yourname"
                />

              </label>

            </div>

            <button
              type="button"
              className="add-section-button"
              onClick={addSocialLink}
              style={{
                marginTop: "18px",
              }}
            >
              <span>+</span>
              Add social link
            </button>

            <div
              className="repeatable-list"
              style={{
                marginTop: "20px",
              }}
            >

              {socialLinks.length === 0 ? (
                <div className="empty-section">

                  <div>
                    🔗
                  </div>

                  <strong>
                    No social links added
                  </strong>

                  <span>
                    Add LinkedIn, GitHub,
                    portfolio or other
                    professional profiles.
                  </span>

                </div>
              ) : (
                socialLinks.map(
                  (link, index) => (
                    <div
                      className="modern-repeatable-card"
                      key={`${link.platform}-${index}`}
                    >

                      <div className="repeatable-top">

                        <div>

                          <span>
                            SOCIAL LINK
                          </span>

                          <h3>
                            {link.platform}
                          </h3>

                        </div>

                        <button
                          type="button"
                          className="danger-outline-button"
                          onClick={() =>
                            removeSocialLink(
                              index
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                      <div className="modern-form-grid">

                        <label className="modern-field">

                          <span>
                            Platform
                          </span>

                          <select
                            value={
                              link.platform
                            }
                            onChange={(event) =>
                              updateSocialLink(
                                index,
                                "platform",
                                event.target.value
                              )
                            }
                          >
                            <option value="LinkedIn">
                              LinkedIn
                            </option>

                            <option value="GitHub">
                              GitHub
                            </option>

                            <option value="Portfolio">
                              Portfolio / Website
                            </option>

                            <option value="X">
                              X / Twitter
                            </option>

                            <option value="YouTube">
                              YouTube
                            </option>

                            <option value="LeetCode">
                              LeetCode
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>

                        </label>

                        <label className="modern-field">

                          <span>
                            URL
                          </span>

                          <input
                            type="url"
                            value={link.url}
                            onChange={(event) =>
                              updateSocialLink(
                                index,
                                "url",
                                event.target.value
                              )
                            }
                          />

                        </label>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </section>

          {/* =================================================
              EDUCATION
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                06
              </div>

              <div>
                <h2>
                  Education
                </h2>

                <p>
                  Add your academic qualifications
                  and educational achievements.
                </p>
              </div>

            </div>

            <div className="repeatable-list">

              {education.length === 0 && (
                <div className="empty-section">

                  <div>
                    🎓
                  </div>

                  <strong>
                    No education added yet
                  </strong>

                  <span>
                    Add your degree or academic
                    qualification.
                  </span>

                </div>
              )}

              {education.map(
                (item, index) => (
                  <div
                    className="modern-repeatable-card"
                    key={index}
                  >

                    <div className="repeatable-top">

                      <div>

                        <span>
                          EDUCATION
                        </span>

                        <h3>
                          Education {index + 1}
                        </h3>

                      </div>

                      <button
                        type="button"
                        className="danger-outline-button"
                        onClick={() =>
                          removeEducation(
                            index
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                    <div className="modern-form-grid">

                      <label className="modern-field">

                        <span>
                          Degree
                        </span>

                        <input
                          value={
                            item.degree ?? ""
                          }
                          onChange={(event) =>
                            updateEducation(
                              index,
                              "degree",
                              event.target.value
                            )
                          }
                          placeholder="B.Tech Computer Science"
                        />

                      </label>

                      <label className="modern-field">

                        <span>
                          Institution
                        </span>

                        <input
                          value={
                            item.institution ??
                            ""
                          }
                          onChange={(event) =>
                            updateEducation(
                              index,
                              "institution",
                              event.target.value
                            )
                          }
                          placeholder="University or college"
                        />

                      </label>

                      <label className="modern-field">

                        <span>
                          Year
                        </span>

                        <input
                          value={
                            item.year ?? ""
                          }
                          onChange={(event) =>
                            updateEducation(
                              index,
                              "year",
                              event.target.value
                            )
                          }
                          placeholder="2025"
                        />

                      </label>

                      <label className="modern-field field-full">

                        <span>
                          Description
                        </span>

                        <textarea
                          rows={4}
                          value={
                            item.description ??
                            ""
                          }
                          onChange={(event) =>
                            updateEducation(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Specialization, achievements, coursework..."
                        />

                      </label>

                    </div>

                  </div>
                )
              )}

            </div>

            <button
              type="button"
              className="add-section-button"
              onClick={addEducation}
            >
              <span>+</span>
              Add education
            </button>

          </section>

          {/* =================================================
              EXPERIENCE
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                07
              </div>

              <div>
                <h2>
                  Professional Experience
                </h2>

                <p>
                  Showcase internships, jobs and
                  relevant professional experience.
                </p>
              </div>

            </div>

            <div className="repeatable-list">

              {experience.length === 0 && (
                <div className="empty-section">

                  <div>
                    💼
                  </div>

                  <strong>
                    No experience added yet
                  </strong>

                  <span>
                    Add your professional experience
                    or internships.
                  </span>

                </div>
              )}

              {experience.map(
                (item, index) => (
                  <div
                    className="modern-repeatable-card"
                    key={index}
                  >

                    <div className="repeatable-top">

                      <div>

                        <span>
                          EXPERIENCE
                        </span>

                        <h3>
                          Experience {index + 1}
                        </h3>

                      </div>

                      <button
                        type="button"
                        className="danger-outline-button"
                        onClick={() =>
                          removeExperience(
                            index
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                    <div className="modern-form-grid">

                      <label className="modern-field">

                        <span>
                          Job title
                        </span>

                        <input
                          value={
                            item.role ?? ""
                          }
                          onChange={(event) =>
                            updateExperience(
                              index,
                              "role",
                              event.target.value
                            )
                          }
                          placeholder="Software Engineer"
                        />

                      </label>

                      <label className="modern-field">

                        <span>
                          Company
                        </span>

                        <input
                          value={
                            item.company ?? ""
                          }
                          onChange={(event) =>
                            updateExperience(
                              index,
                              "company",
                              event.target.value
                            )
                          }
                          placeholder="Company name"
                        />

                      </label>

                      <label className="modern-field">

                        <span>
                          Duration
                        </span>

                        <input
                          value={
                            item.duration ?? ""
                          }
                          onChange={(event) =>
                            updateExperience(
                              index,
                              "duration",
                              event.target.value
                            )
                          }
                          placeholder="2024 – 2025"
                        />

                      </label>

                      <label className="modern-field field-full">

                        <span>
                          Description
                        </span>

                        <textarea
                          rows={5}
                          value={
                            item.description ??
                            ""
                          }
                          onChange={(event) =>
                            updateExperience(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Describe your responsibilities, achievements and impact..."
                        />

                      </label>

                    </div>

                  </div>
                )
              )}

            </div>

            <button
              type="button"
              className="add-section-button"
              onClick={addExperience}
            >
              <span>+</span>
              Add experience
            </button>

          </section>

          {/* =================================================
              PROJECTS
          ================================================= */}

          <section className="modern-profile-card">

            <div className="section-heading">

              <div className="section-number">
                08
              </div>

              <div>
                <h2>
                  Projects
                </h2>

                <p>
                  Showcase the projects that best
                  demonstrate your technical abilities.
                </p>
              </div>

            </div>

            <div className="repeatable-list">

              {projects.length === 0 && (
                <div className="empty-section">

                  <div>
                    🚀
                  </div>

                  <strong>
                    No projects added yet
                  </strong>

                  <span>
                    Add projects that demonstrate
                    your skills.
                  </span>

                </div>
              )}

              {projects.map(
                (item, index) => (
                  <div
                    className="modern-repeatable-card"
                    key={index}
                  >

                    <div className="repeatable-top">

                      <div>

                        <span>
                          PROJECT
                        </span>

                        <h3>
                          Project {index + 1}
                        </h3>

                      </div>

                      <button
                        type="button"
                        className="danger-outline-button"
                        onClick={() =>
                          removeProject(
                            index
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                    <div className="modern-form-grid">

                      <label className="modern-field">

                        <span>
                          Project name
                        </span>

                        <input
                          value={
                            item.name ?? ""
                          }
                          onChange={(event) =>
                            updateProject(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="AI Portfolio Generator"
                        />

                      </label>

                      <label className="modern-field">

                        <span>
                          Project URL
                        </span>

                        <input
                          type="url"
                          value={
                            item.url ?? ""
                          }
                          onChange={(event) =>
                            updateProject(
                              index,
                              "url",
                              event.target.value
                            )
                          }
                          placeholder="https://github.com/..."
                        />

                      </label>

                      <label className="modern-field field-full">

                        <span>
                          Technologies
                        </span>

                        <input
                          value={
                            item.technologies?.join(
                              ", "
                            ) ?? ""
                          }
                          onChange={(event) =>
                            updateProject(
                              index,
                              "technologies",
                              event.target.value
                            )
                          }
                          placeholder="React, Next.js, Supabase"
                        />

                        <small className="field-hint">
                          Separate technologies
                          with commas.
                        </small>

                      </label>

                      <label className="modern-field field-full">

                        <span>
                          Project description
                        </span>

                        <textarea
                          rows={5}
                          value={
                            item.description ??
                            ""
                          }
                          onChange={(event) =>
                            updateProject(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Explain what you built, the problem it solves and the technologies you used..."
                        />

                      </label>

                    </div>

                  </div>
                )
              )}

            </div>

            <button
              type="button"
              className="add-section-button"
              onClick={addProject}
            >
              <span>+</span>
              Add project
            </button>

          </section>

          {/* =================================================
              CERTIFICATIONS
          ================================================= */}

          <section className="modern-profile-card certifications-card">

            <div className="section-heading">

              <div className="section-number">
                09
              </div>

              <div>

                <h2>
                  Certifications
                </h2>

                <p>
                  Add certificates that visitors
                  can view and download from your
                  portfolio.
                </p>

              </div>

            </div>

            <div className="certificate-upload-panel">

              <div className="certificate-upload-heading">

                <div className="certificate-upload-icon">
                  +
                </div>

                <div>

                  <h3>
                    Add a certification
                  </h3>

                  <p>
                    Upload your certificate and
                    provide its details.
                  </p>

                </div>

              </div>

              <div className="certificate-form-grid">

                <label className="modern-field">

                  <span>
                    Certificate name
                  </span>

                  <input
                    value={
                      certificateName
                    }
                    onChange={(event) =>
                      setCertificateName(
                        event.target.value
                      )
                    }
                    placeholder="AWS Cloud Practitioner"
                  />

                </label>

                <label className="modern-field">

                  <span>
                    Issuing organization
                  </span>

                  <input
                    value={
                      certificateOrganization
                    }
                    onChange={(event) =>
                      setCertificateOrganization(
                        event.target.value
                      )
                    }
                    placeholder="Amazon Web Services"
                  />

                </label>

                <label className="modern-field">

                  <span>
                    Issue date
                  </span>

                  <input
                    type="date"
                    value={
                      certificateDate
                    }
                    onChange={(event) =>
                      setCertificateDate(
                        event.target.value
                      )
                    }
                  />

                </label>

                <label className="modern-field">

                  <span>
                    Credential URL
                    <em>
                      Optional
                    </em>
                  </span>

                  <input
                    type="url"
                    value={
                      certificateUrl
                    }
                    onChange={(event) =>
                      setCertificateUrl(
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                  />

                </label>

              </div>

              <div className="certificate-upload-form">

                <label className="certificate-dropzone">

                  <div className="dropzone-icon">
                    ↑
                  </div>

                  <strong>
                    {certificateFile
                      ? certificateFile.name
                      : "Choose certificate file"}
                  </strong>

                  <span>
                    {certificateFile
                      ? "File selected and ready to upload"
                      : "PDF, JPG, PNG or WEBP · Maximum 10 MB"}
                  </span>

                  <input
                    id="certificate-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={
                      handleCertificateFile
                    }
                    disabled={
                      uploadingCertificate
                    }
                  />

                </label>

                <button
                  type="button"
                  className="certificate-add-button"
                  onClick={
                    handleAddCertificate
                  }
                  disabled={
                    uploadingCertificate
                  }
                >
                  {uploadingCertificate
                    ? "Uploading certificate..."
                    : "Add certificate"}
                </button>

              </div>

            </div>

            <div className="certificate-list">

              {certifications.length === 0 ? (
                <div className="certificate-empty-state">

                  <div className="empty-certificate-icon">
                    ▣
                  </div>

                  <div>

                    <strong>
                      No certifications yet
                    </strong>

                    <span>
                      Uploaded certificates will
                      appear here.
                    </span>

                  </div>

                </div>
              ) : (
                certifications.map(
                  (certificate) => (
                    <article
                      className="modern-certificate-card"
                      key={certificate.id}
                    >

                      <div className="certificate-main">

                        <div className="certificate-file-icon">

                          {certificate.file_name
                            ?.toLowerCase()
                            .endsWith(".pdf")
                            ? "PDF"
                            : "IMG"}

                        </div>

                        <div className="certificate-details">

                          <h3>
                            {certificate.name}
                          </h3>

                          {certificate.organization && (
                            <p>
                              {
                                certificate.organization
                              }
                            </p>
                          )}

                          <div className="certificate-meta">

                            {certificate.issue_date && (
                              <span>
                                Issued{" "}
                                {
                                  certificate.issue_date
                                }
                              </span>
                            )}

                            {certificate.file_name && (
                              <span>
                                {
                                  certificate.file_name
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      <div className="certificate-actions">

                        {certificate.file_path && (
                          <>
                            <button
                              type="button"
                              className="certificate-action"
                              onClick={() =>
                                handleViewCertificate(
                                  certificate.file_path!
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="certificate-action"
                              onClick={() =>
                                handleDownloadCertificate(
                                  certificate.file_path!,
                                  certificate.file_name
                                )
                              }
                            >
                              Download
                            </button>
                          </>
                        )}

                        {certificate.credential_url && (
                          <a
                            href={
                              certificate.credential_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="certificate-action"
                          >
                            Credential
                          </a>
                        )}

                        <button
                          type="button"
                          className="certificate-delete-action"
                          onClick={() =>
                            handleDeleteCertificate(
                              certificate.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </article>
                  )
                )
              )}

            </div>

          </section>

          {/* =================================================
              FINAL SAVE
          ================================================= */}

          <div className="final-save-area">

            <div className="save-information">

              <div className="save-check">
                ✓
              </div>

              <div>

                <strong>
                  Ready to update your portfolio?
                </strong>

                <span>
                  Save your latest resume
                  information before leaving this
                  page.
                </span>

              </div>

            </div>

            <button
              type="submit"
              className="final-save-button"
              disabled={saving}
            >

              {saving ? (
                <>
                  <span className="button-spinner" />
                  Saving changes...
                </>
              ) : (
                <>
                  Save Changes
                  <span>→</span>
                </>
              )}

            </button>

          </div>

        </form>

        <footer className="profile-editor-footer">

          <span>
            Your portfolio information is saved
            securely.
          </span>

          <Link
            href={`/dashboard/portfolio/${portfolioId}`}
          >
            Return to portfolio →
          </Link>

        </footer>

      </div>
    </main>
  );
}