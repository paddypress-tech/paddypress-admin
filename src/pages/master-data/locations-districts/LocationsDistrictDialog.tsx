import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Field,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
    GroupedCombobox,
    type GroupedComboboxGroup,
} from "@/components/ui/grouped-combobox";

import type { AdminState } from "@/types/adminLocations";

export const districtSchema = z.object({
    stateId: z.string().min(1, "Select a state."),
    name: z.string().min(1, "Enter a district name."),
    code: z.string().optional(),
    isActive: z.boolean(),
});

export type DistrictFormData = z.infer<typeof districtSchema>;

export function LocationsDistrictDialog({
    open,
    onOpenChange,
    title,
    initialValues,
    onSave,
    isSaving,
    states,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValues: DistrictFormData;
    onSave: (data: DistrictFormData) => void;
    isSaving: boolean;
    states: AdminState[];
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isValid },
    } = useForm<DistrictFormData>({
        resolver: zodResolver(districtSchema),
        defaultValues: initialValues,
    });

    React.useEffect(() => {
        if (open) reset(initialValues);
    }, [open, initialValues, reset]);

    const stateGroups: GroupedComboboxGroup[] = React.useMemo(() => ([{
        label: "States",
        options: states.map(s => ({ value: s.id, label: s.name }))
    }]), [states]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <Field>
                        <FieldLabel>State</FieldLabel>
                        <Controller
                            control={control}
                            name="stateId"
                            render={({ field }) => (
                                <GroupedCombobox
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    groups={stateGroups}
                                    placeholder="Select state"
                                />
                            )}
                        />
                        <FieldError errors={errors.stateId ? [errors.stateId] : []} />
                    </Field>
                    <Field>
                        <FieldLabel>District Name</FieldLabel>
                        <InputGroup>
                            <InputGroupInput {...register("name")} placeholder="E.g. District Name" />
                        </InputGroup>
                        <FieldError errors={errors.name ? [errors.name] : []} />
                    </Field>
                    <Field>
                        <FieldLabel>Code (Optional)</FieldLabel>
                        <InputGroup>
                            <InputGroupInput {...register("code")} placeholder="E.g. Code" />
                        </InputGroup>
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
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving || !isValid}>{isSaving ? "Saving..." : "Save"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
