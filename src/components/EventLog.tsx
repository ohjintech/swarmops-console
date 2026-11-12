import { useFleet } from "../store/fleet";

export function EventLog() {
  const log = useFleet((s) => s.log);
  if (!log.length) return <div className="panel__empty">Command acks and drone events appear here.</div>;
  return (
    <ol className="log">
      {log.map((e) => (
        <li key={e.id} className={`log__${e.level}`}>
          <time>{new Date(e.at).toLocaleTimeString()}</time>
          {e.droneId && <strong>{e.droneId}</strong>}
          <span>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}
