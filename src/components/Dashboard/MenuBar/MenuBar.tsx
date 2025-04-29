/**
 * # MenuBar Component
 *
 * The `MenuBar` component provides a sticky navigation bar at the top of the dashboard. It includes breadcrumbs for navigation 
 * and a placeholder for user profile actions. This component is designed to enhance the user experience by offering quick 
 * access to categories and a consistent navigation structure.
 *
 * ## Key Features
 * - **Breadcrumb Navigation**:
 *   - Displays the current category name when a category is selected.
 *   - Includes a "Home" button to return to the main categories view.
 * - **Sticky Header**:
 *   - Remains visible at the top of the page as the user scrolls.
 *   - Includes a blurred background and shadow for better visual separation.
 * - **Profile Placeholder**:
 *   - Displays a profile icon button on the right side of the menu bar.
 *   - Can be extended in the future to include user-specific actions (e.g., account settings).
 *
 * ## Props
 * - `selectedCategory?: string | null`
 *   - The name of the currently selected category.
 *   - If `null`, the menu bar displays the "Home" breadcrumb.
 * - `onBackToCategories?: () => void`
 *   - Callback function triggered when the "Home" button is clicked.
 *   - Typically used to reset the view to the main categories screen.
 *
 * ## Usage
 * This component is typically used in `Dashboard.tsx` to provide navigation for category and device views:
 * ```tsx
 * <MenuBar
 *   selectedCategory={selectedCategory}
 *   onBackToCategories={() => setSelectedCategory(null)}
 * />
 * ```
 *
 * ## Integration with `Dashboard.tsx`
 * - The `MenuBar` component is rendered at the top of the dashboard.
 * - When a category is selected, the `selectedCategory` prop is set to the category name, and the `onBackToCategories` callback is used to navigate back to the main categories view.
 * - Example:
 *   ```tsx
 *   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
 *
 *   return (
 *     <div>
 *       <MenuBar
 *         selectedCategory={selectedCategory}
 *         onBackToCategories={() => setSelectedCategory(null)}
 *       />
 *       {selectedCategory ? (
 *         <CategoryView category={selectedCategory} />
 *       ) : (
 *         <MainCategories />
 *       )}
 *     </div>
 *   );
 *   ```
 *
 * ## Notes
 * - The `MenuBar` is styled to remain sticky at the top of the page, ensuring it is always accessible.
 * - The `selectedCategory` prop is optional, allowing the component to function as a simple navigation bar when no category is selected.
 * - The profile button is currently a placeholder and can be extended in the future to include user-specific functionality.
 *
 * ## Dependencies
 * - **Button**: A reusable button component from the UI library.
 * - **Icons**: Uses `Home` and `User` icons from the `lucide-react` library for visual elements.
 */

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