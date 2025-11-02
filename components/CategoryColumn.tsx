import { PrtgSensorDetails } from '@/lib/prtg';
import { SensorCard } from './SensorCard';

interface Props {
  title: string;
  sensors: PrtgSensorDetails[];
  onRemove: (objid: number) => void;
}

export function CategoryColumn({ title, sensors, onRemove }: Props) {
  return (
    <div className="column">
      <div className="columnHeader">{title}</div>
      <div className="columnBody">
        {sensors.map((s) => (
          <SensorCard key={s.objid} sensor={s} onRemove={() => onRemove(s.objid)} />
        ))}
        {sensors.length === 0 && (
          <div style={{ color: '#9fb0c7', fontSize: 14 }}>No sensors yet</div>
        )}
      </div>
    </div>
  );
}
