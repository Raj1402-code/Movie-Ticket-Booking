import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const userId = (session.user as any).id;

  const result = await query(`
    SELECT 
      b.id as booking_id,
      b.total_amount,
      b.created_at,
      s.start_time,
      m.title as movie_title,
      m.poster_path,
      t.name as theater_name,
      sc.name as screen_name,
      json_agg(json_build_object('row', tc.seat_row, 'number', tc.seat_number)) as seats
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN screens sc ON s.screen_id = sc.id
    JOIN theaters t ON sc.theater_id = t.id
    JOIN tickets tc ON tc.booking_id = b.id
    WHERE b.user_id = $1 AND b.status = 'CONFIRMED'
    GROUP BY b.id, s.start_time, m.title, m.poster_path, t.name, sc.name
    ORDER BY b.created_at DESC
  `, [userId]);

  const bookings = result.rows;

  return (
    <div className="container animate-fade-in" style={{ padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>My Tickets</h1>

      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>You haven't booked any tickets yet.</h2>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>Browse Movies</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {bookings.map((booking: any) => (
            <div key={booking.booking_id} className="glass-panel" style={{ display: "flex", padding: "1.5rem", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
              {booking.poster_path && (
                <Image 
                  src={`https://image.tmdb.org/t/p/w200${booking.poster_path}`} 
                  alt={booking.movie_title}
                  width={100}
                  height={150}
                  style={{ borderRadius: "8px" }}
                />
              )}
              <div style={{ flex: 1, minWidth: "250px" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{booking.movie_title}</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>{booking.theater_name} | {booking.screen_name}</p>
                <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{new Date(booking.start_time).toLocaleString()}</p>
                
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Seats: </span>
                  <strong>{booking.seats.map((s: any) => `${s.row}${s.number}`).join(", ")}</strong>
                </div>
              </div>
              
              <div style={{ padding: "1.5rem", borderLeft: "1px dashed var(--border)", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Amount</p>
                <h3 style={{ fontSize: "2rem", color: "var(--accent)" }}>₹{booking.total_amount}</h3>
                <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>Booking ID: {booking.booking_id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
