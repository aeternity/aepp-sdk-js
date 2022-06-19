import { createStore } from 'vuex';
import AeSdkPlugin from './StoreAeSdkPlugin';

export default createStore({
  plugins: [AeSdkPlugin],
});
