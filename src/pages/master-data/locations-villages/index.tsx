import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MoreHorizontalIcon, Loader2 } from "lucide-react";

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
  listAdminVillages,
  createAdminVillage,
  updateAdminVillage,
  deactivateAdminVillage,
  deleteAdminVillagePermanently,
  bulkUploadVillages,
  listAdminStates,
  listAdminDistricts,
  listAdminMandals,
} from "@/lib/adminLocations";
import type { AdminVillage, AdminState, AdminDistrict, AdminMandal } from "@/types/adminLocations";

const DEFAULT_PAGE_SIZE = 10;

import {
  LocationsVillageDialog,
} from "./LocationsVillageDialog";

function BulkUploadVillagesDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  states,
  districts,
  mandals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (parentId: string, items: string) => void;
  isUploading: boolean;
  states: AdminState[];
  districts: AdminDistrict[];
  mandals: AdminMandal[];
}) {
  const [stateId, setStateId] = React.useState("");
  const [districtId, setDistrictId] = React.useState("");
  const [mandalId, setMandalId] = React.useState("");
  const [items, setItems] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setStateId("");
      setDistrictId("");
      setMandalId("");
      setItems("");
    }
  }, [open]);

  const filteredDistricts = React.useMemo(() => {
    if (!stateId) return [];
    return districts.filter(d => d.stateId === stateId);
  }, [districts, stateId]);

  const filteredMandals = React.useMemo(() => {
    if (!districtId) return [];
    return mandals.filter(m => m.districtId === districtId);
  }, [mandals, districtId]);

  const stateGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "States",
    options: states.map(s => ({ value: s.id, label: s.name }))
  }]), [states]);

  const districtGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "Districts",
    options: filteredDistricts.map(d => ({ value: d.id, label: d.name }))
  }]), [filteredDistricts]);

  const mandalGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
    label: "Mandals",
    options: filteredMandals.map(m => ({ value: m.id, label: m.name }))
  }]), [filteredMandals]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload Villages</DialogTitle>
          <DialogDescription>Select mandal and enter comma separated village names.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel>State</FieldLabel>
            <GroupedCombobox
              value={stateId}
              onValueChange={(v) => { setStateId(v); setDistrictId(""); setMandalId(""); }}
              groups={stateGroups}
              placeholder="Select State"
            />
          </Field>
          <Field>
            <FieldLabel>District</FieldLabel>
            <GroupedCombobox
              value={districtId}
              onValueChange={(v) => { setDistrictId(v); setMandalId(""); }}
              groups={districtGroups}
              placeholder="Select District"
              disabled={!stateId}
            />
          </Field>
          <Field>
            <FieldLabel>Mandal</FieldLabel>
            <GroupedCombobox
              value={mandalId}
              onValueChange={setMandalId}
              groups={mandalGroups}
              placeholder="Select Mandal"
              disabled={!districtId}
            />
          </Field>
          <Field>
            <FieldLabel>Villages (comma separated)</FieldLabel>
            <Textarea
              value={items}
              onChange={e => setItems(e.target.value)}
              placeholder="Village 1, Village 2..."
              rows={5}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onUpload(mandalId, items)}
            disabled={!mandalId || !items.trim() || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline Pincode Editor Component
function PincodeCell({ village, onUpdate, disabled }: { village: AdminVillage, onUpdate: (id: string, pincode: string) => Promise<void>, disabled?: boolean }) {
  const [value, setValue] = React.useState(village.pincode || "");
  const [saving, setSaving] = React.useState(false);

  if (disabled) {
    return <span className="text-xs px-2">{value || "-"}</span>;
  }

  const handleBlur = async () => {
    if (value !== (village.pincode || "")) {
      setSaving(true);
      try {
        await onUpdate(village.id, value);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="relative">
      <InputGroupInput
        className="h-8 py-1 pr-8"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Pincode"
      />
      {saving && (
        <div className="absolute right-2 top-1.5">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function LocationsVillagesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("");
  const [districtFilter, setDistrictFilter] = React.useState("");
  const [mandalFilter, setMandalFilter] = React.useState("");


  const debouncedSearch = useDebounce(search, 300);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminVillage | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminVillage | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminVillage | null>(null);

  const statesQuery = useQuery({
    queryKey: ["adminStates"],
    queryFn: () => listAdminStates({ limit: 100 }),
  });

  const districtsQuery = useQuery({
    queryKey: ["adminDistrictsAll"],
    queryFn: () => listAdminDistricts({ limit: 2000 }),
  });

  const mandalsQuery = useQuery({
    queryKey: ["adminMandalsAll"],
    queryFn: () => listAdminMandals({ limit: 5000 }), // Heavy?
  });

  // Filter mandals by district only when fetching specifically?
  // We need to pass mandalId to listAdminVillages.

  const query = useQuery({
    queryKey: ["adminVillages", page, debouncedSearch, stateFilter, districtFilter, mandalFilter],
    queryFn: () => listAdminVillages({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: debouncedSearch,
      mandalId: mandalFilter // API only takes mandalId logic mostly.
    }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminVillage,
    onSuccess: () => {
      showToast("Village created.", "success");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateAdminVillage(data.id, data.payload),
    onSuccess: () => {
      showToast("Village updated.", "success");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  // Silent update for pincode
  const updatePincodeMutation = useMutation({
    mutationFn: (data: { id: string, pincode: string }) => updateAdminVillage(data.id, { pincode: data.pincode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: () => showToast("Failed to update pincode.", "error"),
  });


  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminVillage,
    onSuccess: () => {
      showToast("Village deactivated.", "success");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminVillagePermanently,
    onSuccess: () => {
      showToast("Village deleted.", "success");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (data: { parentId: string, items: string }) => bulkUploadVillages(data.parentId, data.items),
    onSuccess: () => {
      showToast("Villages uploaded.", "success");
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminVillages"] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Failed.", "error"),
  });

  const items = query.data?.data?.items ?? [];
  const total = query.data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const states = statesQuery.data?.data?.items ?? [];
  const districts = districtsQuery.data?.data?.items ?? [];
  const mandals = mandalsQuery.data?.data?.items ?? [];

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

  const mandalFilterGroups: GroupedComboboxGroup[] = React.useMemo(() => {
    const m = districtFilter ? mandals.filter(x => x.districtId === districtFilter) : mandals;
    return [{
      label: "Mandals",
      options: m.map(x => ({ value: x.id, label: x.name }))
    }];
  }, [mandals, districtFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Villages</CardTitle>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
                <Button onClick={() => setCreateOpen(true)}>New Village</Button>
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
                onValueChange={(v) => { setStateFilter(v); setDistrictFilter(""); setMandalFilter(""); }}
                groups={stateGroups}
                placeholder="Filter by State"
              />
            </div>
            <div className="w-[200px]">
              <GroupedCombobox
                value={districtFilter}
                onValueChange={(v) => { setDistrictFilter(v); setMandalFilter(""); }}
                groups={districtFilterGroups}
                placeholder="Filter by District"
                disabled={!stateFilter}
              />
            </div>
            <div className="w-[200px]">
              <GroupedCombobox
                value={mandalFilter}
                onValueChange={setMandalFilter}
                groups={mandalFilterGroups}
                placeholder="Filter by Mandal"
                disabled={!districtFilter}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[120px]">Pincode</TableHead>

                  <TableHead>Filters</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center">No villages found.</TableCell></TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <PincodeCell
                          village={item}
                          onUpdate={async (id, val) => { await updatePincodeMutation.mutateAsync({ id, pincode: val }) }}
                          disabled={!isAdmin}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mandals.find(m => m.id === item.mandalId)?.name} / {
                          districts.find(d => d.id === mandals.find(m => m.id === item.mandalId)?.districtId)?.name
                        }
                      </TableCell>
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

      <LocationsVillageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Village"
        initialValues={{ stateId: "", districtId: "", mandalId: "", name: "", isActive: true }}
        onSave={(data) => {
          const payload = { ...data };
          if (!payload.code) {
            // Generate a shorter unique code (max 10 chars)
            // Using a prefix 'V' and 6 chars from a random base36 string
            payload.code = `V${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }
          createMutation.mutate(payload);
        }}
        isSaving={createMutation.isPending}
        states={states}
        districts={districts}
        mandals={mandals}
      />

      {editing && (
        <LocationsVillageDialog
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit Village"
          initialValues={{
            stateId: districts.find(d => d.id === mandals.find(m => m.id === editing.mandalId)?.districtId)?.stateId || "",
            districtId: mandals.find(m => m.id === editing.mandalId)?.districtId || "",
            mandalId: editing.mandalId,
            name: editing.name,
            code: editing.code || "",
            pincode: editing.pincode || "", // Pincode included
            isActive: editing.isActive
          }}
          onSave={(data) => updateMutation.mutate({ id: editing.id, payload: data })}
          isSaving={updateMutation.isPending}
          states={states}
          districts={districts}
          mandals={mandals}
        />
      )}

      <BulkUploadVillagesDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUpload={(pid, txt) => bulkUploadMutation.mutate({ parentId: pid, items: txt })}
        isUploading={bulkUploadMutation.isPending}
        states={states}
        districts={districts}
        mandals={mandals}
      />
      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Village?</AlertDialogTitle>
            <AlertDialogDescription>This will deactivate the village.</AlertDialogDescription>
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
            <AlertDialogTitle>Delete Village?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete village?</AlertDialogDescription>
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
