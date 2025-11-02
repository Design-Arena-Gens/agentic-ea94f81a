import { PrtgSensorDetails, statusToClass } from '@/lib/prtg';

interface Props {
  sensor: PrtgSensorDetails;
  onRemove?: () => void;
}

export function SensorCard({ sensor, onRemove }: Props) {
  const statusClass = statusToClass(sensor.status);
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">{sensor.name}</div>
        <div className={statusClass}>{sensor.status}</div>
      </div>
      <div className="kv">
        <div>Last Value</div>
        <strong>{sensor.lastvalue ?? '?'}</strong>
        <div>Last Check</div>
        <strong>{sensor.lastcheck ? new Date(sensor.lastcheck).toLocaleString() : '?'}</strong>
        <div>Message</div>
        <strong>{sensor.message ?? '?'}</strong>
      </div>
      {onRemove && (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="button danger" onClick={onRemove}>Remove</button>
        </div>
      )}
    </div>
  );
}
