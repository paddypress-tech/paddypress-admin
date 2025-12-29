import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  createAdminIkpMandal,
  deactivateAdminIkpMandal,
  listAdminIkpDistricts,
  listAdminIkpMandals,
  listAdminIkpStates,
  updateAdminIkpMandal,
} from "@/lib/adminIkpLocations";
import type { AdminIkpDistrict, AdminIkpMandal, AdminIkpState } from "@/types/adminIkpLocations";

const mandalSchema = z.object({
  districtId: z.string().min(1, "Select a district."),
  name: z.string().min(1, "Enter a mandal name.").max(100, "Max 100 characters."),
  isActive: z.boolean(),
});

type MandalFormData = z.infer<typeof mandalSchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Active" : "Inactive"}</Badge>;
}

function MandalDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: MandalFormData;
  onSave: (data: MandalFormData) => void;
  isSaving: boolean;
  districts: AdminIkpDistrict[];
  disableDistrict?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<MandalFormData>({
    resolver: zodResolver(mandalSchema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    if (props.open) reset(props.initialValues);
  }, [props.open, props.initialValues, reset]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>District</FieldLabel>
              <Controller
                control={control}
                name="districtId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    disabled={props.disableDistrict}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.districtId ? [errors.districtId] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="mandalName">Mandal name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="mandalName" placeholder="Rajahmundry Rural" {...register("name")} />
              </InputGroup>
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>

            <Field>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                  )}
                />
                <span>Active</span>
              </label>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isSaving || !isValid || (props.disableDistrict ? !isDirty : false)}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IkpMandalsPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [stateId, setStateId] = React.useState<string>("");
  const [districtId, setDistrictId] = React.useState<string>("");
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpMandal | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminIkpMandal | null>(null);

  const statesQuery = useQuery({
    queryKey: ["adminIkpStatesForMandals"],
    queryFn: () => listAdminIkpStates({ page: 1, limit: 200, includeInactive: true }),
  });

  const districtsQuery = useQuery({
    queryKey: ["adminIkpDistrictsForMandals", stateId],
    queryFn: () =>
      listAdminIkpDistricts({
        page: 1,
        limit: 200,
        includeInactive: true,
        stateId: stateId || undefined,
      }),
    enabled: statesQuery.isSuccess,
  });

  const listQuery = useQuery({
    queryKey: ["adminIkpMandals", search, districtId, includeInactive],
    queryFn: () =>
      listAdminIkpMandals({
        search,
        districtId: districtId || undefined,
        includeInactive,
        page: 1,
        limit: 200,
      }),
    enabled: districtsQuery.isSuccess,
  });

  const states = statesQuery.data?.data.items ?? [];
  const districts = districtsQuery.data?.data.items ?? [];

  const districtById = React.useMemo(() => {
    const map = new Map<string, AdminIkpDistrict>();
    for (const d of districts) map.set(d.id, d);
    return map;
  }, [districts]);

  const stateById = React.useMemo(() => {
    const map = new Map<string, AdminIkpState>();
    for (const s of states) map.set(s.id, s);
    return map;
  }, [states]);

  const createMutation = useMutation({
    mutationFn: createAdminIkpMandal,
    onSuccess: (res) => {
      showToast(res.message ?? "Mandal created.", "success");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpMandals"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create mandal.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: MandalFormData }) => updateAdminIkpMandal(args.id, args.payload),
    onSuccess: (res) => {
      showToast(res.message ?? "Mandal updated.", "success");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpMandals"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update mandal.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminIkpMandal,
    onSuccess: (res) => {
      showToast(res.message ?? "Mandal deactivated.", "success");
      setDeactivateTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpMandals"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to deactivate mandal.", "error");
    },
  });

  const items = listQuery.data?.data.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>IKP Mandals</CardTitle>
            <div className="text-xs text-muted-foreground">Manage mandals under districts.</div>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!districtsQuery.isSuccess || districts.length === 0}>
            New mandal
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            <Field className="md:col-span-2">
              <FieldLabel>State</FieldLabel>
              <Select
                value={stateId}
                onValueChange={(v) => {
                  const next = v ? (v === stateId ? "" : v) : "";
                  setStateId(next);
                  setDistrictId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>District</FieldLabel>
              <Select
                value={districtId}
                onValueChange={(v) => setDistrictId(v ? (v === districtId ? "" : v) : "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="mandalSearch">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="mandalSearch"
                  placeholder="Search by mandal name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>Include inactive</FieldLabel>
              <label className="flex h-7 items-center gap-2 rounded-md border border-border px-2 text-xs">
                <Checkbox checked={includeInactive} onCheckedChange={(v) => setIncludeInactive(Boolean(v))} />
                <span>Yes</span>
              </label>
            </Field>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Mandal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statesQuery.isLoading || districtsQuery.isLoading || listQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                      Loading mandals…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                      No mandals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => {
                    const district = districtById.get(row.districtId);
                    const state = district ? stateById.get(district.stateId) : undefined;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs">
                          {state ? `${state.code} - ${state.name}` : ""}
                        </TableCell>
                        <TableCell className="text-xs">{district ? district.name : row.districtId}</TableCell>
                        <TableCell className="text-xs font-medium">{row.name}</TableCell>
                        <TableCell className="text-xs">
                          <ActiveBadge isActive={row.isActive} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon-xs">
                                <MoreHorizontalIcon className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(row)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeactivateTarget(row)} disabled={!row.isActive}>
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {(statesQuery.isError || districtsQuery.isError || listQuery.isError) && (
            <div className="text-xs text-destructive">
              {statesQuery.error instanceof Error
                ? statesQuery.error.message
                : districtsQuery.error instanceof Error
                  ? districtsQuery.error.message
                  : listQuery.error instanceof Error
                    ? listQuery.error.message
                    : "Failed to load mandals."}
            </div>
          )}
        </CardContent>
      </Card>

      <MandalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New mandal"
        description="Add a new mandal under a district."
        initialValues={{ districtId: districtId || "", name: "", isActive: true }}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
        districts={districts}
      />

      <MandalDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit mandal"
        description="Update the mandal details."
        initialValues={{
          districtId: editing?.districtId ?? "",
          name: editing?.name ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({ id: editing.id, payload: data });
        }}
        isSaving={updateMutation.isPending}
        districts={districts}
        disableDistrict
      />

      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate mandal</DialogTitle>
            <DialogDescription>This will mark the mandal inactive.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
