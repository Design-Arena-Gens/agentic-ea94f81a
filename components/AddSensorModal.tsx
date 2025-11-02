import { useEffect, useState } from 'react';
import type { SensorConfigItem } from '@/lib/prtg';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (sensor: SensorConfigItem) => void;
}

const CATEGORIES = ['HQ', 'AZURE', 'GCP', 'VPNs'] as const;

type Category = typeof CATEGORIES[number];

export function AddSensorModal({ open, onClose, onAdd }: Props) {
  const [objid, setObjid] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<Category>('HQ');

  useEffect(() => {
    if (open) {
      setObjid('');
      setName('');
      setCategory('HQ');
    }
  }, [open]);

  if (!open) return null;

  const add = () => {
    const idNum = Number(objid);
    if (!idNum || idNum <= 0) return;
    onAdd({ id: idNum, name: name || `Sensor ${idNum}`, category });
    onClose();
  };

  return (
    <div className="modalOverlay">
      <div className="modal">
        <div className="header" style={{ marginBottom: 10 }}>
          <div className="title">Add PRTG Sensor</div>
          <button className="button" onClick={onClose}>Close</button>
        </div>
        <div className="formRow">
          <label>PRTG Sensor ID (objid)</label>
          <input className="input" value={objid} onChange={e => setObjid(e.target.value)} placeholder="e.g. 12345" />
        </div>
        <div className="formRow">
          <label>Friendly Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Optional" />
        </div>
        <div className="formRow">
          <label>Category</label>
          <select className="select" value={category} onChange={e => setCategory(e.target.value as Category)}>
            {CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="button" onClick={onClose}>Cancel</button>
          <button className="button primary" onClick={add}>Add Sensor</button>
        </div>
        <div className="footerNote">Sensors will be queried via serverless API using environment-configured PRTG credentials.</div>
      </div>
    </div>
  );
}
