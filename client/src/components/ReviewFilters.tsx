import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

interface ReviewFiltersProps {
  selectedRating: number | null;
  sortBy: "recent" | "highest" | "helpful";
  onRatingChange: (rating: number | null) => void;
  onSortChange: (sort: "recent" | "highest" | "helpful") => void;
  ratingCounts?: { [key: number]: number };
}

export default function ReviewFilters({
  selectedRating,
  sortBy,
  onRatingChange,
  onSortChange,
  ratingCounts = {},
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Rating Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedRating === null ? "default" : "outline"}
          size="sm"
          onClick={() => onRatingChange(null)}
        >
          All Reviews
        </Button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <Button
            key={rating}
            variant={selectedRating === rating ? "default" : "outline"}
            size="sm"
            onClick={() => onRatingChange(rating)}
            className="gap-1"
          >
            <Star className="w-3 h-3 fill-current" />
            {rating}
            {ratingCounts[rating] && (
              <span className="text-xs opacity-70">({ratingCounts[rating]})</span>
            )}
          </Button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as any)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="highest">Highest Rated</SelectItem>
          <SelectItem value="helpful">Most Helpful</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
