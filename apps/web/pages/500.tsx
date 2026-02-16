export default function Custom500() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">500</h1>
      <p className="mt-2 text-lg">Internal server error.</p>
    </div>
  );
}

Custom500.skipAuth = true;
