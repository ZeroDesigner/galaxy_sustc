<template>
    <FormElement
        :id="id"
        :value="label"
        :error="error"
        :title="title"
        type="text"
        help="Provide a short, unique name to describe this output."
        @input="onInput" />
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { computed, ref } from "vue";

import { useWorkflowStores } from "@/composables/workflowStores";
import type { Step } from "@/stores/workflowStepStore";

import FormElement from "@/components/Form/FormElement.vue";

const props = withDefaults(
    defineProps<{
        name: string;
        step: Step;
        showDetails?: boolean;
    }>(),
    {
        showDetails: false,
    }
);

const emit = defineEmits<{
    (e: "onOutputLabel", oldValue: string | null, newValue: string | null): void;
}>();

const { stepStore } = useWorkflowStores();

const error: Ref<string | undefined> = ref(undefined);
const id = computed(() => `__label__${props.name}`);
const title = computed(() => (props.showDetails ? `Label for: '${props.name}'` : "Label"));
const label = computed(() => {
    if (props.step.workflow_outputs?.length) {
        const workflowOutput = props.step.workflow_outputs.find(
            (workflowOutput) => workflowOutput.output_name === props.name
        );
        if (workflowOutput) {
            return workflowOutput.label;
        }
    }
    return null;
});

function onInput(newLabel: string | undefined | null) {
    if (newLabel === undefined || newLabel === null) {
        // form got activated or we set a workflow output through the checkbox
        // shouldn't change status of error label or result in deleting the label
        return;
    }

    if (newLabel === "") {
        const oldLabel = label.value || null;
        // user deleted existing label, we inactivate this as output
        const strippedWorkflowOutputs = (props.step.workflow_outputs || []).filter(
            (workflowOutput) => workflowOutput.output_name !== props.name
        );
        stepStore.updateStep({ ...props.step, workflow_outputs: strippedWorkflowOutputs });
        error.value = undefined;
        emit("onOutputLabel", oldLabel, null);
        return;
    }

    const existingWorkflowOutput = stepStore.workflowOutputs[newLabel];
    if (!existingWorkflowOutput) {
        // got a new label that isn't in use yet
        const newWorkflowOutputs = [...(props.step.workflow_outputs || [])].filter(
            (workflowOutput) => workflowOutput.output_name !== props.name
        );
        newWorkflowOutputs.push({
            label: newLabel,
            output_name: props.name,
        });
        stepStore.updateStep({ ...props.step, workflow_outputs: newWorkflowOutputs });
        const oldLabel = label.value || null;
        emit("onOutputLabel", oldLabel, newLabel || null);
        error.value = undefined;
    } else if (existingWorkflowOutput.stepId !== props.step.id) {
        error.value = `Duplicate output label '${newLabel}' will be ignored.`;
    }
}
</script>
