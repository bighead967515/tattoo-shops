import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  publishedAt: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog/posts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch blog posts");
        return res.json();
      })
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Helper to calculate reading time (approx 200 words per min)
  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 px-6 border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            The Ink & Canvas Blog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore industry-leading guides, tattoo aftercare tips, design inspirations, and expert artist perspectives.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-16 px-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="overflow-hidden border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-4 pt-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Blog</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Articles Published Yet</h3>
            <p className="text-muted-foreground">Our weekly publication cycle starts soon. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="group flex flex-col overflow-hidden border border-border bg-card/50 backdrop-blur hover:bg-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 rounded-xl"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6">
                      {post.summary || post.content.substring(0, 150) + "..."}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getReadingTime(post.content)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6 mt-auto">
                  <Link href={`/blog/${post.slug}`} className="w-full">
                    <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50 transition-all duration-300">
                      Read Article
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8 max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ink Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
