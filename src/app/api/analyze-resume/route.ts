import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const resumeText = body.resumeText;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Resume text is required.",
        },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert Resume Analysis AI.

Analyze the resume below and convert it into structured JSON.

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Do not return Markdown.
3. Do not use code fences.
4. Do not add explanations outside JSON.
5. Do not invent information.
6. If information is missing, use null or [].
7. Keep the information accurate to the resume.

Return EXACTLY this structure:

{
  "personal": {
    "name": null,
    "email": null,
    "phone": null,
    "location": null,
    "linkedin": null,
    "github": null,
    "website": null
  },

  "headline": null,

  "summary": null,

  "skills": [],

  "education": [],

  "experience": [],

  "projects": [],

  "certifications": [],

  "achievements": []
}

Education objects must use:

{
  "degree": null,
  "institution": null,
  "field": null,
  "start_date": null,
  "end_date": null,
  "description": null
}

Experience objects must use:

{
  "job_title": null,
  "company": null,
  "location": null,
  "start_date": null,
  "end_date": null,
  "description": null
}

Project objects must use:

{
  "name": null,
  "description": null,
  "technologies": []
}

Certification objects must use:

{
  "name": null,
  "issuer": null,
  "date": null
}

Achievements should be an array of strings.

Skills should be an array of strings.

Resume:

${resumeText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    let parsedData;

    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Gemini JSON parsing error:", parseError);
      console.error("Gemini response:", responseText);

      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON.",
        },
        { status: 500 }
      );
    }

    console.log(
      "Gemini Resume Analysis:",
      parsedData
    );

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error(
      "Gemini resume analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze resume with Gemini.",
      },
      { status: 500 }
    );
  }
}