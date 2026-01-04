import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";


import { useUiStore } from "@/store";
import { listCropYears } from "@/lib/cropYears";
import { listMasterRiceTypes } from "@/lib/masterRiceTypes";
import {
  listSeasonBagRates,
  resetSeasonBagRates,
  upsertSeasonBagRates,
} from "@/lib/seasonBagRates";
import { formatBagSizeLabel, toNumberOrNull } from "@/lib/money";
import type { CropYear } from "@/types/cropYears";
import type { BagSize, SeasonCode } from "@/types/seasonBagRates";

import { BagRatesResetDialog } from "./BagRatesResetDialog";

const BAG_SIZES: BagSize[] = ["KG_40", "KG_75", "KG_100"];
const SEASONS: SeasonCode[] = ["KHARIF", "RABI"];

type RateInputs = Record<string, Record<BagSize, string>>;

function makeEmptyRates(riceTypeCodes: string[]): RateInputs {
  const next: RateInputs = {};
  for (const code of riceTypeCodes) {
    next[code] = {
      KG_40: "",
      KG_75: "",
      KG_100: "",
    };
  }
  return next;
}

function truncateToTwoDecimals(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "0.00";
  const factor = 100;
  return (Math.trunc(num * factor) / factor).toFixed(2);
}

export default function BagRatesPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const cropYearsQuery = useQuery({
    queryKey: ["cropYears", 1, 50],
    queryFn: () => listCropYears({ page: 1, limit: 50 }),
  });

  const riceTypesQuery = useQuery({
    queryKey: ["masterRiceTypes", "activeOnly"],
    queryFn: () => listMasterRiceTypes({ includeInactive: false }),
  });

  const cropYears = React.useMemo(() => {
    return cropYearsQuery.data?.data.items ?? [];
  }, [cropYearsQuery.data?.data.items]);

  const riceTypes = React.useMemo(() => {
    return riceTypesQuery.data?.data.items ?? [];
  }, [riceTypesQuery.data?.data.items]);

  const cropYearStartYearOptions = React.useMemo(() => {
    const years = cropYears.map((c: CropYear) => c.startYear);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [cropYears]);

  const [cropYearStartYear, setCropYearStartYear] = React.useState<number | null>(null);
  const [seasonCode, setSeasonCode] = React.useState<SeasonCode>("KHARIF");
  const [rates, setRates] = React.useState<RateInputs>({});
  const [initialRates, setInitialRates] = React.useState<RateInputs>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);


  React.useEffect(() => {
    if (cropYearStartYear !== null) return;
    const first = cropYearStartYearOptions[0];
    if (typeof first === "number") setCropYearStartYear(first);
  }, [cropYearStartYear, cropYearStartYearOptions]);

  const selectedYear = cropYearStartYear;

  React.useEffect(() => {
    setLastSavedAt(null);
    setFormError(null);
  }, [selectedYear, seasonCode]);



  const cropYearLabelByStartYear = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const cy of cropYears) {
      m.set(cy.startYear, cy.label);
    }
    return m;
  }, [cropYears]);

  const bagRatesQuery = useQuery({
    enabled: typeof selectedYear === "number",
    queryKey: ["seasonBagRates", selectedYear, seasonCode],
    queryFn: () =>
      listSeasonBagRates({
        cropYearStartYear: selectedYear as number,
        seasonCode,
      }),
  });

  const bagRateItems = React.useMemo(() => {
    return bagRatesQuery.data?.data.items ?? [];
  }, [bagRatesQuery.data?.data.items]);

  React.useEffect(() => {
    const codes = riceTypes.map((t) => t.code);
    const base = makeEmptyRates(codes);

    for (const item of bagRateItems) {
      if (!base[item.riceType.code]) continue;
      base[item.riceType.code].KG_40 =
        typeof item.rates.KG_40 === "number" ? truncateToTwoDecimals(item.rates.KG_40) : "";
      base[item.riceType.code].KG_75 =
        typeof item.rates.KG_75 === "number" ? truncateToTwoDecimals(item.rates.KG_75) : "";
      base[item.riceType.code].KG_100 =
        typeof item.rates.KG_100 === "number" ? truncateToTwoDecimals(item.rates.KG_100) : "";
    }

    setRates(base);
    setInitialRates(base);
    setFormError(null);
  }, [bagRateItems, riceTypes]);

  const isDirty = React.useMemo(() => {
    for (const rt of riceTypes) {
      for (const size of BAG_SIZES) {
        const current = rates[rt.code]?.[size] ?? "";
        const initial = initialRates[rt.code]?.[size] ?? "";
        if (current !== initial) return true;
      }
    }
    return false;
  }, [initialRates, rates, riceTypes]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (typeof selectedYear !== "number") {
        throw new Error("Select a crop year.");
      }

      const payloadRates: Array<{
        riceTypeCode: string;
        rates: { KG_40: number; KG_75: number; KG_100: number };
      }> = [];
      for (const rt of riceTypes) {
        const raw40 = rates[rt.code]?.KG_40 ?? "";
        const raw75 = rates[rt.code]?.KG_75 ?? "";
        const raw100 = rates[rt.code]?.KG_100 ?? "";

        const n40 = toNumberOrNull(raw40);
        const n75 = toNumberOrNull(raw75);
        const n100 = toNumberOrNull(raw100);

        if (n100 === null) {
          throw new Error(`Enter a rate for ${rt.code} (${formatBagSizeLabel("KG_100")}).`);
        }
        if (n75 === null) {
          throw new Error(`Enter a rate for ${rt.code} (${formatBagSizeLabel("KG_75")}).`);
        }
        if (n40 === null) {
          throw new Error(`Enter a rate for ${rt.code} (${formatBagSizeLabel("KG_40")}).`);
        }

        if (n100 < 0) {
          throw new Error(`Enter a valid rate for ${rt.code} (${formatBagSizeLabel("KG_100")}).`);
        }
        if (n75 < 0) {
          throw new Error(`Enter a valid rate for ${rt.code} (${formatBagSizeLabel("KG_75")}).`);
        }
        if (n40 < 0) {
          throw new Error(`Enter a valid rate for ${rt.code} (${formatBagSizeLabel("KG_40")}).`);
        }

        payloadRates.push({
          riceTypeCode: rt.code,
          rates: {
            KG_40: n40,
            KG_75: n75,
            KG_100: n100,
          },
        });
      }

      return upsertSeasonBagRates({
        cropYearStartYear: selectedYear,
        seasonCode,
        rates: payloadRates,
      });
    },
    onSuccess: (res) => {
      showToast(res.message ?? "Bag rates updated.", "success");
      const codes = riceTypes.map((t) => t.code);
      const base = makeEmptyRates(codes);

      const existing = res.data.items ?? [];
      for (const item of existing) {
        if (!base[item.riceType.code]) continue;
        base[item.riceType.code].KG_40 =
          typeof item.rates.KG_40 === "number" ? truncateToTwoDecimals(item.rates.KG_40) : "";
        base[item.riceType.code].KG_75 =
          typeof item.rates.KG_75 === "number" ? truncateToTwoDecimals(item.rates.KG_75) : "";
        base[item.riceType.code].KG_100 =
          typeof item.rates.KG_100 === "number" ? truncateToTwoDecimals(item.rates.KG_100) : "";
      }

      setRates(base);
      setInitialRates(base);
      setLastSavedAt(new Date().toISOString());
      void queryClient.invalidateQueries({ queryKey: ["seasonBagRates", selectedYear, seasonCode] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Save failed.";
      setFormError(message);
      showToast(message, "error");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (typeof selectedYear !== "number") {
        throw new Error("Select a crop year.");
      }

      return resetSeasonBagRates({
        cropYearStartYear: selectedYear,
        seasonCode,
        confirm: "RESET",
      });
    },
    onSuccess: (res) => {
      showToast(res.message ?? "Bag rates reset to 0.00.", "success");

      const codes = riceTypes.map((t) => t.code);
      const base = makeEmptyRates(codes);

      const existing = res.data.items ?? [];
      for (const item of existing) {
        if (!base[item.riceType.code]) continue;
        base[item.riceType.code].KG_40 =
          typeof item.rates.KG_40 === "number" ? truncateToTwoDecimals(item.rates.KG_40) : "";
        base[item.riceType.code].KG_75 =
          typeof item.rates.KG_75 === "number" ? truncateToTwoDecimals(item.rates.KG_75) : "";
        base[item.riceType.code].KG_100 =
          typeof item.rates.KG_100 === "number" ? truncateToTwoDecimals(item.rates.KG_100) : "";
      }

      setRates(base);
      setInitialRates(base);
      setLastSavedAt(new Date().toISOString());
      setFormError(null);
      setResetOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["seasonBagRates", selectedYear, seasonCode] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Reset failed.";
      setFormError(message);
      showToast(message, "error");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bag Rates</CardTitle>
        <div className="text-sm text-muted-foreground">
          Set bag rates for each rice type and bag size. Rates are stored in rupees.
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Crop year</FieldLabel>
            <Select
              value={typeof selectedYear === "number" ? String(selectedYear) : ""}
              onValueChange={(v) => setCropYearStartYear(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {cropYearStartYearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {cropYearLabelByStartYear.get(y) ?? String(y)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Season</FieldLabel>
            <Select
              value={seasonCode}
              onValueChange={(v) => setSeasonCode((v ?? "KHARIF") as SeasonCode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "KHARIF" ? "Kharif" : "Rabi"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <FieldDescription>
          Enter the 100kg rate. The 75kg and 40kg rates will be calculated automatically.
        </FieldDescription>

        {riceTypesQuery.isLoading || cropYearsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : riceTypes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No active rice types found. Create rice types first.
          </div>
        ) : bagRatesQuery.isError ? (
          <div className="text-sm text-destructive">
            {bagRatesQuery.error instanceof Error
              ? bagRatesQuery.error.message
              : "Failed to load bag rates."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-[200px]">Rice Type</TableHead>
                <TableHead>100 kg Rate</TableHead>
                <TableHead>75 kg Rate</TableHead>
                <TableHead>40 kg Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riceTypes.map((rt) => (
                <TableRow key={rt.code}>
                  <TableCell className="font-medium">
                    <div>{rt.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{rt.code}</div>
                  </TableCell>
                  <TableCell>
                    <InputGroup className="bg-background border-input shadow-xs ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <InputGroupAddon className="bg-transparent">₹</InputGroupAddon>
                      <InputGroupInput
                        inputMode="decimal"
                        placeholder="0.00"
                        value={rates[rt.code]?.["KG_100"] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const num = toNumberOrNull(v);

                          setRates((prev) => {
                            const newRates = {
                              ...(prev[rt.code] ?? { KG_40: "", KG_75: "", KG_100: "" }),
                              KG_100: v,
                            };

                            if (num !== null) {
                              newRates.KG_75 = truncateToTwoDecimals((num / 100) * 75);
                              newRates.KG_40 = truncateToTwoDecimals((num / 100) * 40);
                            } else {
                              newRates.KG_75 = "";
                              newRates.KG_40 = "";
                            }

                            return {
                              ...prev,
                              [rt.code]: newRates,
                            };
                          });
                        }}
                      />
                    </InputGroup>
                  </TableCell>
                  <TableCell>
                    <InputGroup className="bg-muted/40 opacity-80 border-muted-foreground/10 cursor-not-allowed">
                      <InputGroupAddon className="bg-transparent opacity-50">₹</InputGroupAddon>
                      <InputGroupInput
                        readOnly
                        tabIndex={-1}
                        className="cursor-not-allowed"
                        value={rates[rt.code]?.["KG_75"] ?? ""}
                      />
                    </InputGroup>
                  </TableCell>
                  <TableCell>
                    <InputGroup className="bg-muted/40 opacity-80 border-muted-foreground/10 cursor-not-allowed">
                      <InputGroupAddon className="bg-transparent opacity-50">₹</InputGroupAddon>
                      <InputGroupInput
                        readOnly
                        tabIndex={-1}
                        className="cursor-not-allowed"
                        value={rates[rt.code]?.["KG_40"] ?? ""}
                      />
                    </InputGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-3 border-t border-border">
        <div className="min-w-0">
          {formError ? (
            <FieldError>{formError}</FieldError>
          ) : riceTypes.length === 0 ? null : isDirty ? (
            <div className="text-xs text-muted-foreground">Unsaved changes.</div>
          ) : lastSavedAt ? (
            <div className="text-xs text-muted-foreground">All changes saved.</div>
          ) : (
            <div className="text-xs text-muted-foreground">No changes.</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saveMutation.isPending || resetMutation.isPending || riceTypes.length === 0}
            onClick={() => setResetOpen(true)}
          >
            Reset
          </Button>

          <Button
            disabled={
              saveMutation.isPending ||
              resetMutation.isPending ||
              riceTypes.length === 0 ||
              typeof selectedYear !== "number" ||
              !isDirty
            }
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardFooter>

      <BagRatesResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onReset={() => resetMutation.mutate()}
        isResetting={resetMutation.isPending}
        isSaving={saveMutation.isPending}
        riceTypesCount={riceTypes.length}
        hasYearSelected={typeof selectedYear === "number"}
      />
    </Card>
  );
}
