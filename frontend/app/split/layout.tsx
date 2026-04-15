// Simple passthrough – SplitModule itself owns the fixed viewport container
export default function SplitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
