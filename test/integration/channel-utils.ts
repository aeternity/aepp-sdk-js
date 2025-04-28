import { channelUrl } from '.';
import { Encoded, Channel, AccountMemory, AeSdk } from '../../src';
import { ChannelOptions, SignTxWithTag } from '../../src/channel/internal';

export async function waitForChannel(channel: Channel, statuses: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    function handler(status: string): void {
      const expectedStatus = statuses.shift();
      if (status !== expectedStatus) {
        reject(new Error(`Expected SC status ${expectedStatus}, got ${status} instead`));
        channel.off('statusChanged', handler);
      } else if (statuses.length === 0) {
        resolve();
        channel.off('statusChanged', handler);
      }
    }
    channel.on('statusChanged', handler);
  });
}

export const sharedParams = {
  url: channelUrl,
  pushAmount: 1e13,
  initiatorAmount: 5e14,
  responderAmount: 5e14,
  channelReserve: 0,
  port: 3114,
  lockPeriod: 1,
  initiatorId: 'ak_' as Encoded.AccountAddress,
  responderId: 'ak_' as Encoded.AccountAddress,
  minimumDepth: 0,
  minimumDepthStrategy: 'plain' as const,
};

export async function initializeChannels(
  initiatorParams: {
    role: 'initiator';
    host: string;
    sign: SignTxWithTag;
  } & Partial<ChannelOptions>,
  responderParams: { role: 'responder'; sign: SignTxWithTag } & Partial<ChannelOptions>,
): Promise<[Channel, Channel]> {
  const initiatorCh = await Channel.initialize({
    ...sharedParams,
    ...initiatorParams,
  });
  const responderCh = await Channel.initialize({
    ...sharedParams,
    ...responderParams,
  });
  await Promise.all([
    waitForChannel(initiatorCh, ['accepted', 'signed', 'open']),
    waitForChannel(responderCh, ['halfSigned', 'open']),
  ]);
  return [initiatorCh, responderCh];
}

export async function recreateAccounts(aeSdk: AeSdk): Promise<[AccountMemory, AccountMemory]> {
  const initiator = AccountMemory.generate();
  const responder = AccountMemory.generate();
  await aeSdk.spend(3e15, initiator.address);
  await aeSdk.spend(3e15, responder.address);
  sharedParams.initiatorId = initiator.address;
  sharedParams.responderId = responder.address;
  return [initiator, responder];
}
