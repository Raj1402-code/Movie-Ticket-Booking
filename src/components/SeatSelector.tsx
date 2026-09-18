"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SeatSelectorProps {
  showtimeId: number;
  price: number;
  bookedSeats: { row: string, number: number }[];
  screenCapacity: number; // Assuming a square grid for simplicity, e.g., 100 capacity = 10 rows of 10
}

export default function SeatSelector({ showtimeId, price, bookedSeats, screenCapacity }: SeatSelectorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate a mock grid based on capacity. e.g. capacity 100 -> A-J rows, 1-10 numbers
  const rows = Math.ceil(Math.sqrt(screenCapacity));
  const cols = Math.ceil(screenCapacity / rows);
  const rowLabels = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));

  const isBooked = (row: string, num: number) => {
    return bookedSeats.some(seat => seat.row === row && seat.number === num);
  };

  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleBook = async () => {
    if (!session) {
      signIn();
      return;
    }
    
    if (selectedSeats.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seats: selectedSeats.map(s => {
            const match = s.match(/([A-Z]+)(\d+)/);
            return { row: match![1], number: parseInt(match![2]) };
          })
        })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to book tickets");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ marginBottom: "2rem", width: "100%", maxWidth: "600px" }}>
        {/* Screen Indicator */}
        <div style={{ 
          height: "40px", 
          background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", 
          borderTop: "4px solid var(--primary)", 
          borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
          textAlign: "center",
          lineHeight: "40px",
          marginBottom: "3rem",
          color: "var(--text-muted)"
        }}>
          SCREEN THIS WAY
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          {rowLabels.map(row => (
            <div key={row} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ width: "20px", textAlign: "right", marginRight: "1rem", color: "var(--text-muted)" }}>{row}</span>
              {Array.from({ length: cols }, (_, i) => {
                const num = i + 1;
                const seatId = `${row}${num}`;
                const booked = isBooked(row, num);
                const selected = selectedSeats.includes(seatId);
                
                return (
                  <button
                    key={seatId}
                    disabled={booked}
                    onClick={() => toggleSeat(seatId)}
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: booked ? "not-allowed" : "pointer",
                      background: booked ? "rgba(255,255,255,0.1)" : selected ? "var(--primary)" : "var(--surface-hover)",
                      color: booked ? "transparent" : selected ? "white" : "var(--text-main)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      transition: "all 0.2s ease"
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "3rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--surface-hover)" }}></div> Available</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--primary)" }}></div> Selected</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.1)" }}></div> Booked</div>
      </div>

      {/* Summary */}
      <div style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Selected: {selectedSeats.length} tickets</h3>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Total Amount: ₹{selectedSeats.length * price}</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleBook} 
          disabled={selectedSeats.length === 0 || loading}
          style={{ padding: "1rem 2rem", fontSize: "1.125rem", opacity: selectedSeats.length === 0 ? 0.5 : 1 }}
        >
          {loading ? "Processing..." : `Pay ₹${selectedSeats.length * price}`}
        </button>
      </div>
    </div>
  );
}
