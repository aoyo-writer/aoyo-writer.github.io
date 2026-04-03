import { useState, useMemo } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { useAllWorks } from "../../db/useWorks";
import type { WorkStatus, WorkType, CompletionStatus } from "../../types";
import FilterSidebar from "./FilterSidebar";
import WorkBlurb from "./WorkBlurb";

interface Filters {
  status: WorkStatus[];
  type: WorkType[];
  completion: CompletionStatus[];
  searchText: string;
  sortBy: string;
}

const defaultFilters: Filters = {
  status: [],
  type: [],
  completion: [],
  searchText: "",
  sortBy: "updatedAt",
};

export default function WorkListPage() {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const allWorks = useAllWorks();
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const filteredWorks = useMemo(() => {
    if (!allWorks) return [];

    let works = [...allWorks];

    // Filter by status
    if (filters.status.length > 0) {
      works = works.filter((w) => filters.status.includes(w.status));
    }

    // Filter by type
    if (filters.type.length > 0) {
      works = works.filter((w) => filters.type.includes(w.type));
    }

    // Filter by completion
    if (filters.completion.length > 0) {
      works = works.filter((w) =>
        filters.completion.includes(w.completionStatus),
      );
    }

    // Search
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase();
      works = works.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.subjects.some((s) => s.toLowerCase().includes(q)) ||
          w.topics.some((t) => t.toLowerCase().includes(q)) ||
          w.keyTerms.some((k) => k.toLowerCase().includes(q)) ||
          w.freeformTags.some((f) => f.toLowerCase().includes(q)),
      );
    }

    // Sort
    works.sort((a, b) => {
      switch (filters.sortBy) {
        case "createdAt":
          return b.createdAt.localeCompare(a.createdAt);
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        case "wordCount":
          return b.wordCount - a.wordCount;
        case "title":
          return a.title.localeCompare(b.title);
        case "updatedAt":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });

    return works;
  }, [allWorks, filters]);

  return (
    <Box
      id="main"
      sx={{
        maxWidth: 980,
        mx: "auto",
        px: isMobile ? 1 : "3em",
        py: "1em",
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "1.5em",
            fontWeight: "normal",
            color: "#2a2a2a",
          }}
        >
          Works
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
          {filteredWorks.length} Work{filteredWorks.length !== 1 && "s"} found
        </Typography>
      </Box>

      <Box
        sx={{
          display: isMobile ? "block" : "flex",
          gap: 0,
          alignItems: "flex-start",
        }}
      >
        <FilterSidebar filters={filters} onFiltersChange={setFilters} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {filteredWorks.length === 0 ? (
            <Box
              sx={{
                border: "1px solid #ddd",
                p: 3,
                textAlign: "center",
                color: "#666",
              }}
            >
              <Typography
                sx={{ fontFamily: "Georgia, serif", fontSize: "1.2em", mb: 1 }}
              >
                No works yet
              </Typography>
              <Typography sx={{ fontSize: "0.9rem" }}>
                Click <strong>Create</strong> in the nav bar to start writing.
              </Typography>
            </Box>
          ) : (
            <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {filteredWorks.map((work) => (
                <WorkBlurb key={work.id} work={work} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
