import type { NextApiRequest, NextApiResponse } from 'next';
import type { PrtgSensorDetails, PrtgStatus } from '@/lib/prtg';
import { mapPrtgStatus } from '@/lib/prtg';

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function fetchSensor(baseUrl: string, username: string, passhash: string, id: number): Promise<PrtgSensorDetails> {
  const u = new URL('/api/getsensordetails.json', baseUrl);
  u.searchParams.set('id', String(id));
  u.searchParams.set('username', username);
  u.searchParams.set('passhash', passhash);

  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`PRTG error ${res.status}`);
  const json = await res.json();
  const raw = json?.sensordata ?? json?.sensordetails ?? json;

  const statusRaw: string | number | undefined = raw?.status_raw ?? raw?.status ?? raw?.status_rawx;
  const status = mapPrtgStatus(statusRaw);

  const details: PrtgSensorDetails = {
    objid: Number(raw?.objid ?? id),
    name: String(raw?.name ?? `Sensor ${id}`),
    status: status as PrtgStatus,
    lastvalue: raw?.lastvalue ?? raw?.lastvalue_raw ?? raw?.lastvalue_ ?? undefined,
    message: raw?.message ?? undefined,
    lastup: raw?.lastup_raw ?? raw?.lastup ?? undefined,
    lastdown: raw?.lastdown_raw ?? raw?.lastdown ?? undefined,
    lastcheck: raw?.lastcheck_raw ?? raw?.lastcheck ?? undefined,
    priority: raw?.priority ?? undefined,
    favorite: raw?.favorite ?? undefined,
    minigraph: raw?.minigraph ?? undefined,
    downsens: raw?.downsens ?? undefined,
    warnsens: raw?.warnsens ?? undefined,
    interval: raw?.interval ?? undefined,
    type: raw?.type ?? undefined,
    device: raw?.device ?? undefined,
    group: raw?.group ?? undefined
  };
  return details;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const idsRaw = (req.query.ids as string) || '';
    const ids = idsRaw.split(',').map(s => Number(s.trim())).filter(Boolean);
    if (ids.length === 0) {
      res.status(200).json({ sensors: [] });
      return;
    }

    const baseUrl = getEnv('PRTG_BASE_URL');
    const username = getEnv('PRTG_USERNAME');
    const passhash = getEnv('PRTG_PASSHASH');

    const results = await Promise.all(ids.map(id => fetchSensor(baseUrl, username, passhash, id)));
    res.status(200).json({ sensors: results });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
