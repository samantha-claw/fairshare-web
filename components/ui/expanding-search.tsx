"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useCallback } from "react";

interface ExpandingSearchDockProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function ExpandingSearchDock({
  onSearch,
  placeholder = "Search...",
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setQuery("");
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (onSearch && query) {
        onSearch(query);
      }
    },
    [onSearch, query]
  );

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleExpand}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-surface-2"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 text-text-secondary" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 32, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(12px)" }}
              className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface/90 backdrop-blur-md"
            >
              <div className="ml-3">
                <Search className="h-4 w-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="h-8 flex-1 bg-transparent pr-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <motion.button
                type="button"
                onClick={handleCollapse}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-2 flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-2 transition-colors"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5 text-text-secondary" />
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
