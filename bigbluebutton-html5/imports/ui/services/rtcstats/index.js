import { wrapRTCStatsWithDefaultOptions } from '@rtcstats/rtcstats-js';
import Auth from '/imports/ui/services/auth';
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

const fetchToken = async () => {
  const { rtcstatsTokenFetchAddress } = window.meetingClientSettings.public.media;

  try {
    const url = `${rtcstatsTokenFetchAddress}?sessionToken=${Auth.sessionToken}`;
    const response = await fetch(url, { credentials: 'include' });
    const { returncode, message, rtcstatsToken } = await response.json();

    if (typeof rtcstatsToken !== 'string') {
      logger.warn({
        logCode: 'rtcstats_token_missing',
        extraInfo: { status: response.status, returncode, message },
      }, 'No rtcstats token received, not connecting');
      return undefined;
    }

    return rtcstatsToken;
  } catch (error) {
    logger.warn({
      logCode: 'rtcstats_token_fetch_failed',
      extraInfo: { errorMessage: error.message },
    }, 'Failed to fetch rtcstats token, not connecting');
    return undefined;
  }
};

export const connect = async () => {
  if (!trace) return;

  const token = await fetchToken();

  if (token === undefined) return;

  trace.connect(token ? `${endpoint}?rtcstats-token=${token}` : endpoint);
};

export const close = () => {
  if (trace) trace.close();
};
