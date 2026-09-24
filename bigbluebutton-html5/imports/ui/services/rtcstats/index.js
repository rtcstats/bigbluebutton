import { wrapRTCStatsWithDefaultOptions } from '@rtcstats/rtcstats-js';
import logger from '/imports/startup/client/logger';

let trace = null;
let endpoint = '';

export const wrap = () => {
  endpoint = window.meetingClientSettings.public.media.rtcstatsEndpoint;

  if (trace || !endpoint) return;

  trace = wrapRTCStatsWithDefaultOptions({
    getStatsInterval: 1000,
    countReloads: true,
    log: (message) => {
      logger.warn({ logCode: 'rtcstats_error' }, message);
    },
  });
};

export const connect = (token = '') => {
  if (!trace) return;

  trace.connect(token ? `${endpoint}?rtcstats-token=${token}` : endpoint);
};

export const close = () => {
  if (trace) trace.close();
};
