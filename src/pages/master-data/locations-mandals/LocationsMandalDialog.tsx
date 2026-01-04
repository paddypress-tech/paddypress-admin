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

import type { AdminState, AdminDistrict } from "@/types/adminLocations";

export const mandalSchema = z.object({
    stateId: z.string().min(1, "Select a state."),
    districtId: z.string().min(1, "Select a district."),
    name: z.string().min(1, "Enter a mandal name."),
    code: z.string().optional(),
    isActive: z.boolean(),
});

export type MandalFormData = z.infer<typeof mandalSchema>;

export function LocationsMandalDialog({
    open,
    onOpenChange,
    title,
    initialValues,
    onSave,
    isSaving,
    states,
    districts,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValues: MandalFormData;
    onSave: (data: MandalFormData) => void;
    isSaving: boolean;
    states: AdminState[];
    districts: AdminDistrict[];
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        setValue,
        formState: { errors, isValid },
    } = useForm<MandalFormData>({
        resolver: zodResolver(mandalSchema),
        defaultValues: initialValues,
    });

    React.useEffect(() => {
        if (open) reset(initialValues);
    }, [open, initialValues, reset]);

    const selectedStateId = watch("stateId");

    const filteredDistricts = React.useMemo(() => {
        if (!selectedStateId) return [];
        return districts.filter(d => d.stateId === selectedStateId);
    }, [districts, selectedStateId]);

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
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        setValue("districtId", "");
                                    }}
                                    groups={stateGroups}
                                    placeholder="Select state"
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
                                    onValueChange={field.onChange}
                                    groups={districtGroups}
                                    placeholder="Select district"
                                    disabled={!selectedStateId}
                                />
                            )}
                        />
                        <FieldError errors={errors.districtId ? [errors.districtId] : []} />
                    </Field>

                    <Field>
                        <FieldLabel>Mandal Name</FieldLabel>
                        <InputGroup>
                            <InputGroupInput {...register("name")} placeholder="E.g. Mandal Name" />
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
