import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query, getClient } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { showtimeId, seats } = body;

  if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const client = await getClient();

  try {
    // 1. Fetch showtime to get price and verify it exists
    const showtimeRes = await client.query('SELECT price FROM showtimes WHERE id = $1', [showtimeId]);
    if (showtimeRes.rows.length === 0) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }
    const pricePerSeat = Number(showtimeRes.rows[0].price);
    const totalAmount = pricePerSeat * seats.length;

    // Begin Transaction
    await client.query('BEGIN');

    // 2. Lock the showtime rows or tickets table for concurrency (Serializable or Row-Level Lock)
    // Actually, uniqueness constraint on (booking_id, seat_row, seat_number) isn't enough, 
    // we need uniqueness on (showtime_id, seat_row, seat_number).
    // Let's verify seats aren't already booked.
    const seatChecks = await Promise.all(
      seats.map(seat => 
        client.query(`
          SELECT 1 FROM tickets t 
          JOIN bookings b ON t.booking_id = b.id 
          WHERE b.showtime_id = $1 AND t.seat_row = $2 AND t.seat_number = $3 AND b.status = 'CONFIRMED'
          FOR UPDATE
        `, [showtimeId, seat.row, seat.number])
      )
    );

    const alreadyBooked = seatChecks.some(res => res.rows.length > 0);
    if (alreadyBooked) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "One or more selected seats are already booked" }, { status: 409 });
    }

    // 3. Insert Booking
    const bookingRes = await client.query(
      `INSERT INTO bookings (user_id, showtime_id, total_amount, status) VALUES ($1, $2, $3, 'CONFIRMED') RETURNING id`,
      [userId, showtimeId, totalAmount]
    );
    const bookingId = bookingRes.rows[0].id;

    // 4. Insert Tickets
    for (const seat of seats) {
      await client.query(
        `INSERT INTO tickets (booking_id, seat_row, seat_number) VALUES ($1, $2, $3)`,
        [bookingId, seat.row, seat.number]
      );
    }

    // Commit Transaction
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, bookingId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Booking transaction failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
