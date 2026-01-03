import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
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

import {
  GroupedCombobox,
  type GroupedComboboxGroup,
} from "@/components/ui/grouped-combobox";


import { useUiStore } from "@/store";
import { useDebounce } from "@/lib/useDebounce";
import {
  createAdminIkpCenter,
  deactivateAdminIkpCenter,
  deleteAdminIkpCenterPermanently,
  listAdminIkpCenters,
  updateAdminIkpCenter,
} from "@/lib/adminIkpCenters";
import type {
  AdminIkpCenter,
  UpdateAdminIkpCenterRequest,
} from "@/types/adminIkpCenters";
import {
  listAdminIkpDistricts,
  listAdminIkpMandals,
  listAdminIkpStates,
  listAdminIkpVillages,
} from "@/lib/adminIkpLocations";
import type {
  AdminIkpDistrict,
  AdminIkpMandal,
  AdminIkpState,
  AdminIkpVillage,
} from "@/types/adminIkpLocations";

const DEFAULT_PAGE_SIZE = 10;

const ikpCenterSchema = z.object({
  stateId: z.string().min(1, "Select a state."),
  districtId: z.string().min(1, "Select a district."),
  mandalId: z.string().min(1, "Select a mandal."),
  villageId: z.string().min(1, "Select a village."),
  name: z.string().min(1, "Enter a center name."),
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
  districts: AdminIkpDistrict[];
  mandals: AdminIkpMandal[];
  villages: AdminIkpVillage[];
  isStatesLoading: boolean;
  isDistrictsLoading: boolean;
  isMandalsLoading: boolean;
  isVillagesLoading: boolean;
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

  const selectedStateId = watch("stateId");
  const selectedDistrictId = watch("districtId");
  const selectedMandalId = watch("mandalId");

  // Filter districts, mandals, and villages based on selected values
  const filteredDistricts = React.useMemo(() => {
    if (!selectedStateId) return [];
    return props.districts.filter((d) => d.stateId === selectedStateId);
  }, [props.districts, selectedStateId]);

  const filteredMandals = React.useMemo(() => {
    if (!selectedDistrictId) return [];
    return props.mandals.filter((m) => m.districtId === selectedDistrictId);
  }, [props.mandals, selectedDistrictId]);

  const filteredVillages = React.useMemo(() => {
    if (!selectedMandalId) return [];
    return props.villages.filter((v) => v.mandalId === selectedMandalId);
  }, [props.villages, selectedMandalId]);

  const stateOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "States",
        options: props.states.map((s) => ({
          value: s.id,
          label: `${s.code} - ${s.name}`,
        })),
      },
    ];
  }, [props.states]);

  const districtOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Districts",
        options: filteredDistricts.map((d) => ({
          value: d.id,
          label: d.name,
        })),
      },
    ];
  }, [filteredDistricts]);

  const mandalOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Mandals",
        options: filteredMandals.map((m) => ({
          value: m.id,
          label: m.name,
        })),
      },
    ];
  }, [filteredMandals]);

  const villageOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Villages",
        options: filteredVillages.map((v) => ({
          value: v.id,
          label: v.name,
        })),
      },
    ];
  }, [filteredVillages]);

  React.useEffect(() => {
    if (props.open) reset(props.initialValues);
  }, [props.open, props.initialValues, reset]);

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
                    <GroupedCombobox
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("districtId", "");
                        setValue("mandalId", "");
                        setValue("villageId", "");
                      }}
                      groups={stateOptionGroups}
                      disabled={props.isStatesLoading}
                      placeholder="Select state"
                      emptyText="No states found."
                    />
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
                    <GroupedCombobox
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("mandalId", "");
                        setValue("villageId", "");
                      }}
                      groups={districtOptionGroups}
                      disabled={!selectedStateId || props.isDistrictsLoading}
                      placeholder={
                        selectedStateId ? "Select district" : "Select state first"
                      }
                      emptyText={
                        selectedStateId
                          ? "No districts found."
                          : "Select a state first."
                      }
                    />
                  )}
                />
                <FieldError
                  errors={errors.districtId ? [errors.districtId] : []}
                />
              </Field>

              <Field>
                <FieldLabel>Mandal</FieldLabel>
                <Controller
                  control={control}
                  name="mandalId"
                  render={({ field }) => (
                    <GroupedCombobox
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("villageId", "");
                      }}
                      groups={mandalOptionGroups}
                      disabled={!selectedDistrictId || props.isMandalsLoading}
                      placeholder={
                        selectedDistrictId ? "Select mandal" : "Select district first"
                      }
                      emptyText={
                        selectedDistrictId
                          ? "No mandals found."
                          : "Select a district first."
                      }
                    />
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
                    <GroupedCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      groups={villageOptionGroups}
                      disabled={!selectedMandalId || props.isVillagesLoading}
                      placeholder={
                        selectedMandalId ? "Select village" : "Select mandal first"
                      }
                      emptyText={
                        selectedMandalId
                          ? "No villages found."
                          : "Select a mandal first."
                      }
                    />
                  )}
                />
                <FieldError
                  errors={errors.villageId ? [errors.villageId] : []}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ikpName">Center name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>Name</InputGroupAddon>
                  <InputGroupInput
                    id="ikpName"
                    placeholder="E.g. Katakoteswaram Center"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                props.isSaving ||
                !isValid ||
                (props.title.startsWith("Edit") ? !isDirty : false)
              }
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

  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filters, setFilters] = React.useState({
    search: "",
    stateId: "",
    districtId: "",
    mandalId: "",
    villageId: "",
    includeInactive: true,
  });

  React.useEffect(() => {
    setFilters((p) => ({ ...p, search: debouncedSearch }));
  }, [debouncedSearch]);

  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(DEFAULT_PAGE_SIZE);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpCenter | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    React.useState<AdminIkpCenter | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminIkpCenter | null>(null);

  const [createInitialValues, setCreateInitialValues] =
    React.useState<IkpCenterFormData>({
      stateId: "",
      districtId: "",
      mandalId: "",
      villageId: "",
      name: "",
      notes: "",
      isActive: true,
    });

  const lastCreateValuesRef = React.useRef<IkpCenterFormData | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const dialogOpen = createOpen || Boolean(editing);

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

  const districtsForDialogQuery = useQuery({
    queryKey: ["adminIkpDistrictsForCentersDialog"],
    queryFn: () =>
      listAdminIkpDistricts({
        page: 1,
        limit: 2000,
        includeInactive: true,
      }),
    enabled: dialogOpen && statesQuery.isSuccess,
    staleTime: 5 * 60 * 1000,
  });

  const mandalsForDialogQuery = useQuery({
    queryKey: ["adminIkpMandalsForCentersDialog"],
    queryFn: () =>
      listAdminIkpMandals({
        page: 1,
        limit: 5000,
        includeInactive: true,
      }),
    enabled: dialogOpen && statesQuery.isSuccess,
    staleTime: 5 * 60 * 1000,
  });

  const villagesForDialogQuery = useQuery({
    queryKey: ["adminIkpVillagesForCentersDialog"],
    queryFn: () =>
      listAdminIkpVillages({
        page: 1,
        limit: 10000,
        includeInactive: true,
      }),
    enabled: dialogOpen && statesQuery.isSuccess,
    staleTime: 5 * 60 * 1000,
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
      showToast("Center created.", "success");
      setCreateInitialValues((p) => {
        const last = lastCreateValuesRef.current;
        return {
          ...p,
          stateId: last?.stateId ?? p.stateId,
          districtId: last?.districtId ?? p.districtId,
          mandalId: last?.mandalId ?? p.mandalId,
          villageId: last?.villageId ?? p.villageId,
          name: "",
          notes: "",
          isActive: last?.isActive ?? p.isActive,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to create center.",
        "error"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminIkpCenterPermanently(id),
    onSuccess: () => {
      showToast("Center deleted.", "success");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to delete center.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: UpdateAdminIkpCenterRequest }) =>
      updateAdminIkpCenter(args.id, args.payload),
    onSuccess: () => {
      showToast("Center updated.", "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to update center.",
        "error"
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminIkpCenter(id),
    onSuccess: () => {
      showToast("Center deactivated.", "success");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
      queryClient.invalidateQueries({ queryKey: ["adminIkpStatesForCenters"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to deactivate center.",
        "error"
      );
    },
  });

  const items = listQuery.data?.data.items ?? [];
  const total = listQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const states: AdminIkpState[] = statesQuery.data?.data.items ?? [];
  const districtsForDialog: AdminIkpDistrict[] =
    districtsForDialogQuery.data?.data.items ?? [];
  const mandalsForDialog: AdminIkpMandal[] =
    mandalsForDialogQuery.data?.data.items ?? [];
  const villagesForDialog: AdminIkpVillage[] =
    villagesForDialogQuery.data?.data.items ?? [];
  const filterDistricts: AdminIkpDistrict[] =
    districtsQuery.data?.data.items ?? [];
  const filterMandals: AdminIkpMandal[] = mandalsQuery.data?.data.items ?? [];
  const filterVillages: AdminIkpVillage[] =
    villagesQuery.data?.data.items ?? [];

  const stateFilterGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "States",
        options: states.map((s) => ({
          value: s.id,
          label: `${s.code} - ${s.name}${s.isActive ? "" : " (inactive)"}`,
        })),
      },
    ];
  }, [states]);

  const districtFilterGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Districts",
        options: filterDistricts.map((d) => ({
          value: d.id,
          label: `${d.name}${d.isActive ? "" : " (inactive)"}`,
        })),
      },
    ];
  }, [filterDistricts]);

  const mandalFilterGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Mandals",
        options: filterMandals.map((m) => ({
          value: m.id,
          label: `${m.name}${m.isActive ? "" : " (inactive)"}`,
        })),
      },
    ];
  }, [filterMandals]);

  const villageFilterGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
    return [
      {
        label: "Villages",
        options: filterVillages.map((v) => ({
          value: v.id,
          label: `${v.name}${v.isActive ? "" : " (inactive)"}`,
        })),
      },
    ];
  }, [filterVillages]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Centers</CardTitle>
            <div className="text-xs text-muted-foreground">
              Manage master centers. Millers can search and select these while
              recording procurements.
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>New center</Button>
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>State</FieldLabel>
              <GroupedCombobox
                value={filters.stateId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    stateId: v ? (v === p.stateId ? "" : v) : "",
                    districtId: "",
                    mandalId: "",
                    villageId: "",
                  }))
                }
                groups={stateFilterGroups}
                placeholder="All states"
                emptyText="No states found."
              />
            </Field>

            <Field>
              <FieldLabel>District</FieldLabel>
              <GroupedCombobox
                value={filters.districtId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    districtId: v ? (v === p.districtId ? "" : v) : "",
                    mandalId: "",
                    villageId: "",
                  }))
                }
                groups={districtFilterGroups}
                placeholder={filters.stateId ? "All districts" : "Select state first"}
                emptyText={filters.stateId ? "No districts found." : "Select a state first."}
                disabled={!filters.stateId}
              />
            </Field>

            <Field>
              <FieldLabel>Mandal</FieldLabel>
              <GroupedCombobox
                value={filters.mandalId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    mandalId: v ? (v === p.mandalId ? "" : v) : "",
                    villageId: "",
                  }))
                }
                groups={mandalFilterGroups}
                placeholder={filters.districtId ? "All mandals" : "Select district first"}
                emptyText={filters.districtId ? "No mandals found." : "Select a district first."}
                disabled={!filters.districtId}
              />
            </Field>

            <Field>
              <FieldLabel>Village</FieldLabel>
              <GroupedCombobox
                value={filters.villageId}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    villageId: v ? (v === p.villageId ? "" : v) : "",
                  }))
                }
                groups={villageFilterGroups}
                placeholder={filters.mandalId ? "All villages" : "Select mandal first"}
                emptyText={filters.mandalId ? "No villages found." : "Select a mandal first."}
                disabled={!filters.mandalId}
              />
            </Field>
          </div>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.includeInactive}
                onCheckedChange={(v) =>
                  setFilters((p) => ({ ...p, includeInactive: Boolean(v) }))
                }
              />
              <span>Include inactive</span>
            </label>
          </Field>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Center</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-xs text-muted-foreground"
                    >
                      Loading centers…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-xs text-muted-foreground"
                    >
                      No centers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">
                        <div className="space-y-0.5">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {row.state} / {row.district} / {row.mandal} / {row.village}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{row.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Open actions"
                            className={buttonVariants({ size: "icon-xs", variant: "ghost" })}
                          >
                            <MoreHorizontalIcon className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(row)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeactivateTarget(row)}
                              disabled={!row.isActive}
                            >
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(row)}>
                              Delete
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

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={listQuery.isLoading || page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={listQuery.isLoading || page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {listQuery.isError && (
            <div className="text-xs text-destructive">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : "Failed to load centers."}
            </div>
          )}
        </CardContent>
      </Card>

      <IkpCenterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New center"
        description="Add a new center that millers can select."
        initialValues={createInitialValues}
        onSave={(data) => {
          lastCreateValuesRef.current = data;
          createMutation.mutate({
            villageId: data.villageId,
            name: data.name,
            notes: data.notes,
            isActive: data.isActive,
          });
        }}
        isSaving={createMutation.isPending}
        states={states}
        districts={districtsForDialog}
        mandals={mandalsForDialog}
        villages={villagesForDialog}
        isStatesLoading={statesQuery.isFetching}
        isDistrictsLoading={districtsForDialogQuery.isFetching}
        isMandalsLoading={mandalsForDialogQuery.isFetching}
        isVillagesLoading={villagesForDialogQuery.isFetching}
      />

      <IkpCenterDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        title="Edit center"
        description="Update center details."
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
        districts={districtsForDialog}
        mandals={mandalsForDialog}
        villages={villagesForDialog}
        isStatesLoading={statesQuery.isFetching}
        isDistrictsLoading={districtsForDialogQuery.isFetching}
        isMandalsLoading={mandalsForDialogQuery.isFetching}
        isVillagesLoading={villagesForDialogQuery.isFetching}
      />

      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate center?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the center from miller selection. Existing records
              will not be changed.
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete center permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the center. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
