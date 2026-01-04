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
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import { useUiStore } from "@/store";
import {
  listMasterRiceTypes,
  upsertMasterRiceType,
} from "@/lib/masterRiceTypes";
import type { MasterRiceType } from "@/types/masterRiceTypes";

import {
  CreateRiceTypeDialog,
  EditRiceTypeDialog,
  type RiceTypeFormData,
} from "./RiceTypeDialog";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function RiceTypesPage() {
  const { showToast } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<MasterRiceType | null>(null);

  const riceTypesQuery = useQuery({
    queryKey: ["masterRiceTypes", search, includeInactive],
    queryFn: () => listMasterRiceTypes({ search, includeInactive }),
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: RiceTypeFormData) => {
      return upsertMasterRiceType(data.code, {
        name: data.name,
        isActive: data.isActive,
      });
    },
    onSuccess: (res) => {
      showToast(res.message ?? "Rice type saved.", "success");
      void queryClient.invalidateQueries({ queryKey: ["masterRiceTypes"] });
      setCreateOpen(false);
      setEditItem(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Save failed.";
      showToast(message, "error");
    },
  });

  const items = riceTypesQuery.data?.data.items ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Rice Types</CardTitle>
            <div className="text-sm text-muted-foreground">
              Maintain the master list of rice types (example: Common, Grade A).
            </div>
          </div>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="max-w-sm flex-1">
            <Field>
              <FieldLabel htmlFor="search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Search</InputGroupAddon>
                <InputGroupInput
                  id="search"
                  placeholder="Type a code or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Field>
          </div>
          <div className="flex items-center pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeInactive}
                onCheckedChange={(v) => setIncludeInactive(Boolean(v))}
              />
              <span>Show inactive</span>
            </label>
          </div>
        </div>

        {riceTypesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : riceTypesQuery.isError ? (
          <div className="text-sm text-destructive">Failed to load rice types.</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No rice types found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    <ActiveBadge isActive={t.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Open actions"
                        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditItem(t)}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CreateRiceTypeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSaving={upsertMutation.isPending}
        onSave={(data) => upsertMutation.mutate(data)}
      />

      <EditRiceTypeDialog
        item={editItem}
        onClose={() => setEditItem(null)}
        isSaving={upsertMutation.isPending}
        onSave={(data) => upsertMutation.mutate(data)}
      />
    </Card>
  );
}
