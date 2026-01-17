import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

export interface FilterState {
  styles: string[];
  minRating: number;
  minExperience: number;
}

interface ArtistFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const TATTOO_STYLES = [
  "Realism",
  "Traditional",
  "Watercolor",
  "Japanese",
  "Tribal",
  "Geometric",
  "Blackwork",
  "Neo-Traditional",
  "Minimalist",
  "Portrait",
  "Abstract",
  "Fine Line",
];

export default function ArtistFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ArtistFiltersProps) {
  const handleStyleToggle = (style: string) => {
    const newStyles = filters.styles.includes(style)
      ? filters.styles.filter((s) => s !== style)
      : [...filters.styles, style];
    
    onFiltersChange({ ...filters, styles: newStyles });
  };

  const handleRatingChange = (value: number[]) => {
    onFiltersChange({ ...filters, minRating: value[0] });
  };

  const handleExperienceChange = (value: number[]) => {
    onFiltersChange({ ...filters, minExperience: value[0] });
  };

  const hasActiveFilters =
    filters.styles.length > 0 ||
    filters.minRating > 0 ||
    filters.minExperience > 0;

  return (
    <Card className="p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tattoo Styles */}
        <div>
          <h4 className="font-medium mb-3">Tattoo Styles</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {TATTOO_STYLES.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={`style-${style}`}
                  checked={filters.styles.includes(style)}
                  onCheckedChange={() => handleStyleToggle(style)}
                />
                <Label
                  htmlFor={`style-${style}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {style}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Minimum Rating</h4>
            <span className="text-sm text-muted-foreground">
              {filters.minRating > 0 ? `${filters.minRating}+ ★` : "Any"}
            </span>
          </div>
          <Slider
            value={[filters.minRating]}
            onValueChange={handleRatingChange}
            min={0}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Any</span>
            <span>5★</span>
          </div>
        </div>

        {/* Minimum Experience */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Experience</h4>
            <span className="text-sm text-muted-foreground">
              {filters.minExperience > 0
                ? `${filters.minExperience}+ years`
                : "Any"}
            </span>
          </div>
          <Slider
            value={[filters.minExperience]}
            onValueChange={handleExperienceChange}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Any</span>
            <span>20+ yrs</span>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.styles.map((style) => (
              <span
                key={style}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {style}
                <button
                  onClick={() => handleStyleToggle(style)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {filters.minRating}+ ★
              </span>
            )}
            {filters.minExperience > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {filters.minExperience}+ years
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
