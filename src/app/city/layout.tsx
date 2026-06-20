import AuthGuard from "@/components/AuthGuard";

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
