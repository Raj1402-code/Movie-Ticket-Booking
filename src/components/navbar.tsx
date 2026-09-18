"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import CitySelector from "./CitySelector";

export default function Navbar({ city }: { city?: string }) {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-content">
        <Link href="/" className="nav-brand">
          CineBook
        </Link>
        <div className="nav-links">
          <CitySelector currentCity={city} />
          <Link href="/" className="nav-item">Movies</Link>
          {status === "loading" ? (
            <span className="nav-item">...</span>
          ) : session ? (
            <>
              <Link href="/dashboard" className="nav-item">My Tickets</Link>
              <button 
                onClick={() => signOut()} 
                className="btn btn-outline"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="btn btn-primary"
              style={{ padding: "0.5rem 1.5rem" }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
