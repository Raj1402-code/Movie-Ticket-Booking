import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import SeatSelector from "@/components/SeatSelector";
import BackButton from "@/components/BackButton";

export const revalidate = 0; // Don't cache seat layouts

export default async function BookSeatPage({ params }: { params: Promise<{ showtime_id: string }> }) {
  const resolvedParams = await params;
  const showtimeId = parseInt(resolvedParams.showtime_id);

  // Fetch showtime details, movie details, and screen capacity
  const showtimeResult = await query(`
    SELECT 
      s.id, s.start_time, s.price,
      sc.capacity, sc.name as screen_name,
      t.name as theater_name,
      m.title as movie_title,
      m.id as movie_id
    FROM showtimes s
    JOIN screens sc ON s.screen_id = sc.id
    JOIN theaters t ON sc.theater_id = t.id
    JOIN movies m ON s.movie_id = m.id
    WHERE s.id = $1
  `, [showtimeId]);

  if (showtimeResult.rows.length === 0) {
    notFound();
  }

  const showtime = showtimeResult.rows[0];

  // Fetch already booked seats for this showtime
  const ticketsResult = await query(`
    SELECT t.seat_row as row, t.seat_number as number
    FROM tickets t
    JOIN bookings b ON t.booking_id = b.id
    WHERE b.showtime_id = $1 AND b.status = 'CONFIRMED'
  `, [showtimeId]);

  const bookedSeats = ticketsResult.rows;

  return (
    <div className="container animate-fade-in" style={{ padding: "4rem 2rem", maxWidth: "900px" }}>
      <BackButton href={`/movie/${showtime.movie_id}/showtimes`} />
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{showtime.movie_title}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.125rem" }}>
          {showtime.theater_name} | {showtime.screen_name} | {new Date(showtime.start_time).toLocaleString()}
        </p>
      </div>

      <SeatSelector 
        showtimeId={showtime.id} 
        price={Number(showtime.price)} 
        bookedSeats={bookedSeats}
        screenCapacity={showtime.capacity}
      />
    </div>
  );
}
