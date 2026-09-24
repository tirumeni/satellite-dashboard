import type { ReactNode } from "react";
import { TreeDeciduous, Building2, Droplets, Flame } from "lucide-react";
import { Chip } from "@/components/ui/Chip";

interface ExamplePrompt {
  id: string;
  label: string;
  icon: ReactNode;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: "deforestation",
    label: "Deforestation near Manaus since 2023",
    icon: (
      <TreeDeciduous
        className="h-4 w-4 text-change-vegetation"
        strokeWidth={1.5}
      />
    ),
  },
  {
    id: "construction",
    label: "New construction in Dubai this year",
    icon: (
      <Building2 className="h-4 w-4 text-change-builtup" strokeWidth={1.5} />
    ),
  },
  {
    id: "water",
    label: "Lake Mead water levels since 2020",
    icon: <Droplets className="h-4 w-4 text-change-water" strokeWidth={1.5} />,
  },
  {
    id: "wildfire",
    label: "Wildfire damage in Northern California",
    icon: <Flame className="h-4 w-4 text-danger" strokeWidth={1.5} />,
  },
];

interface PromptChipsProps {
  onSelect: (label: string) => void;
  disabled?: boolean;
}

/**
 * PromptChips — example queries that fill (and immediately run) the
 * search bar, seeded with domain-relevant examples that match the
 * ChangeType union in src/types (vegetation / water / built-up / other).
 * Reuses the existing Chip primitive from components/ui.
 */
export function PromptChips({ onSelect, disabled }: PromptChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-tight">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <Chip
          key={prompt.id}
          icon={prompt.icon}
          disabled={disabled}
          onClick={() => onSelect(prompt.label)}
        >
          {prompt.label}
        </Chip>
      ))}
    </div>
  );
}
