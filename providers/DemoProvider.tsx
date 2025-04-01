"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import demoData, { DemoElementId, DemoStep } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { HelpCircle, X } from "lucide-react";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the context type
interface DemoContextType {
  visibleDemoItems: DemoStep[];
  dismissDemoItem: (itemId: string) => void;
  resetDismissedItems: () => void;
  isDemoAvailable: boolean;
}

// Create the context with default values
const DemoContext = createContext<DemoContextType>({
  visibleDemoItems: [],
  dismissDemoItem: () => {},
  resetDismissedItems: () => {},
  isDemoAvailable: false,
});

// Hook to use the demo context
export const useContextualDemo = () => useContext(DemoContext);

// Props for the DemoProvider component
interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [visibleDemoItems, setVisibleDemoItems] = useState<DemoStep[]>([]);
  const [dismissedItemIds, setDismissedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [highlightedElementId, setHighlightedElementId] =
    useState<DemoElementId | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { toast } = useToast();

  // Dismiss a demo item
  const dismissDemoItem = useCallback(
    (itemId: string) => {
      setDismissedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      toast({
        title: "Item dismissed",
        description: "This tip won't appear in the current session.",
      });
    },
    [toast],
  );

  // Reset all dismissed items
  const resetDismissedItems = useCallback(() => {
    setDismissedItemIds(new Set());
    toast({
      title: "Demo reset",
      description: "All demo tips are now available again.",
    });
  }, [toast]);

  // Scan the DOM for elements with demo IDs and update the visible demo items
  const scanForDemoElements = useCallback(() => {
    // Create a map of all possible demo element IDs
    const allElementIds = Object.values(DemoElementId);

    // Check which demo elements are currently in the DOM
    const visibleElementIds = allElementIds.filter(id => {
      return document.getElementById(id) !== null;
    });

    if (visibleElementIds.length === 0) {
      setVisibleDemoItems([]);
      return;
    }

    // Find all demo steps that target the visible elements
    const relevantDemoSteps = demoData.filter(step => {
      // If the step doesn't target any elements, skip it
      if (!step.targetIds || step.targetIds.length === 0) return false;

      // If the step targets any visible element, include it
      return step.targetIds.some(
        targetId =>
          visibleElementIds.includes(targetId) &&
          !dismissedItemIds.has(step.id),
      );
    });

    setVisibleDemoItems(relevantDemoSteps);
  }, [dismissedItemIds]);

  // Remove highlight when popover closes
  useEffect(() => {
    if (!isPopoverOpen) {
      removeAllHighlights();
      setHighlightedElementId(null);
      setSelectedItemId(null);
    }
  }, [isPopoverOpen]);

  // Scan for demo elements periodically and when the component mounts
  useEffect(() => {
    // Initial scan
    scanForDemoElements();

    // Set up a mutation observer to detect DOM changes
    const observer = new MutationObserver(() => {
      scanForDemoElements();
      // Don't automatically highlight elements when DOM changes
      // Only highlight when user explicitly clicks an item
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up
    return () => {
      observer.disconnect();
      removeAllHighlights();
    };
  }, [scanForDemoElements]);

  // Check if any demo items are available
  const isDemoAvailable = visibleDemoItems.length > 0;

  // Close the popover if all items are dismissed
  useEffect(() => {
    if (isPopoverOpen && visibleDemoItems.length === 0) {
      setIsPopoverOpen(false);
    }
  }, [visibleDemoItems.length, isPopoverOpen]);

  // Remove all highlights from elements
  const removeAllHighlights = () => {
    document.querySelectorAll(".demo-highlight").forEach(el => {
      el.classList.remove("demo-highlight");
    });
  };

  // Highlight a target element when selected in the popover
  const highlightElement = (elementId: DemoElementId) => {
    // Remove existing highlights
    removeAllHighlights();

    const element = document.getElementById(elementId);
    if (!element) return;

    // Set the current highlighted element
    setHighlightedElementId(elementId);

    // Add highlight class to the element
    element.classList.add("demo-highlight");

    // Scroll element into view
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Context value
  const contextValue: DemoContextType = {
    visibleDemoItems,
    dismissDemoItem,
    resetDismissedItems,
    isDemoAvailable,
  };

  // Get the highest priority visible item for the button pulse effect
  // No automatic highlighting for urgent items - only highlight on click
  const hasUrgentItems = visibleDemoItems.some(
    item => (item.priority || 0) >= 9,
  );

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
      {/* Demo button that appears when demo content is available */}
      {isDemoAvailable && (
        <div
          className="fixed z-50"
          style={{
            top: 10,
            right: 120,
          }}
        >
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "rounded-full bg-blue-500 hover:bg-blue-600 text-white",
                )}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 " align="end" sideOffset={5}>
              <div className="flex flex-col divide-y dark:divide-gray-700">
                <div className="p-4 ">
                  <h3 className="font-semibold dark:text-gray-100">
                    Available Demo Tips
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Click on a tip to see more information
                  </p>
                </div>

                {visibleDemoItems
                  .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                  .map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors",
                        selectedItemId === item.id &&
                          "bg-gray-100 dark:bg-gray-700",
                      )}
                      onClick={() => {
                        // Set as selected item
                        setSelectedItemId(item.id);

                        // Highlight the first target element ONLY when clicked
                        if (item.targetIds && item.targetIds.length > 0) {
                          highlightElement(item.targetIds[0]);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium dark:text-gray-100">
                          {item.title}
                        </h4>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-6 w-6 -mt-1 -mr-1",
                            "dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50",
                          )}
                          onClick={e => {
                            e.stopPropagation();
                            dismissDemoItem(item.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm mt-1 dark:text-gray-300">
                        {item.content}
                      </p>
                    </div>
                  ))}

                {/* Reset button */}
                {dismissedItemIds.size > 0 && (
                  <div className="p-3 dark:bg-gray-900">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full",
                        "dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
                      )}
                      onClick={resetDismissedItems}
                    >
                      Reset Dismissed Tips
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Add global styles for highlighted elements */}
      <style jsx global>{`
        .demo-highlight {
          position: relative;
          z-index: 20;
          transition: all 0.3s ease;
        }

        /* Light mode highlight */
        :root:not(.dark) .demo-highlight {
          box-shadow:
            0 0 0 3px rgba(0, 0, 0, 0.9),
            0 0 15px rgba(59, 130, 246, 0.7);
          border-radius: 4px;
        }

        /* Dark mode highlight */
        .dark .demo-highlight {
          box-shadow:
            0 0 0 3px rgba(147, 197, 253, 0.8),
            0 0 15px rgba(29, 78, 216, 0.6);
          border-radius: 4px;
        }
      `}</style>
    </DemoContext.Provider>
  );
};

export default DemoProvider;
