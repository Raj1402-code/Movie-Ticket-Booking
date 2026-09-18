"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const CITIES = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Chennai", 
  "Pune", "Kolkata", "Ahmedabad", "Chandigarh", "Kochi"
];

export default function CitySelector({ currentCity }: { currentCity?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!currentCity) {
      setIsOpen(true);
    }
  }, [currentCity]);

  const selectCity = (city: string) => {
    Cookies.set("city", city, { expires: 365, path: '/' });
    setIsOpen(false);
    // Hard refresh to ensure server components fetch correctly with new cookie
    window.location.href = window.location.pathname;
  };

  if (!isMounted) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="nav-item"
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <span>📍</span> {currentCity || "Select City"}
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem"
        }}>
          <div className="glass-panel" style={{ padding: "3rem", width: "100%", maxWidth: "800px", position: "relative" }}>
            {currentCity && (
              <button 
                onClick={() => setIsOpen(false)}
                style={{ position: "absolute", top: "1.5rem", right: "2rem", background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}
              >
                ✕
              </button>
            )}
            
            <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center" }}>Select Your City</h2>
            <div className="grid-auto-fill">
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => selectCity(city)}
                  className="btn btn-outline"
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    background: currentCity === city ? "var(--primary)" : "transparent",
                    color: currentCity === city ? "white" : "var(--text-main)",
                    borderColor: currentCity === city ? "var(--primary)" : "var(--border)"
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
