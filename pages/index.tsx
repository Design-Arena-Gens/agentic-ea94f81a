import { useEffect, useMemo, useState } from 'react';
import { AddSensorModal } from '@/components/AddSensorModal';
import { CategoryColumn } from '@/components/CategoryColumn';
import type { PrtgSensorDetails, SensorConfigItem } from '@/lib/prtg';

const STORAGE_KEY = 'noc_sensors_v1';

interface SensorsByCategory {
  HQ: PrtgSensorDetails[];
  AZURE: PrtgSensorDetails[];
  GCP: PrtgSensorDetails[];
  VPNs: PrtgSensorDetails[];
}

function readSavedSensors(): SensorConfigItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SensorConfigItem[]) : [];
  } catch {
    return [];
  }
}

function saveSensors(sensors: SensorConfigItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sensors)); } catch {}
}

async function fetchSensors(ids: number[]): Promise<PrtgSensorDetails[]> {
  if (ids.length === 0) return [];
  const url = `/api/prtg/sensors?ids=${encodeURIComponent(ids.join(','))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed fetching sensors');
  const data = await res.json();
  return data.sensors as PrtgSensorDetails[];
}

export default function Home() {
  const [addOpen, setAddOpen] = useState(false);
  const [config, setConfig] = useState<SensorConfigItem[]>([]);
  const [data, setData] = useState<PrtgSensorDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfig(readSavedSensors());
  }, []);

  useEffect(() => {
    saveSensors(config);
  }, [config]);

  const ids = useMemo(() => config.map(c => c.id), [config]);

  const grouped: SensorsByCategory = useMemo(() => {
    const byId = new Map<number, PrtgSensorDetails>();
    for (const s of data) byId.set(s.objid, s);
    const init: SensorsByCategory = { HQ: [], AZURE: [], GCP: [], VPNs: [] };
    for (const c of config) {
      const details = byId.get(c.id);
      if (details) {
        init[c.category].push({ ...details, name: c.name || details.name });
      }
    }
    return init;
  }, [data, config]);

  async function load() {
    if (ids.length === 0) { setData([]); setError(null); return; }
    try {
      setLoading(true);
      setError(null);
      const sensors = await fetchSensors(ids);
      setData(sensors);
    } catch (e: any) {
      setError(e?.message || 'Failed to load sensors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [ids.join(',')]);

  function onAdd(sensor: SensorConfigItem) {
    setConfig(prev => {
      const exists = prev.some(p => p.id === sensor.id);
      if (exists) return prev;
      return [...prev, sensor];
    });
  }

  function onRemove(objid: number) {
    setConfig(prev => prev.filter(p => p.id !== objid));
    setData(prev => prev.filter(p => p.objid !== objid));
  }

  function clearAll() {
    setConfig([]); setData([]);
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title">NOC Dashboard ? PRTG</div>
        <div className="actions">
          <button className="button" onClick={() => setAddOpen(true)}>Add Sensor</button>
          <button className="button" onClick={load} disabled={loading}>{loading ? 'Refreshing?' : 'Refresh'}</button>
          <button className="button danger" onClick={clearAll}>Clear All</button>
        </div>
      </div>
      {error && (
        <div style={{ marginBottom: 10, color: '#ff9aa8' }}>Error: {error}</div>
      )}
      <div className="grid">
        <CategoryColumn title="HQ" sensors={grouped.HQ} onRemove={onRemove} />
        <CategoryColumn title="AZURE" sensors={grouped.AZURE} onRemove={onRemove} />
        <CategoryColumn title="GCP" sensors={grouped.GCP} onRemove={onRemove} />
        <CategoryColumn title="VPNs" sensors={grouped.VPNs} onRemove={onRemove} />
      </div>

      <AddSensorModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={onAdd} />

      <div className="footerNote">Configure PRTG credentials via environment variables for serverless API: PRTG_BASE_URL, PRTG_USERNAME, PRTG_PASSHASH.</div>
    </div>
  );
}
