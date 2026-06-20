import Link from "next/link";

type SectionPlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
  highlights: string[];
  backHref?: string;
};

export default function SectionPlaceholder({
  title,
  eyebrow,
  description,
  highlights,
  backHref = "/dashboard",
}: SectionPlaceholderProps) {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full min-h-screen">
        <section className="bg-card/80 shadow-lg p-6 sm:p-8 border border-border rounded-3xl glow-panel">
          <p className="text-[10px] text-muted uppercase tracking-[0.35em]">{eyebrow}</p>
          <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6 mt-3">
            <div className="max-w-3xl">
              <h1 className="font-semibold text-foreground text-3xl sm:text-4xl">{title}</h1>
              <p className="mt-3 text-muted text-sm sm:text-base leading-relaxed">{description}</p>
            </div>
            <Link
              href={backHref}
              className="inline-flex justify-center items-center px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
            >
              Voltar ao dashboard
            </Link>
          </div>

          <div className="gap-4 grid md:grid-cols-2 xl:grid-cols-3 mt-8">
            {highlights.map((item) => (
              <div key={item} className="bg-card/80 p-5 border border-border rounded-3xl">
                <p className="font-semibold text-foreground text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}