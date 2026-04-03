import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  useMediaQuery,
} from "@mui/material";
import type { WorkStatus, WorkType, CompletionStatus } from "../../types";

interface FilterSidebarProps {
  filters: {
    status: WorkStatus[];
    type: WorkType[];
    completion: CompletionStatus[];
    searchText: string;
    sortBy: string;
  };
  onFiltersChange: (filters: FilterSidebarProps["filters"]) => void;
}

const statusOptions: WorkStatus[] = ["Draft", "In Progress", "Final", "Archived"];
const typeOptions: WorkType[] = ["Essay", "Research Paper", "Story", "Notes", "Other"];
const completionOptions: CompletionStatus[] = ["Complete", "Work in Progress"];
const sortOptions = [
  { value: "updatedAt", label: "Last Modified" },
  { value: "createdAt", label: "Date Created" },
  { value: "deadline", label: "Deadline" },
  { value: "wordCount", label: "Word Count" },
  { value: "title", label: "Title A-Z" },
];

const ao3ButtonSx = {
  background: "linear-gradient(#fff 2%, #ddd 95%, #bbb 100%)",
  border: "1px solid #bbb",
  color: "#2a2a2a",
  fontSize: "0.85rem",
  textTransform: "none" as const,
  p: "0.25em 0.75em",
  borderRadius: "0.25em",
  "&:hover": {
    background: "linear-gradient(#fff 2%, #ccc 95%, #aaa 100%)",
  },
};

export default function FilterSidebar({
  filters,
  onFiltersChange,
}: FilterSidebarProps) {
  const isMobile = useMediaQuery("(max-width: 42em)");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleArrayFilter = <T extends string>(
    arr: T[],
    value: T,
    key: keyof FilterSidebarProps["filters"],
  ) => {
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const filterContent = (
    <Box>
      {/* Sort */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="dt"
          sx={{ fontSize: "0.85rem", fontWeight: "bold", mb: 0.25 }}
        >
          Sort by
        </Typography>
        <Box
          component="select"
          value={filters.sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onFiltersChange({ ...filters, sortBy: e.target.value })
          }
          sx={{
            width: "100%",
            p: "0.25em",
            border: "1px solid #bbb",
            borderRadius: "0.25em",
            fontSize: "0.85rem",
            backgroundColor: "#fff",
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="dt"
          sx={{
            fontSize: "0.85rem",
            fontWeight: "bold",
            mb: 0.25,
            borderBottom: "1px solid #ddd",
            pb: 0.25,
          }}
        >
          Search
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search title or tags..."
          value={filters.searchText}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchText: e.target.value })
          }
          sx={{
            mt: 0.5,
            "& .MuiOutlinedInput-root": {
              fontSize: "0.85rem",
              borderRadius: "0.25em",
              height: 28,
            },
          }}
        />
      </Box>

      {/* Status */}
      <FilterSection
        title="Status"
        options={statusOptions}
        selected={filters.status}
        onToggle={(v) => toggleArrayFilter(filters.status, v, "status")}
      />

      {/* Type */}
      <FilterSection
        title="Type"
        options={typeOptions}
        selected={filters.type}
        onToggle={(v) => toggleArrayFilter(filters.type, v, "type")}
      />

      {/* Completion */}
      <FilterSection
        title="Completion"
        options={completionOptions}
        selected={filters.completion}
        onToggle={(v) =>
          toggleArrayFilter(filters.completion, v, "completion")
        }
      />
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ mb: 1.5 }}>
        <Button
          fullWidth
          onClick={() => setFiltersOpen(!filtersOpen)}
          sx={ao3ButtonSx}
        >
          {filtersOpen ? "Hide Filters" : "Filters"}
        </Button>
        {filtersOpen && (
          <Box
            sx={{
              border: "1px solid #ddd",
              p: "1em",
              overflow: "hidden",
              mt: 0.5,
            }}
          >
            {filterContent}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 200,
        minWidth: 200,
        border: "1px solid #ddd",
        p: "1em",
        overflow: "hidden",
        mr: 2,
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontFamily: "Georgia, serif",
          fontSize: "1.286em",
          fontWeight: "normal",
          mb: 1,
          borderBottom: "1px solid #ddd",
          pb: 0.5,
        }}
      >
        Filters
      </Typography>
      {filterContent}
    </Box>
  );
}

function FilterSection<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        component="dt"
        sx={{
          fontSize: "0.85rem",
          fontWeight: "bold",
          mb: 0.25,
          borderBottom: "1px solid #ddd",
          pb: 0.25,
        }}
      >
        {title}
      </Typography>
      <Box component="dd" sx={{ m: 0 }}>
        {options.map((opt) => (
          <FormControlLabel
            key={opt}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                sx={{
                  color: "#bbb",
                  "&.Mui-checked": { color: "#990000" },
                  p: "2px",
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "0.8rem", color: "#2a2a2a" }}>
                {opt}
              </Typography>
            }
            sx={{ display: "flex", ml: 0, mb: -0.75 }}
          />
        ))}
      </Box>
    </Box>
  );
}
