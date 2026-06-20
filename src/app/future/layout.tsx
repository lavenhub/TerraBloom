import AuthGuard from "@/components/AuthGuard";

export default function FutureLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
