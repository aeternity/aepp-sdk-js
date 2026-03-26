<template>
  <h2>Sign raw data (unsafe)</h2>
  <div class="group">
    <div>
      <div>Data as text</div>
      <div>
        <input
          :value="dataBuffer.toString()"
          @input="setData($event.target.value)"
          placeholder="Plain text"
        />
      </div>
    </div>
    <div>
      <div>Data as hex</div>
      <div>
        <input
          :value="dataBuffer.toString('hex')"
          @input="setData($event.target.value, 'hex')"
          placeholder="hex-encoded data"
        />
      </div>
    </div>
    <div>
      <div>Data encoded</div>
      <div>
        <input v-model="data" placeholder="ba_-encoded data" />
      </div>
    </div>
    <button
      @click="
        () => {
          promise = dataSign();
        }
      "
    >
      Sign data
    </button>
    <div v-if="promise">
      <div>Data sign result</div>
      <Value :value="promise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { Buffer } from 'buffer';
import { decode, encode, Encoding, verify } from '@aeternity/aepp-sdk';
import Value from './Value.vue';

const emptyData = encode(Buffer.from([]), Encoding.Bytearray);

export default {
  components: { Value },
  computed: {
    ...mapState(['aeSdk']),
    dataBuffer() {
      try {
        return Buffer.from(decode(this.data || emptyData));
      } catch (error) {
        return Buffer.from([]);
      }
    },
  },
  data: () => ({
    data: '',
    promise: null,
  }),
  methods: {
    setData(data, type) {
      this.data = encode(Buffer.from(data, type), Encoding.Bytearray);
    },
    async dataSign() {
      const data = decode(this.data || emptyData);
      const signature = await this.aeSdk.unsafeSign(data);
      if (!verify(data, signature, this.aeSdk.address)) {
        throw new Error('Invalid signature returned by account');
      }
      return signature;
    },
  },
};
</script>
