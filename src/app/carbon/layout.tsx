import AuthGuard from "@/components/AuthGuard";

export default function CarbonLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
