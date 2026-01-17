import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TattooCardProps {
  image: string;
  artistName: string;
  artistInitials: string;
  location: string;
  rating: number;
  reviewCount: number;
}

export default function TattooCard({
  image,
  artistName,
  artistInitials,
  location,
  rating,
  reviewCount,
}: TattooCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={`Tattoo by ${artistName}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {artistInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{artistName}</h3>
            <p className="text-xs text-muted-foreground truncate">{location}</p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-1">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(rating) ? "text-primary" : "text-muted"}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>
      </div>
    </Card>
  );
}
