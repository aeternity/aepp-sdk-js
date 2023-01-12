<template>
  <div>
    <h3>Wallet WebExtension</h3>
    <img src="../public/icons/128.png" alt="Logo">

    <template v-if="popupParameters">
      <h2>Aepp at {{ aeppOrigin }} want to {{ action }}</h2>
      <div>Request details</div>
      <div>{{ JSON.stringify(popupParameters, null, 2) }}</div>

      <button @click="() => respond(true)">
        Confirm
      </button>
      <button @click="() => respond(false)">
        Reject
      </button>
    </template>
  </div>
</template>

<script>
import browser from 'webextension-polyfill';
import { unpackTx } from '@aeternity/aepp-sdk';

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
      if (params.transaction) params.unpackedTx = unpackTx(params.transaction);
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
