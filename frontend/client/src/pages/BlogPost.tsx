import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  publishedAt: string;
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/posts/${slug}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Article not found");
          throw new Error("Failed to load article");
        }
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  // Helper to calculate reading time (approx 200 words per min)
  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // Format content paragraph-by-paragraph or support basic markdown-like structures
  const renderContent = (content: string) => {
    return content.split("\n\n").map((para, idx) => {
      // Basic headers detection
      if (para.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold tracking-tight text-foreground mt-8 mb-4">
            {para.replace("## ", "")}
          </h2>
        );
      }
      if (para.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold tracking-tight text-foreground mt-6 mb-3">
            {para.replace("### ", "")}
          </h3>
        );
      }
      if (para.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-lg font-bold tracking-tight text-foreground mt-4 mb-2">
            {para.replace("#### ", "")}
          </h4>
        );
      }
      
      // Bullets detection
      if (para.trim().startsWith("- ") || para.trim().startsWith("* ")) {
        const items = para.split("\n").map(item => item.replace(/^[-*]\s+/, ""));
        return (
          <ul key={idx} className="list-disc pl-6 my-4 space-y-2 text-muted-foreground leading-relaxed">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-muted-foreground leading-relaxed mb-6 text-base md:text-lg">
          {para}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container py-12 px-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="space-y-4 pt-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : error || !post ? (
          <div className="text-center py-16 bg-muted/20 border rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-destructive mb-2">{error || "Article Not Found"}</h3>
            <p className="text-muted-foreground mb-6">
              The article you are looking for may have been moved, deleted, or yet to be published.
            </p>
            <Link href="/blog">
              <Button>Browse Other Articles</Button>
            </Link>
          </div>
        ) : (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {/* Post Header */}
            <div className="border-b border-border/80 pb-8 mb-10">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                {post.title}
              </h1>
              
              {post.summary && (
                <p className="text-lg md:text-xl text-muted-foreground font-medium mb-6 leading-relaxed">
                  {post.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getReadingTime(post.content)}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="pb-16">
              {renderContent(post.content)}
            </div>
          </article>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8 max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ink Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
