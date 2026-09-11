import { createClient } from "@/lib/supabase/client";

export type PortfolioContent = {
  id?: string;
  portfolio_id: string;

  hero: Record<string, unknown>;
  about: string | null;
  skills: unknown[];
  experience: unknown[];
  education: unknown[];
  projects: unknown[];
  certifications: unknown[];
  achievements: unknown[];
  contact: Record<string, unknown>;

  generated_by: string;
  generated_at?: string;
  updated_at?: string;
};

export async function getPortfolioContent(
  portfolioId: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("portfolio_content")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function savePortfolioContent(
  content: PortfolioContent
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("portfolio_content")
    .upsert(
      {
        portfolio_id: content.portfolio_id,
        hero: content.hero,
        about: content.about,
        skills: content.skills,
        experience: content.experience,
        education: content.education,
        projects: content.projects,
        certifications: content.certifications,
        achievements: content.achievements,
        contact: content.contact,
        generated_by: content.generated_by,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "portfolio_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deletePortfolioContent(
  portfolioId: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { error } = await supabase
    .from("portfolio_content")
    .delete()
    .eq("portfolio_id", portfolioId);

  if (error) {
    throw error;
  }
}