import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const portfolioId = body?.portfolioId;

    if (!portfolioId) {
      return NextResponse.json(
        {
          success: false,
          error: "Portfolio ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { data: portfolio, error: findError } =
      await supabase
        .from("portfolios")
        .select("id, slug, title")
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .single();

    if (findError || !portfolio) {
      return NextResponse.json(
        {
          success: false,
          error: "Portfolio not found.",
        },
        { status: 404 }
      );
    }

    const { data: updatedPortfolio, error: updateError } =
      await supabase
        .from("portfolios")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .select("id, slug, title, is_published, published_at")
        .single();

    if (updateError) {
      console.error(
        "Publish database error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const publicUrl =
      `${baseUrl}/p/${updatedPortfolio.slug}`;

    return NextResponse.json({
      success: true,
      message: "Portfolio published successfully.",
      data: {
        portfolio: updatedPortfolio,
        publicUrl,
      },
    });
  } catch (error) {
    console.error(
      "Publish API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish portfolio.",
      },
      { status: 500 }
    );
  }
}