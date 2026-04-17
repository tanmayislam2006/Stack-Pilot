export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary shadow-lg"></div>
        <p className="mt-4 text-sm font-medium text-gray-400 animate-pulse">Loading Track-Pilot...</p>
      </div>
    </div>
  );
}
