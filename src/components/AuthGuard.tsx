"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useTerraStore } from "@/store/useTerraStore";

/**
 * AuthGuard — protects pages that require login.
 *
 * DEV BYPASS: In development, if the URL contains ?dev=1,
 * a mock user is auto-created so you can test features
 * without going through the SMS flow.
 *   e.g. http://localhost:3000/carbon?dev=1
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, setProfile } = useUserStore();
  const { initForUser } = useTerraStore();
  const router = useRouter();

  useEffect(() => {
    // Dev bypass — auto-login with a mock user when ?dev=1 is in the URL
    if (process.env.NODE_ENV === "development") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dev") === "1" && !isLoggedIn) {
        const mockPhone = "+910000000000";
        setProfile({
          name:         "Dev Tester",
          phone:        mockPhone,
          email:        "dev@terrabloom.app",
          age:          "25",
          city:         "Mumbai",
          country:      "India",
          occupation:   "Developer",
          bio:          "Testing TerraBloom features",
          diet:         "omnivore",
          transport:    "public",
          energy:       "grid",
          weeklyGoal:   65,
          carbonBudget: 20,
          avatar:       "#22c55e",
          joinedAt:     new Date().toISOString(),
        });
        initForUser(mockPhone);
        return;
      }
    }

    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router, setProfile, initForUser]);

  // Show spinner while redirecting
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--black)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "2px solid var(--green)",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 14px",
          }} />
          <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem" }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
