export function ApiOffline() {
  return (
    <div className="glass rounded-lg p-8 text-center">
      <p className="data-display text-destructive">API OFFLINE</p>
      <p className="body-md mt-2 text-muted-foreground">
        Start it with <code className="text-primary">docker compose up -d && npm run dev</code>
      </p>
    </div>
  );
}
