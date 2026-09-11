import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. Create Supabase server client
    // =====================================================

    const supabase = await createClient();

    // =====================================================
    // 2. Get logged-in user
    // =====================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        {
          error: userError.message,
        },
        {
          status: 401,
        }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User is not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 3. Read request body
    // =====================================================

    const body = await request.json();

    const portfolioId = body.portfolioId;

    if (!portfolioId) {
      return NextResponse.json(
        {
          error: "Portfolio ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 4. Verify portfolio ownership
    // =====================================================

    const {
      data: portfolio,
      error: portfolioError,
    } = await supabase
      .from("portfolios")
      .select("id")
      .eq("id", portfolioId)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        {
          error:
            "Portfolio not found or you don't have access to it.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // 5. Get resume information
    // =====================================================

    const {
      data: resumeData,
      error: resumeError,
    } = await supabase
      .from("resume_data")
      .select(
        "id, portfolio_id, resume_file_name, resume_file_path, extracted_data"
      )
      .eq("portfolio_id", portfolioId)
      .maybeSingle();

    if (resumeError) {
      return NextResponse.json(
        {
          error: resumeError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!resumeData) {
      return NextResponse.json(
        {
          error:
            "No resume has been uploaded yet.",
        },
        {
          status: 404,
        }
      );
    }

    if (!resumeData.resume_file_path) {
      return NextResponse.json(
        {
          error:
            "Resume file path is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 6. Download private resume from Storage
    // =====================================================

    const {
      data: fileData,
      error: downloadError,
    } = await supabase.storage
      .from("resume-files")
      .download(
        resumeData.resume_file_path
      );

    if (downloadError) {
      return NextResponse.json(
        {
          error:
            downloadError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!fileData) {
      return NextResponse.json(
        {
          error:
            "Unable to download resume file.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 7. Convert file to Buffer
    // =====================================================

    const arrayBuffer =
      await fileData.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // =====================================================
    // 8. Determine file type
    // =====================================================

    const fileName =
      resumeData.resume_file_name
        ?.toLowerCase() || "";

    let extractedText = "";

    // =====================================================
    // 9. Extract PDF text
    // =====================================================

   if (fileName.endsWith(".pdf")) {
  const parser = new PDFParse({
    data: buffer,
  });

  const pdfResult = await parser.getText();

  extractedText = pdfResult.text || "";

  await parser.destroy();
}

    // =====================================================
    // 10. Extract DOCX text
    // =====================================================

    else if (
      fileName.endsWith(".docx")
    ) {
      const docxResult =
        await mammoth.extractRawText({
          buffer,
        });

      extractedText =
        docxResult.value || "";
    }

    // =====================================================
    // 11. Unsupported file
    // =====================================================

    else {
      return NextResponse.json(
        {
          error:
            "Unsupported resume format. Please upload PDF or DOCX.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 12. Clean extracted text
    // =====================================================

    extractedText =
      extractedText
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // =====================================================
    // 13. Check extracted text
    // =====================================================

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the resume.",
        },
        {
          status: 422,
        }
      );
    }

    // =====================================================
    // 14. Return extracted text
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Resume text extracted successfully.",

        resume: {
          id: resumeData.id,
          fileName:
            resumeData.resume_file_name,
        },

        text: extractedText,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "Resume extraction API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while extracting the resume.",
      },
      {
        status: 500,
      }
    );
  }
}