import { Layers, Play, Clock, Paperclip } from 'lucide-react';

const ICONS = { Layers, Play, Clock, Paperclip };

export default function CourseStats({ stats }) {
  return (
    <div className="cc-stats">
      {stats.map(s => {
        const Icon = ICONS[s.icon];
        return (
          <div key={s.label} className="cc-stat-card">
            <div className="cc-stat-icon">
              {Icon && <Icon size={22} />}
            </div>
            <div>
              <div className="cc-stat-value">{s.value}</div>
              <div className="cc-stat-label">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
