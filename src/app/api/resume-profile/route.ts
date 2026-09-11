import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("portfolioId");

    if (!portfolioId) {
      return NextResponse.json(
        {
          error: "Portfolio ID is required.",
        },
        { status: 400 }
      );
    }

    // ================================================
    // GET CURRENT USER
    // ================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth error:", userError);

      return NextResponse.json(
        {
          error: "Unable to verify authentication.",
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User is not authenticated.",
        },
        { status: 401 }
      );
    }

    // ================================================
    // GET RESUME PROFILE
    // ================================================

    const { data, error } = await supabase
      .from("resume_profiles")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .single();

    if (error) {
      console.error("Resume profile error:", error);

      return NextResponse.json(
        {
          error: "Resume profile could not be loaded.",
        },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "Resume profile not found.",
        },
        { status: 404 }
      );
    }

    // ================================================
    // RETURN PROFILE
    // ================================================

    return NextResponse.json({
      success: true,
      data: {
        ...data,

        // Always provide social_links
        social_links:
          data.social_links &&
          typeof data.social_links === "object"
            ? data.social_links
            : {
                github: "",
                linkedin: "",
                hackerrank: "",
                leetcode: "",
                website: "",
                other: "",
              },
      },
    });
  } catch (error) {
    console.error("Resume profile API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load resume profile.",
      },
      { status: 500 }
    );
  }
}