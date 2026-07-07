import type { Article } from "../types";
import ArticleCard from "./ArticleCard";

interface FeaturedArticleProps {
  article: Article;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <div className="mb-10">
      <ArticleCard article={article} eyebrow="Lead story" />
    </div>
  );
}
