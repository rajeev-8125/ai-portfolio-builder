"use client";

import React from "react";

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

  navigation?: string[];

  design?: {
    style?: string;
    theme?: string;
    animation?: string;
    layout_description?: string;
  };
};

type PortfolioRendererProps = {
  data: PortfolioData;
};

function getValue(
  item: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = item[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  return "";
}

export default function PortfolioRenderer({
  data,
}: PortfolioRendererProps) {
  const skills = data.skills?.items || [];
  const experience = data.experience?.items || [];
  const education = data.education?.items || [];
  const projects = data.projects?.items || [];
  const certifications =
    data.certifications?.items || [];

  const theme =
    data.design?.theme?.toLowerCase() || "dark";

  const isDark =
    theme.includes("dark") ||
    theme.includes("black");

  return (
    <main
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-white text-slate-900"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 border-b backdrop-blur ${
          isDark
            ? "border-white/10 bg-slate-950/80"
            : "border-slate-200 bg-white/80"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-bold">
            Portfolio
          </div>

          <div className="hidden gap-6 md:flex">
            {(data.navigation || []).map(
              (item) => (
                <a
                  key={item}
                  href={`#${item
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  className={
                    isDark
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-600 hover:text-black"
                  }
                >
                  {item}
                </a>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center px-6 py-20"
      >
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] opacity-60">
            {data.hero?.subheadline}
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            {data.hero?.headline ||
              "Welcome to my portfolio"}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">
            {data.hero?.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {data.hero?.primary_button && (
              <a
                href="#projects"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:opacity-80"
              >
                {data.hero.primary_button}
              </a>
            )}

            {data.hero?.secondary_button && (
              <a
                href="#contact"
                className="rounded-lg border border-current px-6 py-3 font-semibold transition hover:opacity-70"
              >
                {data.hero.secondary_button}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      {data.about?.content && (
        <section
          id="about"
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <SectionTitle
            title={data.about.title || "About Me"}
            dark={isDark}
          />

          <p className="max-w-4xl text-lg leading-8 opacity-75">
            {data.about.content}
          </p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section
          id="skills"
          className={`px-6 py-20 ${
            isDark
              ? "bg-white/[0.03]"
              : "bg-slate-50"
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title={data.skills?.title || "Skills"}
              dark={isDark}
            />

            <div className="flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className={`rounded-full border px-4 py-2 ${
                    isDark
                      ? "border-white/10 bg-white/5"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section
          id="experience"
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <SectionTitle
            title={
              data.experience?.title ||
              "Experience"
            }
            dark={isDark}
          />

          <div className="space-y-6">
            {experience.map((item, index) => (
              <PortfolioCard
                key={index}
                item={item}
                dark={isDark}
              />
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section
          id="projects"
          className={`px-6 py-20 ${
            isDark
              ? "bg-white/[0.03]"
              : "bg-slate-50"
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title={
                data.projects?.title ||
                "Projects"
              }
              dark={isDark}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((item, index) => (
                <PortfolioCard
                  key={index}
                  item={item}
                  dark={isDark}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section
          id="education"
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <SectionTitle
            title={
              data.education?.title ||
              "Education"
            }
            dark={isDark}
          />

          <div className="space-y-6">
            {education.map((item, index) => (
              <PortfolioCard
                key={index}
                item={item}
                dark={isDark}
              />
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section
          id="certifications"
          className={`px-6 py-20 ${
            isDark
              ? "bg-white/[0.03]"
              : "bg-slate-50"
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title={
                data.certifications?.title ||
                "Certifications"
              }
              dark={isDark}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {certifications.map(
                (item, index) => (
                  <PortfolioCard
                    key={index}
                    item={item}
                    dark={isDark}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section
        id="contact"
        className="mx-auto max-w-6xl px-6 py-24"
      >
        <SectionTitle
          title={
            data.contact?.title ||
            "Let's Connect"
          }
          dark={isDark}
        />

        <p className="mb-8 max-w-2xl text-lg opacity-75">
          {data.contact?.description}
        </p>

        <div className="space-y-3">
          {data.contact?.email && (
            <p>
              <strong>Email:</strong>{" "}
              {data.contact.email}
            </p>
          )}

          {data.contact?.phone && (
            <p>
              <strong>Phone:</strong>{" "}
              {data.contact.phone}
            </p>
          )}

          {data.contact?.location && (
            <p>
              <strong>Location:</strong>{" "}
              {data.contact.location}
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t px-6 py-8 text-center text-sm opacity-60 ${
          isDark
            ? "border-white/10"
            : "border-slate-200"
        }`}
      >
        Built with AI-powered portfolio generation.
      </footer>
    </main>
  );
}

function SectionTitle({
  title,
  dark,
}: {
  title: string;
  dark: boolean;
}) {
  return (
    <h2
      className={`mb-10 text-3xl font-bold md:text-4xl ${
        dark ? "text-white" : "text-slate-900"
      }`}
    >
      {title}
    </h2>
  );
}

function PortfolioCard({
  item,
  dark,
}: {
  item: Record<string, unknown>;
  dark: boolean;
}) {
  const title = getValue(item, [
    "title",
    "name",
    "role",
    "position",
    "degree",
  ]);

  const organization = getValue(item, [
    "company",
    "organization",
    "institution",
    "school",
    "university",
  ]);

  const date = getValue(item, [
    "date",
    "dates",
    "duration",
    "period",
    "issue_date",
    "start_date",
    "year",
  ]);

  const description = getValue(item, [
    "description",
    "details",
    "summary",
    "content",
  ]);

  const technologies = getValue(item, [
    "technologies",
    "technology",
    "skills",
    "tech_stack",
  ]);

  const url = getValue(item, [
    "url",
    "project_url",
    "credential_url",
    "link",
  ]);

  return (
    <article
      className={`rounded-2xl border p-6 ${
        dark
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200 bg-white"
      }`}
    >
      {title && (
        <h3 className="text-xl font-semibold">
          {title}
        </h3>
      )}

      {organization && (
        <p className="mt-2 font-medium opacity-70">
          {organization}
        </p>
      )}

      {date && (
        <p className="mt-1 text-sm opacity-50">
          {date}
        </p>
      )}

      {description && (
        <p className="mt-4 leading-7 opacity-75">
          {description}
        </p>
      )}

      {technologies && (
        <p className="mt-4 text-sm opacity-60">
          {technologies}
        </p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block font-semibold underline"
        >
          View Details
        </a>
      )}
    </article>
  );
}