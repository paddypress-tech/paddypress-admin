import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useUiStore } from "@/store";
import { createCropYear, listCropYears } from "@/lib/cropYears";
import type { CropYear } from "@/types/cropYears";

function sortSeasons(a: { code: string }, b: { code: string }): number {
  const order: Record<string, number> = { KHARIF: 1, RABI: 2 };
  return (order[a.code] ?? 99) - (order[b.code] ?? 99);
}

function parseStartYearFromLabel(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Enter a crop year (example: 2025-26).");
  }

  const fourDigit = /^\d{4}$/.exec(trimmed);
  if (fourDigit) {
    const n = Number.parseInt(trimmed, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }

  const fromLabel = /^(\d{4})\s*[-/]\s*(\d{2}|\d{4})/.exec(trimmed);
  if (fromLabel) {
    const n = Number.parseInt(fromLabel[1], 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }

  const embedded = /(\d{4})/.exec(trimmed);
  if (embedded) {
    const n = Number.parseInt(embedded[1], 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }

  throw new Error("Enter a crop year (example: 2025-26).");
}

export default function CropYearsPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [startYearRaw, setStartYearRaw] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const cropYearsQuery = useQuery({
    queryKey: ["cropYears", 1, 50],
    queryFn: () => listCropYears({ page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const startYear = parseStartYearFromLabel(startYearRaw);
      return createCropYear({ startYear });
    },
    onSuccess: (res) => {
      showToast(res.message ?? "Crop year created.", "success");
      void queryClient.invalidateQueries({ queryKey: ["cropYears"] });
      setStartYearRaw("");
      setFormError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Create failed.";
      setFormError(message);
      showToast(message, "error");
    },
  });

  const items = cropYearsQuery.data?.data.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crop Years</CardTitle>
        <div className="text-sm text-muted-foreground">
          Admin creates crop years. Kharif and Rabi seasons are created automatically.
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="text-sm font-medium">Create crop year</div>
          <FieldDescription>
            Enter a crop year (example: 2025-26). The system creates Kharif and Rabi seasons.
          </FieldDescription>

          <FieldGroup className="max-w-sm">
            <Field>
              <FieldLabel htmlFor="startYear">Crop year</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Label</InputGroupAddon>
                <InputGroupInput
                  id="startYear"
                  inputMode="text"
                  placeholder="2025-26"
                  value={startYearRaw}
                  onChange={(e) => setStartYearRaw(e.target.value)}
                />
              </InputGroup>
            </Field>

            {formError ? <FieldError>{formError}</FieldError> : null}

            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </FieldGroup>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">List</div>
          {cropYearsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : cropYearsQuery.isError ? (
            <div className="text-sm text-destructive">Failed to load crop years.</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No crop years found.</div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-[160px_110px_1fr] gap-2 bg-muted px-3 py-2 text-xs font-medium">
                <div>Label</div>
                <div>Start year</div>
                <div>Seasons</div>
              </div>
              <div className="divide-y divide-border">
                {items.map((cy: CropYear) => (
                  <div
                    key={cy.id}
                    className="grid grid-cols-[160px_110px_1fr] items-center gap-2 px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{cy.label}</div>
                    <div className="text-xs">{cy.startYear}</div>
                    <div className="text-xs text-muted-foreground">
                      {cy.seasons
                        .slice()
                        .sort(sortSeasons)
                        .map((s) => s.name)
                        .join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
