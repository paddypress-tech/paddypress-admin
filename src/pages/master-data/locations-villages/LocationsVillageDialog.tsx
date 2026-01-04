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

import type { AdminState, AdminDistrict, AdminMandal } from "@/types/adminLocations";

export const villageSchema = z.object({
    stateId: z.string().min(1, "Select a state."),
    districtId: z.string().min(1, "Select a district."),
    mandalId: z.string().min(1, "Select a mandal."),
    name: z.string().min(1, "Enter a village name."),
    code: z.string().optional(),
    pincode: z.string().optional(),
    isActive: z.boolean(),
});

export type VillageFormData = z.infer<typeof villageSchema>;

export function LocationsVillageDialog({
    open,
    onOpenChange,
    title,
    initialValues,
    onSave,
    isSaving,
    states,
    districts,
    mandals,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    initialValues: VillageFormData;
    onSave: (data: VillageFormData) => void;
    isSaving: boolean;
    states: AdminState[];
    districts: AdminDistrict[];
    mandals: AdminMandal[];
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        setValue,
        formState: { errors, isValid },
    } = useForm<VillageFormData>({
        resolver: zodResolver(villageSchema),
        defaultValues: initialValues,
    });

    React.useEffect(() => {
        if (open) reset(initialValues);
    }, [open, initialValues, reset]);

    const selectedStateId = watch("stateId");
    const selectedDistrictId = watch("districtId");

    const filteredDistricts = React.useMemo(() => {
        if (!selectedStateId) return [];
        return districts.filter(d => d.stateId === selectedStateId);
    }, [districts, selectedStateId]);

    const filteredMandals = React.useMemo(() => {
        if (!selectedDistrictId) return [];
        return mandals.filter(m => m.districtId === selectedDistrictId);
    }, [mandals, selectedDistrictId]);

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
                                        setValue("mandalId", "");
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
                                    onValueChange={(v) => { field.onChange(v); setValue("mandalId", ""); }}
                                    groups={districtGroups}
                                    placeholder="Select district"
                                    disabled={!selectedStateId}
                                />
                            )}
                        />
                        <FieldError errors={errors.districtId ? [errors.districtId] : []} />
                    </Field>

                    <Field>
                        <FieldLabel>Mandal</FieldLabel>
                        <Controller
                            control={control}
                            name="mandalId"
                            render={({ field }) => (
                                <GroupedCombobox
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    groups={mandalGroups}
                                    placeholder="Select mandal"
                                    disabled={!selectedDistrictId}
                                />
                            )}
                        />
                        <FieldError errors={errors.mandalId ? [errors.mandalId] : []} />
                    </Field>

                    <Field>
                        <FieldLabel>Village Name</FieldLabel>
                        <InputGroup>
                            <InputGroupInput {...register("name")} placeholder="E.g. Village Name" />
                        </InputGroup>
                        <FieldError errors={errors.name ? [errors.name] : []} />
                    </Field>
                    <Field>
                        <FieldLabel>Pincode</FieldLabel>
                        <InputGroup>
                            <InputGroupInput {...register("pincode")} placeholder="E.g. 500001" />
                        </InputGroup>
                        <FieldError errors={errors.pincode ? [errors.pincode] : []} />
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
