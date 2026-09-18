import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

async function getMoviesForCity(city: string | undefined) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error("TMDB API Key missing");
    return [];
  }
  
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`, {
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch data from TMDB');
    }
    
    const data = await res.json();
    const allMovies = data.results;

    if (!city) return allMovies.map((m: any) => ({ ...m, local_languages: ["English"] }));

    // Filter by city and get distinct languages per movie
    const dbRes = await query(`
      SELECT s.movie_id, array_agg(DISTINCT s.language) as languages
      FROM showtimes s
      JOIN screens sc ON s.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      JOIN cities c ON t.city_id = c.id
      WHERE c.name = $1
      GROUP BY s.movie_id
    `, [city]);

    const activeMovieMap = new Map();
    dbRes.rows.forEach(row => {
      activeMovieMap.set(row.movie_id, row.languages);
    });

    return allMovies
      .filter((m: any) => activeMovieMap.has(m.id))
      .map((m: any) => ({
        ...m,
        local_languages: activeMovieMap.get(m.id)
      }));

  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const city = cookieStore.get("city")?.value;
  
  const movies = await getMoviesForCity(city);

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "4rem" }}>
      <header style={{ margin: "4rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "700", marginBottom: "1rem" }}>
          Now Showing {city ? `in ${city}` : ""}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto" }}>
          Book tickets for the latest blockbuster movies playing at premium theaters near you.
        </p>
      </header>

      {movies.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>No movies available{city ? ` in ${city}` : ""}.</h2>
          <p>Please select a different city or check back later.</p>
        </div>
      ) : (
        <div className="grid-auto-fill">
          {movies.map((movie: any) => (
            <Link href={`/movie/${movie.id}`} key={movie.id}>
              <div className="movie-card glass-panel">
                <Image 
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                  alt={movie.title}
                  width={500}
                  height={750}
                  className="movie-poster"
                />
                <div className="movie-overlay">
                  <h3 className="movie-title">{movie.title}</h3>
                  <div className="movie-meta" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ color: "var(--accent)" }}>★ {movie.vote_average.toFixed(1)}</span>
                      <span style={{ margin: "0 0.5rem" }}>•</span>
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                    {movie.local_languages && (
                      <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        {movie.local_languages.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
