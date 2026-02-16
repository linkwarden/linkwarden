export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg">Page not found.</p>
    </div>
  );
}

Custom404.skipAuth = true;
