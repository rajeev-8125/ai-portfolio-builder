
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   PORTFOLIO
========================================================= */

export async function createPortfolio(
  title: string,
  slug: string
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
    throw new Error("User is not authenticated.");
  }

  // Clean the slug
  const baseSlug =
    slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "portfolio";

  // Check whether slug already exists
  const { data: existingPortfolio, error: checkError } =
    await supabase
      .from("portfolios")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();

  if (checkError) {
    throw new Error(
      `Unable to check portfolio slug: ${checkError.message}`
    );
  }

  let finalSlug = baseSlug;

  // If slug exists, generate a unique slug
  if (existingPortfolio) {
    finalSlug = `${baseSlug}-${Date.now()}`;
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: user.id,
      title: title.trim(),
      slug: finalSlug,
      is_published: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to create portfolio: ${error.message}`
    );
  }

  return data;
}

/* =========================================================
   UPDATE PORTFOLIO
========================================================= */

export async function updatePortfolio(
  id: string,
  title: string,
  slug: string,
  description: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("portfolios")
    .update({
      title,
      slug,
      description,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to update portfolio: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   DELETE PORTFOLIO
========================================================= */

export async function deletePortfolio(id: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Unable to delete portfolio: ${error.message}`
    );
  }
}


/* =========================================================
   PUBLISH PORTFOLIO
========================================================= */

export async function setPortfolioPublished(
  id: string,
  published: boolean
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("portfolios")
    .update({
      is_published: published,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to update portfolio status: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   SAVE RESUME FILE
========================================================= */

export async function saveResumeFile(
  portfolioId: string,
  fileName: string,
  filePath: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or you don't have access to it."
    );
  }

  const { data, error } = await supabase
    .from("resume_data")
    .upsert(
      {
        portfolio_id: portfolioId,
        resume_file_name: fileName,
        resume_file_path: filePath,
      },
      {
        onConflict: "portfolio_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to save resume file: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   SAVE PROFILE IMAGE
========================================================= */

export async function saveProfileImage(
  portfolioId: string,
  fileName: string,
  filePath: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or access denied."
    );
  }

  const { data, error } = await supabase
    .from("resume_profiles")
    .upsert(
      {
        portfolio_id: portfolioId,
        profile_image_name: fileName,
        profile_image_path: filePath,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "portfolio_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to save profile image: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   ADD CERTIFICATION
========================================================= */

export async function addCertification(
  portfolioId: string,
  name: string,
  organization: string,
  issueDate: string,
  credentialUrl: string,
  fileName: string,
  filePath: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or access denied."
    );
  }

  const { data, error } = await supabase
    .from("certifications")
    .insert({
      portfolio_id: portfolioId,
      name: name.trim(),
      organization: organization.trim() || null,
      issue_date: issueDate || null,
      credential_url: credentialUrl.trim() || null,
      file_name: fileName,
      file_path: filePath,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to add certificate: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   GET CERTIFICATIONS
========================================================= */

export async function getCertifications(
  portfolioId: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or access denied."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("certifications")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Unable to load certifications: ${error.message}`
    );
  }

  return data ?? [];
}


/* =========================================================
   DELETE CERTIFICATION
========================================================= */

export async function deleteCertification(
  certificationId: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const {
    data: certification,
    error: certificationError,
  } = await supabase
    .from("certifications")
    .select("id, file_path, portfolio_id")
    .eq("id", certificationId)
    .maybeSingle();

  if (certificationError) {
    throw new Error(
      `Unable to find certificate: ${certificationError.message}`
    );
  }

  if (!certification) {
    throw new Error("Certificate not found.");
  }

  const {
    data: portfolio,
    error: portfolioError,
  } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", certification.portfolio_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (portfolioError) {
    throw new Error(
      `Unable to verify certificate ownership: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "You do not have permission to delete this certificate."
    );
  }

  if (certification.file_path) {
    const {
      error: storageError,
    } = await supabase.storage
      .from("certificate-files")
      .remove([certification.file_path]);

    if (storageError) {
      console.error(
        "Certificate storage deletion error:",
        storageError.message
      );
    }
  }

  const { error } = await supabase
    .from("certifications")
    .delete()
    .eq("id", certificationId);

  if (error) {
    throw new Error(
      `Unable to delete certificate: ${error.message}`
    );
  }
}


/* =========================================================
   GET CERTIFICATE SIGNED URL
========================================================= */

export async function getCertificateViewUrl(
  filePath: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from("certificate-files")
    .createSignedUrl(
      filePath,
      60 * 10
    );

  if (error) {
    throw new Error(
      `Unable to create certificate URL: ${error.message}`
    );
  }

  if (!data?.signedUrl) {
    throw new Error(
      "Certificate URL could not be created."
    );
  }

  return data.signedUrl;
}


/* =========================================================
   SAVE PORTFOLIO GENERATION
========================================================= */

export async function savePortfolioGeneration(
  portfolioId: string,
  generatedData: unknown,
  designPrompt: string,
  style: string,
  theme: string,
  animation: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or access denied."
    );
  }

  const { data, error } = await supabase
    .from("portfolio_generations")
    .insert({
      portfolio_id: portfolioId,
      generated_data: generatedData,
      design_prompt: designPrompt,
      style,
      theme,
      animation,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to save portfolio generation: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   GET LATEST PORTFOLIO GENERATION
========================================================= */

export async function getLatestPortfolioGeneration(
  portfolioId: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or access denied."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("portfolio_generations")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load portfolio generation: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
   CREATE PORTFOLIO GENERATION
========================================================= */
export async function createPortfolioGeneration(
  portfolioId: string,
  generatedData: unknown,
  designPrompt: string,
  style: string,
  theme: string,
  animation: string
) {
  const supabase = createClient();

  // ============================================
  // GET CURRENT USER
  // ============================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
  }

  // ============================================
  // VERIFY PORTFOLIO OWNERSHIP
  // ============================================

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
      `Unable to verify portfolio: ${portfolioError.message}`
    );
  }

  if (!portfolio) {
    throw new Error(
      "Portfolio not found or you don't have access to it."
    );
  }

  // ============================================
  // VALIDATE GENERATED DATA
  // ============================================

  if (
    !generatedData ||
    typeof generatedData !== "object"
  ) {
    throw new Error(
      "Generated portfolio data is invalid."
    );
  }

  // ============================================
  // SAVE GENERATION
  // ============================================

  const {
    data,
    error,
  } = await supabase
    .from("portfolio_generations")
    .insert({
      portfolio_id: portfolioId,
      generated_data: generatedData,
      design_prompt:
        designPrompt?.trim() || null,
      style: style || "Modern",
      theme: theme || "Professional",
      animation: animation || "Smooth",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Create portfolio generation error:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      `Unable to save portfolio generation: ${error.message}`
    );
  }

  return data;
}