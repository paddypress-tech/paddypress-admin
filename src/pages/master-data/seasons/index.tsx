import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { listCropYears } from "@/lib/cropYears";
import type { CropYear, Season } from "@/types/cropYears";

function deriveSeasonStatus(season: Season): "NOT_STARTED" | "ACTIVE" | "ENDED" {
  if (season.endedAt) return "ENDED";
  if (season.startedAt) return "ACTIVE";
  return "NOT_STARTED";
}

function StatusBadge({ status }: { status: "NOT_STARTED" | "ACTIVE" | "ENDED" }) {
  const variant = status === "ACTIVE" ? "default" : status === "ENDED" ? "outline" : "secondary";
  const label = status === "ACTIVE" ? "Ongoing" : status === "ENDED" ? "Ended" : "Not started";
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SeasonsPage() {
  const cropYearsQuery = useQuery({
    queryKey: ["cropYears", 1, 50],
    queryFn: () => listCropYears({ page: 1, limit: 50 }),
  });

  const cropYears = cropYearsQuery.data?.data.items ?? [];

  const [selectedId, setSelectedId] = React.useState<string>("");

  React.useEffect(() => {
    if (selectedId) return;
    const first = cropYears[0]?.id;
    if (first) setSelectedId(first);
  }, [cropYears, selectedId]);

  const selected: CropYear | null =
    cropYears.find((c) => c.id === selectedId) ?? null;

  const selectedLabel = selected?.label ?? "Select crop year";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasons</CardTitle>
        <div className="text-sm text-muted-foreground">
          This view is read-only. Season start/end is handled by millers and managers. “Ongoing” means this season is currently open for this organization.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <Select value={selectedId} onValueChange={(value) => setSelectedId(value ?? "")}>
            <SelectTrigger className="w-full">
              <span className="flex flex-1 text-left">{selectedLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cropYears.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {cropYearsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : cropYearsQuery.isError ? (
          <div className="text-sm text-destructive">Failed to load seasons.</div>
        ) : !selected ? (
          <div className="text-sm text-muted-foreground">No crop year selected.</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="grid grid-cols-[120px_140px_140px_120px] gap-2 bg-muted px-3 py-2 text-xs font-medium">
              <div>Season</div>
              <div>Started</div>
              <div>Ended</div>
              <div>Status</div>
            </div>
            <div className="divide-y divide-border">
              {selected.seasons.map((s: Season) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[120px_140px_140px_120px] items-center gap-2 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(s.startedAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(s.endedAt)}
                  </div>
                  <div>
                    <StatusBadge status={deriveSeasonStatus(s)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
