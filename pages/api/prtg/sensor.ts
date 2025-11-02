import type { NextApiRequest, NextApiResponse } from 'next';
import type { PrtgSensorDetails } from '@/lib/prtg';
import { mapPrtgStatus } from '@/lib/prtg';

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = Number(req.query.id);
    if (!id) { res.status(400).json({ error: 'Missing id' }); return; }

    const baseUrl = getEnv('PRTG_BASE_URL');
    const username = getEnv('PRTG_USERNAME');
    const passhash = getEnv('PRTG_PASSHASH');

    const u = new URL('/api/getsensordetails.json', baseUrl);
    u.searchParams.set('id', String(id));
    u.searchParams.set('username', username);
    u.searchParams.set('passhash', passhash);

    const r = await fetch(u.toString(), { cache: 'no-store' });
    if (!r.ok) { res.status(r.status).json({ error: 'PRTG request failed' }); return; }
    const json = await r.json();
    const raw = json?.sensordata ?? json?.sensordetails ?? json;

    const details: PrtgSensorDetails = {
      objid: Number(raw?.objid ?? id),
      name: String(raw?.name ?? `Sensor ${id}`),
      status: mapPrtgStatus(raw?.status_raw ?? raw?.status),
      lastvalue: raw?.lastvalue ?? undefined,
      message: raw?.message ?? undefined,
      lastcheck: raw?.lastcheck_raw ?? raw?.lastcheck ?? undefined,
    };

    res.status(200).json({ sensor: details });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
