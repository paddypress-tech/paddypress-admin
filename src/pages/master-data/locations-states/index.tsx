import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


import { Button, buttonVariants } from "@/components/ui/button";
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
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/lib/useDebounce";
import {
  createAdminState,
  deactivateAdminState,
  deleteAdminStatePermanently,
  listAdminStates,
  updateAdminState,
  bulkUploadStates,
} from "@/lib/adminLocations";
import type { AdminState } from "@/types/adminLocations";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";

const DEFAULT_PAGE_SIZE = 10;

import {
  LocationsStateDialog,
  type StateFormData,
} from "./LocationsStateDialog";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function LocationsStatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(DEFAULT_PAGE_SIZE);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const [editing, setEditing] = React.useState<AdminState | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    React.useState<AdminState | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminState | null>(null);

  const [createInitialValues, setCreateInitialValues] =
    React.useState<StateFormData>({
      code: "",
      name: "",
      isActive: true,
    });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, includeInactive]);

  const listQuery = useQuery({
    queryKey: ["adminStates", debouncedSearch, includeInactive, page, limit],
    queryFn: () =>
      listAdminStates({
        search: debouncedSearch,
        includeInactive,
        page,
        limit,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminState,
    onSuccess: (res) => {
      showToast(res.message ?? "State created.", "success");
      setCreateInitialValues({ code: "", name: "", isActive: true });
      void queryClient.invalidateQueries({ queryKey: ["adminStates"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to create state.",
        "error"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminStatePermanently,
    onSuccess: (res) => {
      showToast(res.message ?? "State deleted.", "success");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminStates"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to delete state.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: StateFormData }) =>
      updateAdminState(args.id, args.payload),
    onSuccess: (res) => {
      showToast(res.message ?? "State updated.", "success");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["adminStates"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to update state.",
        "error"
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminState,
    onSuccess: (res) => {
      showToast(res.message ?? "State deactivated.", "success");
      setDeactivateTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminStates"] });
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to deactivate state.",
        "error"
      );
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: bulkUploadStates,
    onSuccess: () => {
      showToast("States uploaded successfully.", "success");
      setBulkOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["adminStates"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to upload states.", "error");
    }
  });

  const items = listQuery.data?.data.items ?? [];
  const total = listQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>States</CardTitle>
            <div className="text-xs text-muted-foreground">
              Manage generic location states.
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
                <Button onClick={() => setCreateOpen(true)}>New state</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field className="md:col-span-3">
              <FieldLabel htmlFor="stateSearch">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="stateSearch"
                  placeholder="Search by name or code"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>Include inactive</FieldLabel>
              <label className="flex h-7 items-center gap-2 rounded-md border border-border px-2 text-xs">
                <Checkbox
                  checked={includeInactive}
                  onCheckedChange={(v) => setIncludeInactive(Boolean(v))}
                />
                <span>Yes</span>
              </label>
            </Field>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-xs text-muted-foreground"
                    >
                      Loading states…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-xs text-muted-foreground"
                    >
                      No states found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-medium">
                        {row.code}
                      </TableCell>
                      <TableCell className="text-xs">{row.name}</TableCell>
                      <TableCell className="text-xs">
                        <ActiveBadge isActive={row.isActive} />
                      </TableCell>
                      {isAdmin && (
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
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(row)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
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
                : "Failed to load states."}
            </div>
          )}
        </CardContent>
      </Card>

      <LocationsStateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New state"
        description="Add a generic location state."
        initialValues={createInitialValues}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk Upload States"
        description="Enter comma separated state names (e.g. Telangana, Andhra Pradesh). Code will be auto-generated if possible."
        onUpload={(items) => bulkUploadMutation.mutate(items)}
        isUploading={bulkUploadMutation.isPending}
      />

      <LocationsStateDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit state"
        description="Update the state details."
        initialValues={{
          code: editing?.code ?? "",
          name: editing?.name ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({ id: editing.id, payload: data });
        }}
        isSaving={updateMutation.isPending}
        disableCode
      />

      <Dialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate state</DialogTitle>
            <DialogDescription>
              This will mark the state inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                deactivateTarget &&
                deactivateMutation.mutate(deactivateTarget.id)
              }
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete state permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete the state. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
