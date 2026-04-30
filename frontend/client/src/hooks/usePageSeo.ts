import { useEffect } from "react";

type PageSeoInput = {
  title: string;
  description: string;
};

function upsertDescriptionMeta(content: string) {
  const existing = document.querySelector('meta[name="description"]');

  if (existing) {
    existing.setAttribute("content", content);
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
}

export function usePageSeo({ title, description }: PageSeoInput) {
  useEffect(() => {
    document.title = title;
    upsertDescriptionMeta(description);
  }, [title, description]);
}
