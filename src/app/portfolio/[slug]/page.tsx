import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicPortfolioPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: portfolio,
    error,
  } = await supabase
    .from("portfolios")
    .select(
      "id, title, slug, generated_data, is_published"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (
    error ||
    !portfolio ||
    !portfolio.generated_data
  ) {
    notFound();
  }

  const data = portfolio.generated_data;

  return (
    <main
      style={{
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          padding: "100px 20px",
          textAlign: "center",
        }}
      >
        <h1>
          {data.hero?.headline ||
            portfolio.title}
        </h1>

        <p>
          {data.hero?.subheadline || ""}
        </p>

        <p>
          {data.hero?.description || ""}
        </p>
      </section>

      {data.about?.content && (
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "60px 20px",
          }}
        >
          <h2>
            {data.about.title ||
              "About Me"}
          </h2>

          <p>
            {data.about.content}
          </p>
        </section>
      )}

      {data.skills?.items &&
        data.skills.items.length > 0 && (
          <section
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "60px 20px",
            }}
          >
            <h2>
              {data.skills.title ||
                "Skills"}
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              {data.skills.items.map(
                (
                  skill: string,
                  index: number
                ) => (
                  <span
                    key={index}
                    style={{
                      padding:
                        "8px 14px",
                      border:
                        "1px solid #ccc",
                      borderRadius:
                        "20px",
                    }}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </section>
        )}

      {data.projects?.items &&
        data.projects.items.length > 0 && (
          <section
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "60px 20px",
            }}
          >
            <h2>
              {data.projects.title ||
                "Projects"}
            </h2>

            {data.projects.items.map(
              (
                project: Record<
                  string,
                  unknown
                >,
                index: number
              ) => (
                <article
                  key={index}
                  style={{
                    padding: "20px",
                    marginTop: "20px",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "12px",
                  }}
                >
                  {Object.entries(
                    project
                  ).map(
                    ([key, value]) => {
                      if (
                        value === null ||
                        value ===
                          undefined ||
                        value === ""
                      ) {
                        return null;
                      }

                      if (
                        typeof value ===
                        "object"
                      ) {
                        return null;
                      }

                      return (
                        <p key={key}>
                          <strong>
                            {key
                              .replace(
                                /_/g,
                                " "
                              )
                              .replace(
                                /\b\w/g,
                                (
                                  letter
                                ) =>
                                  letter.toUpperCase()
                              )}
                            :
                          </strong>{" "}
                          {String(value)}
                        </p>
                      );
                    }
                  )}
                </article>
              )
            )}
          </section>
        )}

      {data.contact && (
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "60px 20px",
          }}
        >
          <h2>
            {data.contact.title ||
              "Let's Connect"}
          </h2>

          <p>
            {data.contact.description ||
              ""}
          </p>

          {data.contact.email && (
            <p>
              Email:{" "}
              {data.contact.email}
            </p>
          )}

          {data.contact.phone && (
            <p>
              Phone:{" "}
              {data.contact.phone}
            </p>
          )}

          {data.contact.location && (
            <p>
              Location:{" "}
              {data.contact.location}
            </p>
          )}
        </section>
      )}
    </main>
  );
}