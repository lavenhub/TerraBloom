"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTerraStore } from "@/store/useTerraStore";
import { useUserStore } from "@/store/useUserStore";

const TABS = [
  { href: "/city",    label: "3D City" },
  { href: "/carbon",  label: "Carbon Log" },
  { href: "/history", label: "History" },
  { href: "/future",  label: "Future" },
];

function initials(name: string) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "TB";
}

export default function Navigation() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cityState } = useTerraStore();
  const { isLoggedIn, profile } = useUserStore();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isHome = pathname === "/";

  const navBg    = scrolled || !isHome ? "var(--black)"  : "transparent";
  const navBorder = scrolled || !isHome ? "var(--border)" : "transparent";

  /* ── avatar colour from stored value ── */
  const avatarBg   = profile?.avatar || "var(--green)";
  const scoreColor = cityState.overallScore >= 60 ? "var(--green)" : "#6b7280";

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg,
        borderBottom: `1px solid ${navBorder}`,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
              Terra<span style={{ color: "var(--green)" }}>Bloom</span>
            </span>
          </Link>

          {/* ── Desktop tabs ── */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="nav-desktop">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link key={tab.href} href={tab.href} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 15px", borderRadius: 6, textDecoration: "none",
                  fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "var(--text-dim)",
                  background: active ? "var(--surface-3)" : "transparent",
                  border: active ? "1px solid var(--border-2)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: active ? "var(--green)" : "transparent",
                    transition: "background 0.15s",
                  }} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right side ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="nav-desktop">
            {/* World score chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "var(--surface-2)", border: "1px solid var(--border-2)",
              borderRadius: 6, padding: "5px 12px",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: scoreColor, display: "block" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Score</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{cityState.overallScore}</span>
            </div>

            {/* Profile / Login */}
            {isLoggedIn && profile ? (
              <Link href="/profile" style={{
                display: "flex", alignItems: "center", gap: 8,
                background: pathname === "/profile" ? "var(--surface-3)" : "var(--surface-2)",
                border: pathname === "/profile" ? "1px solid var(--border-2)" : "1px solid var(--border)",
                borderRadius: 8, padding: "5px 12px 5px 6px",
                textDecoration: "none", transition: "all 0.15s ease",
              }}>
                {/* Mini avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: avatarBg, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: "#000",
                }}>
                  {initials(profile.name)}
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#fff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <button onClick={() => router.push("/login")} className="btn-primary" style={{ padding: "6px 16px", fontSize: "0.8125rem" }}>
                Log In
              </button>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setOpen(!open)}
            className="nav-mobile"
            aria-label="Menu"
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "none", flexDirection: "column", gap: 5, padding: 4,
            }}
          >
            <span style={{ display: "block", width: 22, height: 1.5, background: "#fff", borderRadius: 1, transition: "transform 0.2s", transform: open ? "rotate(45deg) translate(4px,4px)" : "none" }} />
            <span style={{ display: "block", width: 16, height: 1.5, background: "#fff", borderRadius: 1, transition: "opacity 0.2s", opacity: open ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 1.5, background: "#fff", borderRadius: 1, transition: "transform 0.2s", transform: open ? "rotate(-45deg) translate(4px,-4px)" : "none" }} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
              background: "var(--surface-2)", borderBottom: "1px solid var(--border)",
              padding: "8px 24px 20px",
            }}
          >
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link key={tab.href} href={tab.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 0", borderBottom: "1px solid var(--border)",
                  textDecoration: "none", color: active ? "var(--green)" : "var(--text-dim)",
                  fontSize: "0.9375rem", fontWeight: active ? 600 : 400,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "var(--green)" : "transparent", border: "1px solid var(--border)", flexShrink: 0 }} />
                  {tab.label}
                </Link>
              );
            })}

            {/* Profile row in mobile */}
            {isLoggedIn && profile ? (
              <Link href="/profile" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 0", textDecoration: "none",
                borderBottom: "1px solid var(--border)",
                color: pathname === "/profile" ? "var(--green)" : "var(--text-dim)",
                fontSize: "0.9375rem", fontWeight: pathname === "/profile" ? 600 : 400,
              }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: "#000" }}>
                  {initials(profile.name)}
                </div>
                Profile — {profile.name.split(" ")[0]}
              </Link>
            ) : (
              <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", textDecoration: "none", color: "var(--green)", fontSize: "0.9375rem", fontWeight: 600 }}>
                Log In / Sign Up
              </Link>
            )}

            {/* Score */}
            <div style={{ paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: scoreColor, display: "block" }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>World Score: <strong style={{ color: "#fff" }}>{cityState.overallScore}</strong></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 840px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex   !important; }
        }
      `}</style>
    </>
  );
}
