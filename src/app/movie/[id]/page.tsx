import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";

async function getMovieDetails(id: string) {
  const apiKey = process.env.TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits`, {
    next: { revalidate: 3600 }
  });
  
  if (!res.ok) return null;
  return res.json();
}

export default async function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const movie = await getMovieDetails(resolvedParams.id);
  
  if (!movie) {
    notFound();
  }

  const cast = movie.credits?.cast?.slice(0, 6) || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Hero Banner */}
      <div style={{ position: "relative", width: "100%", height: "60vh", minHeight: "400px" }}>
        <Image 
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`}
          alt={movie.title}
          fill
          style={{ objectFit: "cover", opacity: 0.3 }}
          priority
        />
        <div className="container" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap", width: "100%", paddingTop: "2rem" }}>
            <div style={{ width: "100%" }}>
              <BackButton href="/" />
            </div>
            <Image
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              width={250}
              height={375}
              style={{ borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
            />
            <div style={{ maxWidth: "600px", paddingBottom: "1rem" }}>
              <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "0.5rem" }}>{movie.title}</h1>
              <div style={{ display: "flex", gap: "1rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                <span>{new Date(movie.release_date).getFullYear()}</span>
                <span>•</span>
                <span>{movie.runtime} min</span>
                <span>•</span>
                <span>{movie.genres.map((g: any) => g.name).join(", ")}</span>
              </div>
              <p style={{ fontSize: "1.125rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                {movie.overview}
              </p>
              
              <Link href={`/movie/${movie.id}/showtimes`} className="btn btn-primary" style={{ fontSize: "1.125rem", padding: "1rem 2rem" }}>
                Book Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <div className="container" style={{ marginTop: "4rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Cast</h2>
        <div style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "1rem" }}>
          {cast.map((person: any) => (
            <div key={person.id} style={{ textAlign: "center", minWidth: "120px" }}>
              {person.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                  alt={person.name}
                  width={120}
                  height={120}
                  style={{ borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem", border: "2px solid var(--border)" }}
                />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--surface)", margin: "0 auto 1rem" }} />
              )}
              <h4 style={{ fontSize: "1rem", fontWeight: 500 }}>{person.name}</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{person.character}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
