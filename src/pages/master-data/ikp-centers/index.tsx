import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { Checkbox } from "@/components/ui/checkbox";
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
import { BulkUploadIkpCentersDialog } from "@/components/BulkUploadIkpCentersDialog";

import { useUiStore } from "@/store";
import { useDebounce } from "@/lib/useDebounce";
import {
  createAdminIkpCenter,
  deactivateAdminIkpCenter,
  deleteAdminIkpCenterPermanently,
  listAdminIkpCenters,
  updateAdminIkpCenter,
  bulkUploadIkpCenters,
} from "@/lib/adminIkpCenters";
import type {
  AdminIkpCenter,
  UpdateAdminIkpCenterRequest,
} from "@/types/adminIkpCenters";
import {
  listAdminDistricts,
  listAdminMandals,
  listAdminStates,
  listAdminVillages,
} from "@/lib/adminLocations";
import type {
  AdminDistrict,
  AdminMandal,
  AdminState,
  AdminVillage,
} from "@/types/adminLocations";

const DEFAULT_PAGE_SIZE = 10;

import {
  IkpCenterDialog,
  type IkpCenterFormData,
} from "./IkpCenterDialog";

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
  const [bulkOpen, setBulkOpen] = React.useState(false);
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
      listAdminStates({
        page: 1,
        limit: 50,
        includeInactive: true,
      }),
  });

  const districtsForDialogQuery = useQuery({
    queryKey: ["adminIkpDistrictsForCentersDialog"],
    queryFn: () =>
      listAdminDistricts({
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
      listAdminMandals({
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
      listAdminVillages({
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
      listAdminDistricts({
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
      listAdminMandals({
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
      listAdminVillages({
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

  const bulkUploadMutation = useMutation({
    mutationFn: (args: { villageId: string; items: string }) =>
      bulkUploadIkpCenters(args.villageId, args.items),
    onSuccess: () => {
      showToast("Centers uploaded successfully.", "success");
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminIkpCenters"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to upload centers.", "error");
    }
  });

  const items = listQuery.data?.data.items ?? [];
  const total = listQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const states: AdminState[] = statesQuery.data?.data.items ?? [];
  const districtsForDialog: AdminDistrict[] =
    districtsForDialogQuery.data?.data.items ?? [];
  const mandalsForDialog: AdminMandal[] =
    mandalsForDialogQuery.data?.data.items ?? [];
  const villagesForDialog: AdminVillage[] =
    villagesForDialogQuery.data?.data.items ?? [];
  const filterDistricts: AdminDistrict[] =
    districtsQuery.data?.data.items ?? [];
  const filterMandals: AdminMandal[] = mandalsQuery.data?.data.items ?? [];
  const filterVillages: AdminVillage[] =
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
            <Button onClick={() => setCreateOpen(true)}>New center</Button>
          </div>
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
                            className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
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
        description="Add an IKP center. This will be available for millers."
        initialValues={createInitialValues}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
        states={states}
        districts={districtsForDialog}
        mandals={mandalsForDialog}
        villages={villagesForDialog}
        isStatesLoading={statesQuery.isLoading}
        isDistrictsLoading={districtsForDialogQuery.isLoading}
        isMandalsLoading={mandalsForDialogQuery.isLoading}
        isVillagesLoading={villagesForDialogQuery.isLoading}
      />

      <BulkUploadIkpCentersDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUpload={(villageId, items) => bulkUploadMutation.mutate({ villageId, items })}
        isUploading={bulkUploadMutation.isPending}
        states={states}
        districts={districtsForDialog}
        mandals={mandalsForDialog}
        villages={villagesForDialog}
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
        isStatesLoading={statesQuery.isLoading}
        isDistrictsLoading={districtsForDialogQuery.isLoading}
        isMandalsLoading={mandalsForDialogQuery.isLoading}
        isVillagesLoading={villagesForDialogQuery.isLoading}
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
