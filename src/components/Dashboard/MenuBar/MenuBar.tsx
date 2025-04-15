import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, User } from 'lucide-react';

interface MenuBarProps {
  selectedCategory?: string | null;
  onBackToCategories?: () => void;
}

export function MenuBar({ selectedCategory = null, onBackToCategories }: MenuBarProps) {
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Breadcrumbs */}
            <div className="flex items-center">
              {selectedCategory && onBackToCategories ? (
                <div className="flex items-center">
                  {/* Home icon button - no text when in a category */}
                  <Button 
                    variant="ghost" 
                    onClick={onBackToCategories}
                    className="flex items-center justify-center h-7 w-7 rounded-full"
                    size="icon"
                    aria-label="Return to Home"
                    title="Return to Home"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                  <span className="mx-1 text-gray-500">›</span>
                  <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
                    {selectedCategory}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span className="text-sm font-medium sm:inline hidden">Home</span>
                </div>
              )}
            </div>
            
            {/* Right side: Profile placeholder */}
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }