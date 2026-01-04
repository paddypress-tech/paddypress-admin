import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MoreHorizontalIcon } from "lucide-react";

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
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
import {
  GroupedCombobox,
  type GroupedComboboxGroup,
} from "@/components/ui/grouped-combobox";
import { Textarea } from "@/components/ui/textarea";

import { useUiStore } from "@/store";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/lib/useDebounce";
import {
  listAdminMandals,
  createAdminMandal,
  updateAdminMandal,
  deactivateAdminMandal,
  deleteAdminMandalPermanently,
  bulkUploadMandals,
  listAdminStates,
  listAdminDistricts,
} from "@/lib/adminLocations";
import type { AdminMandal, AdminState, AdminDistrict } from "@/types/adminLocations";

const DEFAULT_PAGE_SIZE = 10;

import {
  LocationsMandalDialog,
} from "./LocationsMandalDialog";

function BulkUploadMandalsDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  states,
  districts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (parentId: string, items: string) => void;
  isUploading: boolean;
  states: AdminState[];
  districts: AdminDistrict[];
}) {
  const [stateId, setStateId] = React.useState("");
  const [districtId, setDistrictId] = React.useState("");
  const [items, setItems] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setStateId("");
      setDistrictId("");
      setItems("");
    }
  }, [open]);

  const filteredDistricts = React.useMemo(() => {
    if (!stateId) return [];
    return districts.filter(d => d.stateId === stateId);
  }, [districts, stateId]);

  const stateGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "States",
    options: states.map(s => ({ value: s.id, label: s.name }))
  }]), [states]);

  const districtGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "Districts",
    options: filteredDistricts.map(d => ({ value: d.id, label: d.name }))
  }]), [filteredDistricts]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload Mandals</DialogTitle>
          <DialogDescription>Select district and enter comma separated mandal names.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel>State</FieldLabel>
            <GroupedCombobox
              value={stateId}
              onValueChange={(v) => { setStateId(v); setDistrictId(""); }}
              groups={stateGroups}
              placeholder="Select State"
            />
          </Field>
          <Field>
            <FieldLabel>District</FieldLabel>
            <GroupedCombobox
              value={districtId}
              onValueChange={setDistrictId}
              groups={districtGroups}
              placeholder="Select District"
              disabled={!stateId}
            />
          </Field>
          <Field>
            <FieldLabel>Mandals (comma separated)</FieldLabel>
            <Textarea
              value={items}
              onChange={e => setItems(e.target.value)}
              placeholder="Mandal 1, Mandal 2..."
              rows={5}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onUpload(districtId, items)}
            disabled={!districtId || !items.trim() || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LocationsMandalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("");
  const [districtFilter, setDistrictFilter] = React.useState("");

  const debouncedSearch = useDebounce(search, 300);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminMandal | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminMandal | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminMandal | null>(null);

  const statesQuery = useQuery({
    queryKey: ["adminStates"],
    queryFn: () => listAdminStates({ limit: 100 }),
  });

  const districtsQuery = useQuery({
    queryKey: ["adminDistrictsAll"], // Needed for dialog filtering
    queryFn: () => listAdminDistricts({ limit: 2000 }),
  });

  const query = useQuery({
    queryKey: ["adminMandals", page, debouncedSearch, stateFilter, districtFilter], // Note: stateFilter technically redundant if district used but API might support searching mandals by state? currently listAdminMandals only has districtId.
    // Wait, listAdminMandals DOES NOT have stateId param in definition?
    // Params: districtId.
    // So if I filter by State only, I cannot filter mandals by state unless backend supports it or I fetch all districts of state?
    // Backend `AdminLocationsService.listMandals` usually filters by districtId.
    // If I select State, I should ideally filter Districts. If no District selected, maybe show empty or all?
    // Usually cascading filters: State -> District -> Table refreshes.
    // If only State selected, can we show all mandals in that state?
    // My API `listAdminMandals` takes `districtId`. It does NOT take `stateId`.
    // So I can only filter by District.
    // So Table should probably wait for District selection or show all?
    // Showing all 5000 mandals is heavy.
    // I'll filter by District. If no District, I can show all (paginated).
    // But UI has State -> District filters.
    // So `districtFilter` is what I pass to API.
    // `stateFilter` is just helper for `districtFilter`.
    queryFn: () => listAdminMandals({ page, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch, districtId: districtFilter }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminMandal,
    onSuccess: () => {
      showToast("Mandal created.", "success");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminMandals"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateAdminMandal(data.id, data.payload),
    onSuccess: () => {
      showToast("Mandal updated.", "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["adminMandals"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminMandal,
    onSuccess: () => {
      showToast("Mandal deactivated.", "success");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminMandals"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminMandalPermanently,
    onSuccess: () => {
      showToast("Mandal deleted.", "success");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminMandals"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (data: { parentId: string, items: string }) => bulkUploadMandals(data.parentId, data.items),
    onSuccess: () => {
      showToast("Mandals uploaded.", "success");
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminMandals"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const items = query.data?.data?.items ?? [];
  const total = query.data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const states = statesQuery.data?.data?.items ?? [];
  const districts = districtsQuery.data?.data?.items ?? [];

  const stateGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "States",
    options: states.map(s => ({ value: s.id, label: s.name }))
  }]), [states]);

  const districtFilterGroups: GroupedComboboxGroup[] = React.useMemo(() => {
    const d = stateFilter ? districts.filter(x => x.stateId === stateFilter) : districts;
    return [{
      label: "Districts",
      options: d.map(x => ({ value: x.id, label: x.name }))
    }];
  }, [districts, stateFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mandals</CardTitle>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
                <Button onClick={() => setCreateOpen(true)}>New Mandal</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <InputGroup className="w-[200px]">
              <InputGroupAddon>Search</InputGroupAddon>
              <InputGroupInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
            </InputGroup>
            <div className="w-[200px]">
              <GroupedCombobox
                value={stateFilter}
                onValueChange={(v) => { setStateFilter(v); setDistrictFilter(""); }}
                groups={stateGroups}
                placeholder="Filter by State"
              />
            </div>
            <div className="w-[200px]">
              <GroupedCombobox
                value={districtFilter}
                onValueChange={setDistrictFilter}
                groups={districtFilterGroups}
                placeholder="Filter by District"
                disabled={!stateFilter}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No mandals found.</TableCell></TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.code || "-"}</TableCell>
                      <TableCell>{districts.find(d => d.id === item.districtId)?.name || "-"}</TableCell>
                      <TableCell>{districts.find(d => d.id === item.districtId)?.stateId ? states.find(s => s.id === districts.find(d => d.id === item.districtId)?.stateId)?.name : "-"}</TableCell>
                      <TableCell>{item.isActive ? "Active" : "Inactive"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon-sm"><MoreHorizontalIcon className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(item)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeactivateTarget(item)} disabled={!item.isActive}>Deactivate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(item)} className="text-destructive">Delete</DropdownMenuItem>
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
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LocationsMandalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Mandal"
        initialValues={{ stateId: "", districtId: "", name: "", isActive: true }}
        onSave={(data) => {
          const payload = { ...data };
          if (!payload.code) {
            payload.code = `M${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }
          createMutation.mutate(payload);
        }}
        isSaving={createMutation.isPending}
        states={states}
        districts={districts}
      />

      {editing && (
        <LocationsMandalDialog
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit Mandal"
          initialValues={{
            stateId: districts.find(d => d.id === editing.districtId)?.stateId || "",
            districtId: editing.districtId,
            name: editing.name,
            code: editing.code || "",
            isActive: editing.isActive
          }}
          onSave={(data) => updateMutation.mutate({ id: editing.id, payload: data })}
          isSaving={updateMutation.isPending}
          states={states}
          districts={districts}
        />
      )}

      <BulkUploadMandalsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUpload={(pid, txt) => bulkUploadMutation.mutate({ parentId: pid, items: txt })}
        isUploading={bulkUploadMutation.isPending}
        states={states}
        districts={districts}
      />
      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Mandal?</AlertDialogTitle>
            <AlertDialogDescription>This will deactivate the mandal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mandal?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete mandal?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
