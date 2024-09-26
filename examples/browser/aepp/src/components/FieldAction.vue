<template>
  <h2>{{ title }}</h2>
  <div class="group">
    <div v-if="argTitle">
      <div>{{ argTitle }}</div>
      <div>
        <input v-model="argValue" :placeholder="argPlaceholder" />
      </div>
    </div>
    <button
      @click="
        () => {
          promise = actionHandler(argValue);
        }
      "
    >
      {{ actionTitle }}
    </button>
    <div v-if="promise">
      <div>{{ resultTitle }}</div>
      <Value :value="promise" />
    </div>
  </div>
</template>

<script>
import Value from './Value.vue';

export default {
  components: { Value },
  props: {
    title: { type: String, required: true },
    argTitle: { type: String, required: false },
    argPlaceholder: { type: String, required: false },
    argDefaultValue: { type: String, required: false },
    actionTitle: { type: String, required: true },
    actionHandler: { type: Function, required: true },
    resultTitle: { type: String, required: true },
  },
  data() {
    return {
      argValue: this.argDefaultValue,
      promise: null,
    };
  },
};
</script>
