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
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  createAdminIkpState,
  deactivateAdminIkpState,
  listAdminIkpStates,
  updateAdminIkpState,
} from "@/lib/adminIkpLocations";
import type { AdminIkpState } from "@/types/adminIkpLocations";

const stateSchema = z.object({
  code: z
    .string()
    .min(1, "Enter a state code.")
    .max(10, "Max 10 characters.")
    .toUpperCase(),
  name: z.string().min(1, "Enter a state name.").max(100, "Max 100 characters."),
  isActive: z.boolean(),
});

type StateFormData = z.infer<typeof stateSchema>;

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Active" : "Inactive"}</Badge>;
}

function StateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: StateFormData;
  onSave: (data: StateFormData) => void;
  isSaving: boolean;
  disableCode?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: props.initialValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    if (props.open) {
      reset(props.initialValues);
    }
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
              <FieldLabel htmlFor="stateCode">Code</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Code</InputGroupAddon>
                <InputGroupInput
                  id="stateCode"
                  placeholder="AP"
                  disabled={props.disableCode}
                  {...register("code")}
                />
              </InputGroup>
              <FieldError errors={errors.code ? [errors.code] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="stateName">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Name</InputGroupAddon>
                <InputGroupInput id="stateName" placeholder="Andhra Pradesh" {...register("name")} />
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
            <Button type="submit" disabled={props.isSaving || !isValid || (props.disableCode ? !isDirty : false)}>
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IkpStatesPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [includeInactive, setIncludeInactive] = React.useState(true);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminIkpState | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<AdminIkpState | null>(null);

  const listQuery = useQuery({
    queryKey: ["adminIkpStates", search, includeInactive],
    queryFn: () =>
      listAdminIkpStates({
        search,
        includeInactive,
        page: 1,
        limit: 200,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminIkpState,
    onSuccess: (res) => {
      showToast(res.message ?? "State created.", "success");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpStates"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create state.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: StateFormData }) => updateAdminIkpState(args.id, args.payload),
    onSuccess: (res) => {
      showToast(res.message ?? "State updated.", "success");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpStates"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to update state.", "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdminIkpState,
    onSuccess: (res) => {
      showToast(res.message ?? "State deactivated.", "success");
      setDeactivateTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["adminIkpStates"] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to deactivate state.", "error");
    },
  });

  const items = listQuery.data?.data.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>IKP States</CardTitle>
            <div className="text-xs text-muted-foreground">Only Andhra Pradesh (AP) and Telangana (TG) are supported.</div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>New state</Button>
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
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                      Loading states…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                      No states found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-medium">{row.code}</TableCell>
                      <TableCell className="text-xs">{row.name}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {listQuery.isError && (
            <div className="text-xs text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : "Failed to load states."}
            </div>
          )}
        </CardContent>
      </Card>

      <StateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New state"
        description="Add an IKP state. Only AP and TG are allowed."
        initialValues={{ code: "", name: "", isActive: true }}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
      />

      <StateDialog
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

      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (!open ? setDeactivateTarget(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate state</DialogTitle>
            <DialogDescription>
              This will mark the state inactive. Existing districts/mandals/centers will remain.
            </DialogDescription>
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
