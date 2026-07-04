import type { ContentBlock } from "../types";

/** Renders the block-based article body: headings, paragraphs, images, video (upload or YouTube), and audio, in author order. */
export default function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm text-slate-400 italic">No content yet.</p>;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return (
              <h3 key={block.id} className="font-display text-xl font-bold text-[#0B0F1A]">
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={block.id} className="text-sm leading-relaxed text-slate-700 sm:text-base">
                {block.text}
              </p>
            );
          case "image":
            return (
              <figure key={block.id}>
                <img src={block.url} alt={block.caption || ""} className="w-full rounded-lg object-cover" />
                {block.caption && (
                  <figcaption className="mt-1.5 text-center font-mono text-xs text-slate-400">{block.caption}</figcaption>
                )}
              </figure>
            );
          case "video":
            return (
              <figure key={block.id}>
                {block.source === "youtube" ? (
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <iframe
                      src={block.url}
                      title={block.caption || "Embedded video"}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video src={block.url} controls className="w-full rounded-lg" />
                )}
                {block.caption && (
                  <figcaption className="mt-1.5 text-center font-mono text-xs text-slate-400">{block.caption}</figcaption>
                )}
              </figure>
            );
          case "audio":
            return (
              <figure key={block.id}>
                <audio src={block.url} controls className="w-full" />
                {block.caption && (
                  <figcaption className="mt-1.5 font-mono text-xs text-slate-400">{block.caption}</figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
