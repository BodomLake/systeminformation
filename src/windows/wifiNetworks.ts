'use strict';

import * as os from 'os';
import { powerShell } from '../common/exec';
import { nextTick, toInt } from '../common';
import { WifiNetworkData } from '../common/types';
import { wifiDBFromQuality, wifiFrequencyFromChannel } from '../common/network';

export const windowsWifiNetwork = async () => {
  let result: WifiNetworkData[] = [];
  let cmd = 'netsh wlan show networks mode=Bssid';
  const stdout = await powerShell(cmd);
  const ssidParts = stdout.toString().split(os.EOL + os.EOL + 'SSID ');
  ssidParts.shift();

  ssidParts.forEach((ssidPart: string) => {
    const ssidLines = ssidPart.split(os.EOL);
    if (ssidLines && ssidLines.length >= 8 && ssidLines[0].indexOf(':') >= 0) {
      const bssidsParts = ssidPart.split(' BSSID');
      bssidsParts.shift();

      bssidsParts.forEach((bssidPart) => {
        const bssidLines = bssidPart.split(os.EOL);
        const bssidLine = bssidLines[0].split(':');
        bssidLine.shift();
        const bssid = bssidLine.join(':').trim().toLowerCase();
        if (bssidLines && bssidLines.length > 3) {
          const channel = toInt((bssidLines[3].split(':').pop() || '').trim());
          const quality = (bssidLines[1].split(':').pop() || '').trim();
          const securityStr = (ssidLines[2].split(':').pop() || '').trim();
          const wpaStr = (ssidLines[3].split(':').pop() || '').trim();

          result.push({
            ssid: (ssidLines[0].split(':').pop() || '').trim(),
            bssid,
            mode: '',
            channel: channel || null,
            frequency: wifiFrequencyFromChannel(channel),
            signalLevel: wifiDBFromQuality(quality),
            quality: quality ? parseInt(quality, 10) : null,
            security: securityStr ? [securityStr] : [],
            wpaFlags: wpaStr ? [wpaStr] : [],
            rsnFlags: []
          });
        }
      });
    }
  });

  return result;
};

export const wifiNetworks = async () => {
  await nextTick();
  return windowsWifiNetwork();
};
