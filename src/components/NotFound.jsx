export function isHomePathname(pathname, baseUrl = import.meta.env.BASE_URL) {
  let appPath = pathname;
  if (baseUrl.startsWith('/') && baseUrl !== '/') {
    const basePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (appPath === basePath) appPath = '/';
    else if (appPath.startsWith(`${basePath}/`)) appPath = appPath.slice(basePath.length);
  }
  return appPath === '/';
}

export default function NotFound() {
  const homeUrl = import.meta.env.BASE_URL.startsWith('/') ? import.meta.env.BASE_URL : '/';
  return (
    <main className="error-screen">
      <div className="empty">
        <h1>Page not found</h1>
        <p>We couldn't find that page. Head back to Uniskillfy to find your next skill swap.</p>
        <a className="btn primary" href={homeUrl}>Go to Uniskillfy</a>
      </div>
    </main>
  );
}
