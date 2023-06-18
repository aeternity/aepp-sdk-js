<template>
  <div class="popup">
    <template v-if="popupParameters">
      <h2>Aepp at {{ aeppOrigin }} want to {{ action }}</h2>
      <div class="group">
        <div>
          <div>Request details</div>
          <div>{{ JSON.stringify(popupParameters, null, 2) }}</div>
        </div>

        <button @click="() => respond(true)">
          Confirm
        </button>
        <button @click="() => respond(false)">
          Reject
        </button>
      </div>
    </template>

    <h2 v-else>Wallet WebExtension</h2>
  </div>
</template>

<script>
import browser from 'webextension-polyfill';

export default {
  data: () => ({
    aeppOrigin: null,
    action: null,
    popupId: null,
    popupParameters: null,
    isResponded: false,
  }),
  mounted() {
    const data = new URL(location).searchParams.get('data');
    if (data != null) {
      const { aeppOrigin, action, popupId, ...params } = JSON.parse(data);
      this.aeppOrigin = aeppOrigin;
      this.action = action;
      this.popupId = popupId;
      this.popupParameters = params;
      window.addEventListener('beforeunload', () => this.respond(false));
    }
  },
  methods: {
    async respond(response) {
      if (this.isResponded) return;
      await browser.runtime.sendMessage({ response, popupId: this.popupId });
      this.isResponded = true;
      window.close();
    },
  },
}
</script>

<style lang="scss" src="./styles.scss" />
