import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { portfolioId, ...profileData } = body;

    if (!portfolioId) {
      return NextResponse.json(
        {
          error: "Portfolio ID is required.",
        },
        { status: 400 }
      );
    }

    // ================================================
    // VERIFY PORTFOLIO OWNERSHIP
    // ================================================

    const { data: portfolio, error: portfolioError } =
      await supabase
        .from("portfolios")
        .select("id")
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        {
          error:
            "Portfolio not found or you do not have permission to update it.",
        },
        { status: 403 }
      );
    }

    // ================================================
    // UPDATE RESUME PROFILE
    // ================================================

    const { data, error } = await supabase
      .from("resume_profiles")
      .update(profileData)
      .eq("portfolio_id", portfolioId)
      .select("*")
      .single();

    if (error) {
      console.error("Resume profile update error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resume profile updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update profile API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update resume profile.",
      },
      { status: 500 }
    );
  }
}