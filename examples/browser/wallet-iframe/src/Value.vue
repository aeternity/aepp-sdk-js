<template>
  <div :class="{ error }">{{ text }}</div>
</template>

<script>
export default {
  props: {
    value: { type: [Object, Array, String, Number, Promise], default: null },
  },
  data: () => ({
    text: '',
    error: false,
  }),
  watch: {
    value: {
      async handler(value) {
        if (!value?.then) {
          this.text = this.valueToString(value);
          return;
        }
        this.text = 'Waiting for resolving';
        this.error = false;
        this.text = await value.then(
          (result) => this.valueToString(result),
          (error) => {
            console.warn(error);
            this.error = true;
            return error;
          },
        );
      },
      immediate: true,
    },
  },
  methods: {
    valueToString(value) {
      if (typeof value !== 'object') return value;
      return JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? `${v} (as BigInt)` : v), 2);
    },
  },
};
</script>
