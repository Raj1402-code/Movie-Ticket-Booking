"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button 
      onClick={() => href ? router.push(href) : router.back()} 
      className="btn btn-outline"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        marginBottom: "1rem"
      }}
    >
      <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>←</span> Back
    </button>
  );
}
