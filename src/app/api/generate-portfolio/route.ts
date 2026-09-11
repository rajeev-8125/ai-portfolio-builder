import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Use a model that is available in the Gemini API.
const GEMINI_MODEL = "gemini-3.6-flash";

export async function POST(request: NextRequest) {
  try {
    // =====================================================
    // CHECK API KEY
    // =====================================================

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // READ REQUEST
    // =====================================================

    const body = await request.json();

    const {
      profile,
      portfolioId,
      designPrompt,
      style,
      theme,
      animation,
    } = body;

    // =====================================================
    // VALIDATE PROFILE
    // =====================================================

    if (!profile) {
      return NextResponse.json(
        {
          error: "Resume profile is required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // OPTIONAL DESIGN PROMPT
    // =====================================================

    const finalDesignPrompt =
      designPrompt?.trim() ||
      "Create a professional portfolio using the selected style, theme, and animation settings. Use a clean, modern layout suitable for a software developer.";

    // =====================================================
    // SYSTEM INSTRUCTION
    // =====================================================

    const systemInstruction = `
You are an expert portfolio website designer,
frontend information architect, and professional
resume content specialist.

Your task is to convert the candidate's existing
resume/profile information and the user's design
request into a complete portfolio configuration.

STRICT RULES:

1. Do NOT invent information.
2. Do NOT create fake companies.
3. Do NOT create fake projects.
4. Do NOT create fake education.
5. Do NOT create fake certifications.
6. Do NOT create fake skills.
7. Do NOT create fake contact information.
8. Only use information contained in the candidate profile.
9. You may improve wording while preserving the original facts.
10. If information is missing, use an empty string or empty array.
11. Return ONLY valid JSON.
12. Do NOT return Markdown.
13. Do NOT wrap JSON inside markdown code fences.
14. The JSON must follow the requested structure exactly.
15. Make the portfolio professional and suitable for a real job seeker.
16. Do not mention that you are an AI.
17. Do not add information that is not present in the profile.

The design prompt is optional.
If the user does not provide a design prompt,
use the selected style, theme, and animation
to determine the design.
`;

    // =====================================================
    // USER PROMPT
    // =====================================================

    const userPrompt = `
Create a complete portfolio configuration.

PORTFOLIO ID:
${portfolioId || ""}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

USER'S PORTFOLIO DESIGN REQUEST:
${finalDesignPrompt}

REQUESTED STYLE:
${style || "Modern"}

REQUESTED THEME:
${theme || "Professional"}

REQUESTED ANIMATION:
${animation || "Smooth"}

Return JSON using exactly this structure:

{
  "hero": {
    "headline": "",
    "subheadline": "",
    "description": "",
    "primary_button": "",
    "secondary_button": ""
  },

  "about": {
    "title": "About Me",
    "content": ""
  },

  "skills": {
    "title": "Skills",
    "items": []
  },

  "experience": {
    "title": "Experience",
    "items": []
  },

  "education": {
    "title": "Education",
    "items": []
  },

  "projects": {
    "title": "Projects",
    "items": []
  },

  "certifications": {
    "title": "Certifications",
    "items": []
  },

  "contact": {
    "title": "Let's Connect",
    "description": "",
    "email": "",
    "phone": "",
    "location": ""
  },

  "navigation": [
    "Home",
    "About",
    "Skills",
    "Experience",
    "Projects",
    "Education",
    "Certifications",
    "Contact"
  ],

  "design": {
    "style": "",
    "theme": "",
    "animation": "",
    "layout_description": ""
  }
}

CONTENT RULES:

HERO:
- Create a strong professional headline based only on the candidate's information.
- Create a relevant subheadline based only on the candidate's information.
- Create a concise professional description.
- Do not invent a job title that is not supported by the profile.
- primary_button can be "View Projects" when projects exist.
- secondary_button can be "Contact Me" when contact information exists.

ABOUT:
- Create a professional summary using only the candidate information.
- Do not introduce new facts.

SKILLS:
- Return skills as strings.
- Preserve the candidate's actual skills.
- Do not add technologies that are not present in the profile.

EXPERIENCE:
- Return structured objects.
- Preserve company names.
- Preserve job titles.
- Preserve dates.
- Preserve descriptions.
- Do not invent missing information.

EDUCATION:
- Return structured objects.
- Preserve degree.
- Preserve institution.
- Preserve dates.
- Preserve relevant details.
- Do not invent missing information.

PROJECTS:
- Return structured objects.
- Preserve project names.
- Preserve descriptions.
- Preserve technologies.
- Preserve links when available.
- Do not invent projects.

CERTIFICATIONS:
- Return structured objects.
- Preserve certification name.
- Preserve organization.
- Preserve issue date.
- Preserve credential URL.
- Preserve certificate information when available.
- Do not invent certifications.

CONTACT:
- Use only contact information available in the candidate profile.
- Do not invent email addresses.
- Do not invent phone numbers.
- Do not invent locations.

NAVIGATION:
- Use the requested navigation structure.
- Do not add unnecessary navigation items.

DESIGN:
- Reflect the user's requested style, theme, and animation.
- layout_description should explain the intended visual layout.
- Do not create candidate information in this section.

IMPORTANT:
Return ONLY the JSON object.
`;

    // =====================================================
    // GEMINI API REQUEST
    // =====================================================

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    // =====================================================
    // READ GEMINI RESPONSE
    // =====================================================

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini generation error:", result);

      return NextResponse.json(
        {
          error:
            result?.error?.message ||
            "Portfolio generation failed.",
        },
        {
          status: response.status || 500,
        }
      );
    }

    // =====================================================
    // GET GENERATED TEXT
    // =====================================================

    const text =
      result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error(
        "Gemini returned no text:",
        result
      );

      return NextResponse.json(
        {
          error: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // PARSE JSON
    // =====================================================

    let portfolio;

    try {
      portfolio = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Portfolio JSON parsing error:",
        parseError
      );

      console.error(
        "Raw Gemini response:",
        text
      );

      return NextResponse.json(
        {
          error:
            "Gemini returned invalid portfolio data.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // VALIDATE PORTFOLIO
    // =====================================================

    if (
      !portfolio ||
      typeof portfolio !== "object"
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini returned an invalid portfolio configuration.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // NORMALIZE PORTFOLIO
    // =====================================================

    const normalizedPortfolio = {
      hero: {
        headline:
          portfolio.hero?.headline || "",

        subheadline:
          portfolio.hero?.subheadline || "",

        description:
          portfolio.hero?.description || "",

        primary_button:
          portfolio.hero?.primary_button || "",

        secondary_button:
          portfolio.hero?.secondary_button || "",
      },

      about: {
        title:
          portfolio.about?.title ||
          "About Me",

        content:
          portfolio.about?.content || "",
      },

      skills: {
        title:
          portfolio.skills?.title ||
          "Skills",

        items:
          Array.isArray(
            portfolio.skills?.items
          )
            ? portfolio.skills.items
            : [],
      },

      experience: {
        title:
          portfolio.experience?.title ||
          "Experience",

        items:
          Array.isArray(
            portfolio.experience?.items
          )
            ? portfolio.experience.items
            : [],
      },

      education: {
        title:
          portfolio.education?.title ||
          "Education",

        items:
          Array.isArray(
            portfolio.education?.items
          )
            ? portfolio.education.items
            : [],
      },

      projects: {
        title:
          portfolio.projects?.title ||
          "Projects",

        items:
          Array.isArray(
            portfolio.projects?.items
          )
            ? portfolio.projects.items
            : [],
      },

      certifications: {
        title:
          portfolio.certifications?.title ||
          "Certifications",

        items:
          Array.isArray(
            portfolio.certifications?.items
          )
            ? portfolio.certifications.items
            : [],
      },

      contact: {
        title:
          portfolio.contact?.title ||
          "Let's Connect",

        description:
          portfolio.contact?.description || "",

        email:
          portfolio.contact?.email || "",

        phone:
          portfolio.contact?.phone || "",

        location:
          portfolio.contact?.location || "",
      },

      navigation:
        Array.isArray(
          portfolio.navigation
        )
          ? portfolio.navigation
          : [
              "Home",
              "About",
              "Skills",
              "Experience",
              "Projects",
              "Education",
              "Certifications",
              "Contact",
            ],

      design: {
        style:
          portfolio.design?.style ||
          style ||
          "Modern",

        theme:
          portfolio.design?.theme ||
          theme ||
          "Professional",

        animation:
          portfolio.design?.animation ||
          animation ||
          "Smooth",

        layout_description:
          portfolio.design
            ?.layout_description || "",
      },
    };

    // =====================================================
    // RETURN RESULT
    // =====================================================

    return NextResponse.json({
      success: true,
      data: normalizedPortfolio,
    });
  } catch (error) {
    console.error(
      "Portfolio generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate portfolio.",
      },
      { status: 500 }
    );
  }
}
