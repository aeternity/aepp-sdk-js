import BrowserConnection from './connection/Browser';

/**
 * Browser connection proxy
 * Provide functionality to easily forward messages from one connection to another and back
 * @category aepp wallet communication
 * @param con1 - first connection
 * @param con2 - second connection
 * @returns a function to stop proxying
 */
export default (con1: BrowserConnection, con2: BrowserConnection): () => void => {
  con1.connect((msg: any) => con2.sendMessage(msg), () => con2.disconnect());
  con2.connect((msg: any) => con1.sendMessage(msg), () => con1.disconnect());

  return () => {
    con1.disconnect();
    con2.disconnect();
  };
};
