import { Link } from "react-router-dom";
import { sections, type Block, type Section } from "@/content/caseStudy";

export default function CaseStudy() {
  return (
    <article className="paper-bg">
      {sections.map((section, i) => (
        <SectionRenderer key={section.slug} section={section} index={i} />
      ))}

      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="rule mb-12 max-w-[12rem] mx-auto" />
        <p className="kicker mb-6">Now try it</p>
        <Link to="/app" className="btn-primary text-lg">
          Launch interactive demo →
        </Link>
      </div>
    </article>
  );
}

function SectionRenderer({ section, index }: { section: Section; index: number }) {
  const isHero = index === 0;
  return (
    <section
      className={`max-w-6xl mx-auto px-6 ${isHero ? "pt-24 pb-16" : "py-20"} ${
        index > 0 ? "border-t border-paper-rule" : ""
      }`}
    >
      <div className="grid grid-cols-12 gap-8">
        <header className="col-span-12 md:col-span-4">
          <p className="kicker mb-3">{section.kicker}</p>
          <h2
            className={`font-display text-ink-900 ${
              isHero ? "text-display-lg" : "text-display-sm md:text-display-md"
            } leading-tight`}
          >
            {section.title}
          </h2>
        </header>

        <div className="col-span-12 md:col-span-8 md:pl-8">
          <div className="space-y-6 prose-col">
            {section.blocks.map((block, j) => (
              <BlockRenderer key={j} block={block} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return <p className="text-lg leading-relaxed text-ink-700">{block.text}</p>;
    case "heading":
      return (
        <h3
          className={`font-display text-ink-900 ${
            block.level === 2 ? "text-2xl mt-10" : "text-xl mt-6"
          }`}
        >
          {block.text}
        </h3>
      );
    case "pull":
      return (
        <figure className="my-8 pl-6 border-l-2 border-ochre">
          <blockquote className="font-display italic text-xl leading-snug text-ink-900">
            {block.text}
          </blockquote>
          {block.attribution && (
            <figcaption className="mt-2 font-mono text-xs text-ink-500">
              {block.attribution}
            </figcaption>
          )}
        </figure>
      );
    case "metric":
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1 py-4 border-t border-paper-rule">
          <div className="tabular text-3xl font-medium text-ochre-deep">{block.value}</div>
          <div>
            <p className="font-medium text-ink-900">{block.label}</p>
            {block.context && <p className="text-sm text-ink-500 mt-1">{block.context}</p>}
          </div>
        </div>
      );
    case "tradeoff":
      return (
        <div className="my-6 fin-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="kicker mb-1">Chose</p>
              <p className="font-medium text-ink-900">{block.chose}</p>
            </div>
            <div>
              <p className="kicker mb-1">Over</p>
              <p className="font-medium text-ink-700">{block.over}</p>
            </div>
          </div>
          <div className="rule my-4" />
          <p className="text-sm text-ink-500 leading-relaxed">
            <span className="kicker mr-2">Because</span>
            {block.because}
          </p>
        </div>
      );
    case "list":
      if (block.ordered) {
        return (
          <ol className="list-none space-y-3 text-lg text-ink-700">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-4">
                <span className="tabular text-ochre-deep font-medium shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-none space-y-2 text-lg text-ink-700">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="text-ochre mt-2.5 shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "spacer":
      return <div className="h-8" />;
  }
}
