import type { ReactNode } from "react";

/** a11y wrapper: names the chart for AT and ships a sr-only data table fallback. */
export function ChartFigure({
  label,
  rows,
  headers,
  children,
}: {
  label: string;
  headers: [string, string];
  rows: [string, string][];
  children: ReactNode;
}) {
  return (
    <figure role="img" aria-label={label}>
      {children}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>{headers[0]}</th>
            <th>{headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
