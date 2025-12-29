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
  createAdminIkpDistrict,
  deactivateAdminIkpDistrict,
  listAdminIkpDistricts,
  listAdminIkpStates,
  updateAdminIkpDistrict,
} from "@/lib/adminIkpLocations";
import type { AdminIkpDistrict, AdminIkpState } from "@/types/adminIkpLocations";

const districtSchema = z.object({
  stateId: z.string().min(1, "Select a state."),
  name: z.string().min(1, "Enter a district name.").max(100, "Max 100 characters."),
  isActive: z.boolean(),
});

type DistrictFormData = z.infer<typeof districtSchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Active" : "Inactive"}</Badge>;
}

function DistrictDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: DistrictFormData;
  onSave: (data: DistrictFormData) => void;
  isSaving: boolean;
  states: AdminIkpState[];
  disableState?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<DistrictFormData>({
    resolver: zodResolver(districtSchema),
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
              <FieldLabel>State</FieldLabel>
              <Controller
                control={control}
                name="stateId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    disabled={props.disableState}
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
              <FieldLabel htmlFor="districtName">District name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="districtName" placeholder="East Godavari" {...register("name")} />
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
            <Button type="submit" disabled={props.isSaving || !isValid || (props.disableState ? !isDirty : false)}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IkpDistrictsPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [stateId, setStateId] = React.useState<string>("");
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpDistrict | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminIkpDistrict | null>(null);

  const statesQuery = useQuery({
    queryKey: ["adminIkpStatesForDistricts"],
    queryFn: () => listAdminIkpStates({ page: 1, limit: 200, includeInactive: true }),
  });

  const listQuery = useQuery({
    queryKey: ["adminIkpDistricts", search, stateId, includeInactive],
    queryFn: () =>
      listAdminIkpDistricts({
        search,
        stateId: stateId || undefined,
        includeInactive,
        page: 1,
        limit: 200,
      }),
    enabled: statesQuery.isSuccess,
  });

  const states = statesQuery.data?.data.items ?? [];
  const stateById = React.useMemo(() => {
    const map = new Map<string, AdminIkpState>();
    for (const s of states) map.set(s.id, s);
    return map;
  }, [states]);

  const createMutation = useMutation({
    mutationFn: createAdminIkpDistrict,
    onSuccess: (res) => {
      showToast(res.message ?? "District created.", "success");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpDistricts"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create district.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: DistrictFormData }) => updateAdminIkpDistrict(args.id, args.payload),
    onSuccess: (res) => {
      showToast(res.message ?? "District updated.", "success");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpDistricts"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update district.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminIkpDistrict,
    onSuccess: (res) => {
      showToast(res.message ?? "District deactivated.", "success");
      setDeactivateTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpDistricts"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to deactivate district.", "error");
    },
  });

  const items = listQuery.data?.data.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>IKP Districts</CardTitle>
            <div className="text-xs text-muted-foreground">Manage districts under AP and TG.</div>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!statesQuery.isSuccess}>
            New district
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Field className="md:col-span-2">
              <FieldLabel>State</FieldLabel>
              <Select
                value={stateId}
                onValueChange={(v) => setStateId(v ? (v === stateId ? "" : v) : "")}
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

            <Field className="md:col-span-3">
              <FieldLabel htmlFor="districtSearch">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="districtSearch"
                  placeholder="Search by district name"
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statesQuery.isLoading || listQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                      Loading districts…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                      No districts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => {
                    const state = stateById.get(row.stateId);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs">{state ? `${state.code} - ${state.name}` : row.stateId}</TableCell>
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

          {(statesQuery.isError || listQuery.isError) && (
            <div className="text-xs text-destructive">
              {statesQuery.error instanceof Error
                ? statesQuery.error.message
                : listQuery.error instanceof Error
                  ? listQuery.error.message
                  : "Failed to load districts."}
            </div>
          )}
        </CardContent>
      </Card>

      <DistrictDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New district"
        description="Add a new district under a state."
        initialValues={{ stateId: stateId || "", name: "", isActive: true }}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
        states={states}
        disableState={false}
      />

      <DistrictDialog
        open={Boolean(editing)}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
        title="Edit district"
        description="Update the district details."
        initialValues={{
          stateId: editing?.stateId ?? "",
          name: editing?.name ?? "",
          isActive: editing?.isActive ?? true,
        }}
        onSave={(data) => {
          if (!editing) return;
          updateMutation.mutate({ id: editing.id, payload: data });
        }}
        isSaving={updateMutation.isPending}
        states={states}
        disableState
      />

      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate district</DialogTitle>
            <DialogDescription>This will mark the district inactive.</DialogDescription>
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
