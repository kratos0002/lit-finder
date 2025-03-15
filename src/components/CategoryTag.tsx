
import { Tag, BookText, BookOpen, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Map of category IDs to their respective icons
const categoryIcons: Record<string, LucideIcon> = {
  "fiction": BookOpen,
  "non-fiction": BookText,
  "science-fiction": BookOpen,
  "fantasy": BookOpen,
  "mystery": BookOpen,
  "biography": BookText,
  "history": BookText,
  "self-help": BookText,
  // Add more categories as needed
};

// Default icon if category not found
const DefaultIcon = Tag;

interface CategoryTagProps {
  category: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary" | "destructive";
  showIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  className?: string;
}

export function CategoryTag({
  category,
  description,
  size = "md",
  variant = "default",
  showIcon = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: CategoryTagProps) {
  const Icon = categoryIcons[category.toLowerCase()] || DefaultIcon;
  
  const sizeClasses = {
    sm: "text-xs py-0 px-2 h-5",
    md: "text-sm py-0.5 px-2.5 h-6",
    lg: "text-base py-1 px-3 h-8",
  };
  
  const iconSizes = {
    sm: { width: 10, height: 10 },
    md: { width: 12, height: 12 },
    lg: { width: 16, height: 16 },
  };
  
  const badge = (
    <Badge 
      variant={variant}
      className={cn(
        "font-medium transition-all cursor-pointer hover:opacity-80",
        onClick ? "cursor-pointer" : "",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showIcon && (
        <Icon 
          className="mr-1" 
          width={iconSizes[size].width} 
          height={iconSizes[size].height} 
        />
      )}
      {category}
    </Badge>
  );
  
  if (description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
}
