import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  createAdminIkpCenter,
  deactivateAdminIkpCenter,
  listAdminIkpCenters,
  updateAdminIkpCenter,
} from "@/lib/adminIkpCenters";
import type { AdminIkpCenter, UpdateAdminIkpCenterRequest } from "@/types/adminIkpCenters";
import {
  listAdminIkpDistricts,
  listAdminIkpMandals,
  listAdminIkpStates,
  listAdminIkpVillages,
} from "@/lib/adminIkpLocations";
import type { AdminIkpDistrict, AdminIkpMandal, AdminIkpState, AdminIkpVillage } from "@/types/adminIkpLocations";

const DEFAULT_PAGE_SIZE = 50;

const ikpCenterSchema = z.object({
  stateId: z.string().min(1, "Select a state."),
  districtId: z.string().min(1, "Select a district."),
  mandalId: z.string().min(1, "Select a mandal."),
  villageId: z.string().min(1, "Select a village."),
  name: z.string().min(1, "Enter an IKP center name."),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type IkpCenterFormData = z.infer<typeof ikpCenterSchema>;

function IkpCenterDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: IkpCenterFormData;
  onSave: (data: IkpCenterFormData) => void;
  isSaving: boolean;
  states: AdminIkpState[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<IkpCenterFormData>({
    resolver: zodResolver(ikpCenterSchema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    if (props.open) {
      reset(props.initialValues);
      prevStateIdRef.current = props.initialValues.stateId;
      prevDistrictIdRef.current = props.initialValues.districtId;
    }
  }, [props.open, props.initialValues, reset]);

  const stateIdValue = watch("stateId");
  const districtIdValue = watch("districtId");
  const mandalIdValue = watch("mandalId");

  const prevStateIdRef = React.useRef<string | undefined>(undefined);
  const prevDistrictIdRef = React.useRef<string | undefined>(undefined);
  const prevMandalIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!props.open) return;

    const prev = prevStateIdRef.current;
    if (prev !== undefined && prev !== stateIdValue) {
      setValue("districtId", "", { shouldValidate: true, shouldDirty: true });
      setValue("mandalId", "", { shouldValidate: true, shouldDirty: true });
      setValue("villageId", "", { shouldValidate: true, shouldDirty: true });
    }
    prevStateIdRef.current = stateIdValue;
  }, [props.open, setValue, stateIdValue]);

  React.useEffect(() => {
    if (!props.open) return;

    const prev = prevDistrictIdRef.current;
    if (prev !== undefined && prev !== districtIdValue) {
      setValue("mandalId", "", { shouldValidate: true, shouldDirty: true });
      setValue("villageId", "", { shouldValidate: true, shouldDirty: true });
    }
    prevDistrictIdRef.current = districtIdValue;
  }, [props.open, setValue, districtIdValue]);

  React.useEffect(() => {
    if (!props.open) return;

    const prev = prevMandalIdRef.current;
    if (prev !== undefined && prev !== mandalIdValue) {
      setValue("villageId", "", { shouldValidate: true, shouldDirty: true });
    }
    prevMandalIdRef.current = mandalIdValue;
  }, [props.open, setValue, mandalIdValue]);

  const districtsQuery = useQuery({
    enabled: Boolean(stateIdValue && stateIdValue.trim()),
    queryKey: ["ikpCenterDistrictsDialog", stateIdValue],
    queryFn: () =>
      listAdminIkpDistricts({
        page: 1,
        limit: 300,
        stateId: stateIdValue.trim(),
        includeInactive: true,
      }),
  });

  const villagesQuery = useQuery({
    enabled: Boolean(mandalIdValue && mandalIdValue.trim()),
    queryKey: ["ikpCenterVillagesDialog", mandalIdValue],
    queryFn: () =>
      listAdminIkpVillages({
        page: 1,
        limit: 800,
        mandalId: mandalIdValue.trim(),
        includeInactive: true,
      }),
  });

  const mandalsQuery = useQuery({
    enabled: Boolean(districtIdValue && districtIdValue.trim()),
    queryKey: ["ikpCenterMandalsDialog", districtIdValue],
    queryFn: () =>
      listAdminIkpMandals({
        page: 1,
        limit: 500,
        districtId: districtIdValue.trim(),
        includeInactive: true,
      }),
  });

  const districtOptions: AdminIkpDistrict[] = districtsQuery.data?.data.items ?? [];
  const mandalOptions: AdminIkpMandal[] = mandalsQuery.data?.data.items ?? [];
  const villageOptions: AdminIkpVillage[] = villagesQuery.data?.data.items ?? [];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>State</FieldLabel>
                <Controller
                  control={control}
                  name="stateId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {props.states.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} - {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.stateId ? [errors.stateId] : []} />
              </Field>

              <Field>
                <FieldLabel>District</FieldLabel>
                <Controller
                  control={control}
                  name="districtId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "")}
                      disabled={!stateIdValue}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={stateIdValue ? "Select district" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}{d.isActive ? "" : " (inactive)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.districtId ? [errors.districtId] : []} />
              </Field>

              <Field>
                <FieldLabel>Mandal</FieldLabel>
                <Controller
                  control={control}
                  name="mandalId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "")}
                      disabled={!districtIdValue}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={districtIdValue ? "Select mandal" : "Select district first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {mandalOptions.map((m) => (
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
                <FieldLabel>Village</FieldLabel>
                <Controller
                  control={control}
                  name="villageId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "")}
                      disabled={!mandalIdValue}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={mandalIdValue ? "Select village" : "Select mandal first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {villageOptions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}{v.isActive ? "" : " (inactive)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.villageId ? [errors.villageId] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="ikpName">IKP center name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>Name</InputGroupAddon>
                  <InputGroupInput
                    id="ikpName"
                    placeholder="E.g. Katakoteswaram IKP Center"
                    {...register("name")}
                  />
                </InputGroup>
                <FieldError errors={errors.name ? [errors.name] : []} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="ikpNotes">Notes</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="block-start">Notes</InputGroupAddon>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={(next) => field.onChange(next)}
                      placeholder="Add employee names and phone numbers for reference."
                    />
                  )}
                />
              </InputGroup>
              <FieldError errors={errors.notes ? [errors.notes] : []} />
            </Field>

            <Field>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
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
            <Button
              type="submit"
              disabled={props.isSaving || !isValid || (props.title.startsWith("Edit") ? !isDirty : false)}
            >
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}

export default function IkpCentersPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [filters, setFilters] = React.useState({
    search: "",
    stateId: "",
    districtId: "",
    mandalId: "",
    villageId: "",
    includeInactive: true,
  });

  const [page] = React.useState(1);
  const [limit] = React.useState(DEFAULT_PAGE_SIZE);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpCenter | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminIkpCenter | null>(null);

  const listQuery = useQuery({
    queryKey: ["adminIkpCenters", page, limit, filters],
    queryFn: () =>
      listAdminIkpCenters({
        page,
        limit,
        search: filters.search,
        stateId: filters.stateId,
        districtId: filters.districtId,
        mandalId: filters.mandalId,
        villageId: filters.villageId,
        includeInactive: filters.includeInactive,
      }),
  });

  const statesQuery = useQuery({
    queryKey: ["adminIkpStatesForCenters"],
    queryFn: () =>
      listAdminIkpStates({
        page: 1,
        limit: 50,
        includeInactive: true,
      }),
  });

  const districtsQuery = useQuery({
    enabled: Boolean(filters.stateId && filters.stateId.trim()),
    queryKey: ["adminIkpDistrictsForCenters", filters.stateId],
    queryFn: () =>
      listAdminIkpDistricts({
        page: 1,
        limit: 300,
        stateId: filters.stateId,
        includeInactive: true,
      }),
  });

  const mandalsQuery = useQuery({
    enabled: Boolean(filters.districtId && filters.districtId.trim()),
    queryKey: ["adminIkpMandalsForCenters", filters.districtId],
    queryFn: () =>
      listAdminIkpMandals({
        page: 1,
        limit: 500,
        districtId: filters.districtId,
        includeInactive: true,
      }),
  });

  const villagesQuery = useQuery({
    enabled: Boolean(filters.mandalId && filters.mandalId.trim()),
    queryKey: ["adminIkpVillagesForCenters", filters.mandalId],
    queryFn: () =>
      listAdminIkpVillages({
        page: 1,
        limit: 800,
        mandalId: filters.mandalId,
        includeInactive: true,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminIkpCenter,
    onSuccess: () => {
      showToast("IKP center created.", "success");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create IKP center.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: UpdateAdminIkpCenterRequest }) =>
      updateAdminIkpCenter(args.id, args.payload),
    onSuccess: () => {
      showToast("IKP center updated.", "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update IKP center.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminIkpCenter(id),
    onSuccess: () => {
      showToast("IKP center deactivated.", "success");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to deactivate IKP center.", "error");
    },
  });

  const items = listQuery.data?.data.items ?? [];
  const states: AdminIkpState[] = statesQuery.data?.data.items ?? [];
  const filterDistricts: AdminIkpDistrict[] = districtsQuery.data?.data.items ?? [];
  const filterMandals: AdminIkpMandal[] = mandalsQuery.data?.data.items ?? [];
  const filterVillages: AdminIkpVillage[] = villagesQuery.data?.data.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>IKP Centers</CardTitle>
            <div className="text-xs text-muted-foreground">
              Manage master IKP centers. Millers can search and select these while recording procurements.
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>New IKP center</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="ikpSearch">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="ikpSearch"
                  placeholder="Search by name, village, mandal…"
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>State</FieldLabel>
              <Select
                value={filters.stateId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    stateId: v ?? "",
                    districtId: "",
                    mandalId: "",
                    villageId: "",
                  }))
                }
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

            <Field>
              <FieldLabel>District</FieldLabel>
              <Select
                value={filters.districtId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    districtId: v ?? "",
                    mandalId: "",
                    villageId: "",
                  }))
                }
                disabled={!filters.stateId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={filters.stateId ? "All districts" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {filterDistricts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}{d.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Mandal</FieldLabel>
              <Select
                value={filters.mandalId}
                onValueChange={(v) => setFilters((p) => ({ ...p, mandalId: v ?? "", villageId: "" }))}
                disabled={!filters.districtId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={filters.districtId ? "All mandals" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  {filterMandals.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}{m.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Village</FieldLabel>
              <Select
                value={filters.villageId}
                onValueChange={(v) => setFilters((p) => ({ ...p, villageId: v ?? "" }))}
                disabled={!filters.mandalId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={filters.mandalId ? "All villages" : "Select mandal first"} />
                </SelectTrigger>
                <SelectContent>
                  {filterVillages.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}{v.isActive ? "" : " (inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.includeInactive}
                onCheckedChange={(v) => setFilters((p) => ({ ...p, includeInactive: Boolean(v) }))}
              />
              <span>Include inactive</span>
            </label>
          </Field>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Mandal</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                      Loading IKP centers…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                      No IKP centers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">{row.state}</TableCell>
                      <TableCell className="text-xs">{row.district}</TableCell>
                      <TableCell className="text-xs">{row.mandal}</TableCell>
                      <TableCell className="text-xs">{row.village}</TableCell>
                      <TableCell className="text-xs font-medium">{row.name}</TableCell>
                      <TableCell className="text-xs">{row.isActive ? "Active" : "Inactive"}</TableCell>
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

          {listQuery.isError && (
            <div className="text-xs text-destructive">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : "Failed to load IKP centers."}
            </div>
          )}
        </CardContent>
      </Card>

      <IkpCenterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New IKP center"
        description="Add a new IKP center that millers can select."
        initialValues={{
          stateId: "",
          districtId: "",
          mandalId: "",
          villageId: "",
          name: "",
          notes: "",
          isActive: true,
        }}
        onSave={(data) =>
          createMutation.mutate({
            villageId: data.villageId,
            name: data.name,
            notes: data.notes,
            isActive: data.isActive,
          })
        }
        isSaving={createMutation.isPending}
        states={states}
      />

      <IkpCenterDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit IKP center"
        description="Update IKP center details."
        initialValues={{
          stateId: editing?.stateId ?? "",
          districtId: editing?.districtId ?? "",
          mandalId: editing?.mandalId ?? "",
          villageId: editing?.villageId ?? "",
          name: editing?.name ?? "",
          notes: editing?.notes ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({
            id: editing.id,
            payload: {
              villageId: data.villageId,
              name: data.name,
              notes: data.notes,
              isActive: data.isActive,
            },
          });
        }}
        isSaving={updateMutation.isPending}
        states={states}
      />

      <AlertDialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate IKP center?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the center from miller selection. Existing records will not be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deactivateTarget) return;
                deactivateMutation.mutate(deactivateTarget.id);
              }}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
