import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import {
    GroupedCombobox,
    type GroupedComboboxGroup,
} from "@/components/ui/grouped-combobox";

import type {
    AdminDistrict,
    AdminMandal,
    AdminState,
    AdminVillage,
} from "@/types/adminLocations";

export const ikpCenterSchema = z.object({
    stateId: z.string().min(1, "Select a state."),
    districtId: z.string().min(1, "Select a district."),
    mandalId: z.string().min(1, "Select a mandal."),
    villageId: z.string().min(1, "Select a village."),
    name: z.string().min(1, "Enter a center name."),
    notes: z.string().optional(),
    isActive: z.boolean(),
});

export type IkpCenterFormData = z.infer<typeof ikpCenterSchema>;

export function IkpCenterDialog(props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    initialValues: IkpCenterFormData;
    onSave: (data: IkpCenterFormData) => void;
    isSaving: boolean;
    states: AdminState[];
    districts: AdminDistrict[];
    mandals: AdminMandal[];
    villages: AdminVillage[];
    isStatesLoading: boolean;
    isDistrictsLoading: boolean;
    isMandalsLoading: boolean;
    isVillagesLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { errors, isValid, isDirty },
    } = useForm<IkpCenterFormData>({
        resolver: zodResolver(ikpCenterSchema),
        defaultValues: props.initialValues,
        mode: "onChange",
    });

    const selectedStateId = watch("stateId");
    const selectedDistrictId = watch("districtId");
    const selectedMandalId = watch("mandalId");

    // Filter districts, mandals, and villages based on selected values
    const filteredDistricts = React.useMemo(() => {
        if (!selectedStateId) return [];
        return props.districts.filter((d) => d.stateId === selectedStateId);
    }, [props.districts, selectedStateId]);

    const filteredMandals = React.useMemo(() => {
        if (!selectedDistrictId) return [];
        return props.mandals.filter((m) => m.districtId === selectedDistrictId);
    }, [props.mandals, selectedDistrictId]);

    const filteredVillages = React.useMemo(() => {
        if (!selectedMandalId) return [];
        return props.villages.filter((v) => v.mandalId === selectedMandalId);
    }, [props.villages, selectedMandalId]);

    const stateOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
        return [
            {
                label: "States",
                options: props.states.map((s) => ({
                    value: s.id,
                    label: `${s.code} - ${s.name}`,
                })),
            },
        ];
    }, [props.states]);

    const districtOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
        return [
            {
                label: "Districts",
                options: filteredDistricts.map((d) => ({
                    value: d.id,
                    label: d.name,
                })),
            },
        ];
    }, [filteredDistricts]);

    const mandalOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
        return [
            {
                label: "Mandals",
                options: filteredMandals.map((m) => ({
                    value: m.id,
                    label: m.name,
                })),
            },
        ];
    }, [filteredMandals]);

    const villageOptionGroups = React.useMemo<GroupedComboboxGroup[]>(() => {
        return [
            {
                label: "Villages",
                options: filteredVillages.map((v) => ({
                    value: v.id,
                    label: v.name,
                })),
            },
        ];
    }, [filteredVillages]);

    React.useEffect(() => {
        if (props.open) reset(props.initialValues);
    }, [props.open, props.initialValues, reset]);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogDescription>{props.description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(props.onSave)} className="space-y-4">
                    <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                                setValue("villageId", "");
                                            }}
                                            groups={stateOptionGroups}
                                            disabled={props.isStatesLoading}
                                            placeholder="Select state"
                                            emptyText="No states found."
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
                                            onValueChange={(v) => {
                                                field.onChange(v);
                                                setValue("mandalId", "");
                                                setValue("villageId", "");
                                            }}
                                            groups={districtOptionGroups}
                                            disabled={!selectedStateId || props.isDistrictsLoading}
                                            placeholder={
                                                selectedStateId ? "Select district" : "Select state first"
                                            }
                                            emptyText={
                                                selectedStateId
                                                    ? "No districts found."
                                                    : "Select a state first."
                                            }
                                        />
                                    )}
                                />
                                <FieldError
                                    errors={errors.districtId ? [errors.districtId] : []}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>Mandal</FieldLabel>
                                <Controller
                                    control={control}
                                    name="mandalId"
                                    render={({ field }) => (
                                        <GroupedCombobox
                                            value={field.value}
                                            onValueChange={(v) => {
                                                field.onChange(v);
                                                setValue("villageId", "");
                                            }}
                                            groups={mandalOptionGroups}
                                            disabled={!selectedDistrictId || props.isMandalsLoading}
                                            placeholder={
                                                selectedDistrictId ? "Select mandal" : "Select district first"
                                            }
                                            emptyText={
                                                selectedDistrictId
                                                    ? "No mandals found."
                                                    : "Select a district first."
                                            }
                                        />
                                    )}
                                />
                                <FieldError errors={errors.mandalId ? [errors.mandalId] : []} />
                            </Field>

                            <Field>
                                <FieldLabel>Village</FieldLabel>
                                <Controller
                                    control={control}
                                    name="villageId"
                                    render={({ field }) => (
                                        <GroupedCombobox
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            groups={villageOptionGroups}
                                            disabled={!selectedMandalId || props.isVillagesLoading}
                                            placeholder={
                                                selectedMandalId ? "Select village" : "Select mandal first"
                                            }
                                            emptyText={
                                                selectedMandalId
                                                    ? "No villages found."
                                                    : "Select a mandal first."
                                            }
                                        />
                                    )}
                                />
                                <FieldError
                                    errors={errors.villageId ? [errors.villageId] : []}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="ikpName">Center name</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon>Name</InputGroupAddon>
                                    <InputGroupInput
                                        id="ikpName"
                                        placeholder="E.g. Katakoteswaram Center"
                                        {...register("name")}
                                    />
                                </InputGroup>
                                <FieldError errors={errors.name ? [errors.name] : []} />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="ikpNotes">Notes</FieldLabel>
                            <InputGroup>
                                <InputGroupAddon align="block-start">Notes</InputGroupAddon>
                                <Controller
                                    control={control}
                                    name="notes"
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value ?? ""}
                                            onChange={(next) => field.onChange(next)}
                                            placeholder="Add employee names and phone numbers for reference."
                                        />
                                    )}
                                />
                            </InputGroup>
                            <FieldError errors={errors.notes ? [errors.notes] : []} />
                        </Field>

                        <Field>
                            <label className="flex items-center gap-2 text-sm">
                                <Controller
                                    control={control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                                        />
                                    )}
                                />
                                <span>Active</span>
                            </label>
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => props.onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                props.isSaving ||
                                !isValid ||
                                (props.title.startsWith("Edit") ? !isDirty : false)
                            }
                        >
                            {props.isSaving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
