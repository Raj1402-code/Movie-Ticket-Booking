import Link from "next/link";
import { query } from "@/lib/db";
import BackButton from "@/components/BackButton";
import { cookies } from "next/headers";

export const revalidate = 0; // Disable caching for showtimes

export default async function ShowtimesPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ date?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const movieId = parseInt(resolvedParams.id);
  
  const cookieStore = await cookies();
  const city = cookieStore.get("city")?.value;

  // Generate date options (next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const selectedDate = resolvedSearchParams.date || dateOptions[0];

  // Fetch showtimes joined with screens and theaters, filtered by city and date
  let queryText = `
    SELECT 
      s.id as showtime_id,
      s.start_time,
      s.price,
      s.language,
      sc.name as screen_name,
      t.name as theater_name,
      t.location
    FROM showtimes s
    JOIN screens sc ON s.screen_id = sc.id
    JOIN theaters t ON sc.theater_id = t.id
    JOIN cities c ON t.city_id = c.id
    WHERE s.movie_id = $1 
      AND DATE(s.start_time) = $2
  `;
  const queryParams: any[] = [movieId, selectedDate];

  if (city) {
    queryText += ` AND c.name = $3`;
    queryParams.push(city);
  }

  queryText += ` ORDER BY t.name, s.start_time`;

  const result = await query(queryText, queryParams);
  const showtimes = result.rows;

  // Group by Theater
  const theatersMap = showtimes.reduce((acc: any, curr: any) => {
    if (!acc[curr.theater_name]) {
      acc[curr.theater_name] = { location: curr.location, shows: [] };
    }
    acc[curr.theater_name].shows.push(curr);
    return acc;
  }, {});

  return (
    <div className="container animate-fade-in" style={{ padding: "4rem 2rem" }}>
      <BackButton href={`/movie/${movieId}`} />
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Select Showtime</h1>
      
      {/* Date Carousel */}
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", marginBottom: "2rem", paddingBottom: "1rem" }}>
        {dateOptions.map(dateStr => {
          const d = new Date(dateStr);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = d.getDate();
          const month = d.toLocaleDateString('en-US', { month: 'short' });
          const isSelected = dateStr === selectedDate;
          
          return (
            <Link 
              href={`/movie/${movieId}/showtimes?date=${dateStr}`} 
              key={dateStr}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "0.5rem 1.5rem", borderRadius: "12px",
                background: isSelected ? "var(--primary)" : "var(--surface)",
                color: isSelected ? "white" : "var(--text-main)",
                border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                minWidth: "80px",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>{dayName}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0.25rem 0" }}>{dayNum}</span>
              <span style={{ fontSize: "0.75rem" }}>{month}</span>
            </Link>
          );
        })}
      </div>

      {showtimes.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>No showtimes available for {selectedDate}.</h2>
          <p>Try selecting a different date or city.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.keys(theatersMap).map(theaterName => (
            <div key={theaterName} className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{theaterName}</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{theatersMap[theaterName].location}</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {theatersMap[theaterName].shows.map((show: any) => (
                  <Link 
                    key={show.showtime_id} 
                    href={`/book/${show.showtime_id}`}
                    className="btn btn-outline"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem", minWidth: "100px" }}
                  >
                    <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--primary)" }}>
                      {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ marginTop: "0.25rem", color: "var(--text-main)", fontSize: "0.75rem", fontWeight: 600 }}>
                      {show.language}
                    </span>
                    <span style={{ marginTop: "0.25rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      ₹{show.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
