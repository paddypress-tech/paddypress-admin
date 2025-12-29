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
  createAdminIkpVillage,
  deactivateAdminIkpVillage,
  listAdminIkpDistricts,
  listAdminIkpMandals,
  listAdminIkpStates,
  listAdminIkpVillages,
  updateAdminIkpVillage,
} from "@/lib/adminIkpLocations";
import type {
  AdminIkpDistrict,
  AdminIkpMandal,
  AdminIkpState,
  AdminIkpVillage,
  UpdateAdminIkpVillageRequest,
} from "@/types/adminIkpLocations";

const villageSchema = z.object({
  mandalId: z.string().min(1, "Select a mandal."),
  name: z.string().min(1, "Enter a village name.").max(100, "Max 100 characters."),
  isActive: z.boolean(),
});

type VillageFormData = z.infer<typeof villageSchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Active" : "Inactive"}</Badge>;
}

function VillageDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: VillageFormData;
  onSave: (data: VillageFormData) => void;
  isSaving: boolean;
  mandals: AdminIkpMandal[];
  disableMandal?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<VillageFormData>({
    resolver: zodResolver(villageSchema),
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
              <FieldLabel>Mandal</FieldLabel>
              <Controller
                control={control}
                name="mandalId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    disabled={props.disableMandal}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.mandals.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}{m.isActive ? "" : " (inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.mandalId ? [errors.mandalId] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="villageName">Village name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="villageName" placeholder="E.g. Katakoteswaram" {...register("name")} />
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
            <Button type="submit" disabled={props.isSaving || !isValid || (props.disableMandal ? !isDirty : false)}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IkpVillagesPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [stateId, setStateId] = React.useState<string>("");
  const [districtId, setDistrictId] = React.useState<string>("");
  const [mandalId, setMandalId] = React.useState<string>("");
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpVillage | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminIkpVillage | null>(null);

  const statesQuery = useQuery({
    queryKey: ["adminIkpStatesForVillages"],
    queryFn: () => listAdminIkpStates({ page: 1, limit: 200, includeInactive: true }),
  });

  const districtsQuery = useQuery({
    queryKey: ["adminIkpDistrictsForVillages", stateId],
    queryFn: () =>
      listAdminIkpDistricts({
        page: 1,
        limit: 300,
        includeInactive: true,
        stateId: stateId || undefined,
      }),
    enabled: Boolean(stateId && stateId.trim()) && statesQuery.isSuccess,
  });

  const mandalsQuery = useQuery({
    queryKey: ["adminIkpMandalsForVillages", districtId],
    queryFn: () =>
      listAdminIkpMandals({
        page: 1,
        limit: 500,
        includeInactive: true,
        districtId: districtId || undefined,
      }),
    enabled: Boolean(districtId && districtId.trim()) && districtsQuery.isSuccess,
  });

  const listQuery = useQuery({
    queryKey: ["adminIkpVillages", search, mandalId, includeInactive],
    queryFn: () =>
      listAdminIkpVillages({
        search,
        mandalId: mandalId || undefined,
        includeInactive,
        page: 1,
        limit: 200,
      }),
    enabled: Boolean(mandalId && mandalId.trim()) && mandalsQuery.isSuccess,
  });

  const states: AdminIkpState[] = statesQuery.data?.data.items ?? [];
  const districts: AdminIkpDistrict[] = districtsQuery.data?.data.items ?? [];
  const mandals: AdminIkpMandal[] = mandalsQuery.data?.data.items ?? [];
  const items: AdminIkpVillage[] = listQuery.data?.data.items ?? [];

  const mandalById = React.useMemo(() => {
    const map = new Map<string, AdminIkpMandal>();
    for (const m of mandals) map.set(m.id, m);
    return map;
  }, [mandals]);

  const createMutation = useMutation({
    mutationFn: createAdminIkpVillage,
    onSuccess: (res) => {
      showToast(res.message ?? "Village created.", "success");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpVillages"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create village.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: UpdateAdminIkpVillageRequest }) =>
      updateAdminIkpVillage(args.id, args.payload),
    onSuccess: (res) => {
      showToast(res.message ?? "Village updated.", "success");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpVillages"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update village.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminIkpVillage,
    onSuccess: (res) => {
      showToast(res.message ?? "Village deactivated.", "success");
      setDeactivateTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpVillages"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to deactivate village.", "error");
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>IKP Villages</CardTitle>
            <div className="text-xs text-muted-foreground">Manage villages under mandals.</div>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!mandalId}>
            New village
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="ikpVillageSearch">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="ikpVillageSearch"
                  placeholder="Search by village name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>State</FieldLabel>
              <Select
                value={stateId}
                onValueChange={(v) => {
                  setStateId(v ?? "");
                  setDistrictId("");
                  setMandalId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
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

            <Field>
              <FieldLabel>District</FieldLabel>
              <Select
                value={districtId}
                onValueChange={(v) => {
                  setDistrictId(v ?? "");
                  setMandalId("");
                }}
                disabled={!stateId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={stateId ? "Select district" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}{d.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Mandal</FieldLabel>
              <Select value={mandalId} onValueChange={(v) => setMandalId(v ?? "")} disabled={!districtId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={districtId ? "Select mandal" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  {mandals.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}{m.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeInactive} onCheckedChange={(v) => setIncludeInactive(Boolean(v))} />
              <span>Include inactive</span>
            </label>
          </Field>

          {!mandalId ? (
            <div className="text-xs text-muted-foreground">Select a mandal to view villages.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Village</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                        Loading villages…
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                        No villages found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs font-medium">{row.name}</TableCell>
                        <TableCell className="text-xs">{mandalById.get(row.mandalId)?.name ?? "—"}</TableCell>
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
                              <DropdownMenuItem
                                onClick={() => setDeactivateTarget(row)}
                                disabled={!row.isActive}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {listQuery.isError && (
            <div className="text-xs text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : "Failed to load villages."}
            </div>
          )}
        </CardContent>
      </Card>

      <VillageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New village"
        description="Add a village under the selected mandal."
        initialValues={{
          mandalId: mandalId ?? "",
          name: "",
          isActive: true,
        }}
        onSave={(data) =>
          createMutation.mutate({
            mandalId: data.mandalId,
            name: data.name,
            isActive: data.isActive,
          })
        }
        isSaving={createMutation.isPending}
        mandals={mandals}
        disableMandal={Boolean(mandalId)}
      />

      <VillageDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit village"
        description="Update village details."
        initialValues={{
          mandalId: editing?.mandalId ?? "",
          name: editing?.name ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({
            id: editing.id,
            payload: {
              name: data.name,
              isActive: data.isActive,
            },
          });
        }}
        isSaving={updateMutation.isPending}
        mandals={mandals}
        disableMandal
      />

      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate village?</DialogTitle>
            <DialogDescription>
              This will hide the village from selection. Existing centers and records will not be changed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deactivateTarget) return;
                deactivateMutation.mutate(deactivateTarget.id);
              }}
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
