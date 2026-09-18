const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({ connectionString: process.env.DATABASE_URL });

const CITIES = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Chennai", 
  "Pune", "Kolkata", "Ahmedabad", "Chandigarh", "Kochi"
];

const CITY_LANGUAGES = {
  "Mumbai": ["Hindi", "English", "Marathi"],
  "Delhi-NCR": ["Hindi", "English"],
  "Bengaluru": ["Kannada", "English", "Hindi"],
  "Hyderabad": ["Telugu", "English", "Hindi"],
  "Chennai": ["Tamil", "English"],
  "Pune": ["Marathi", "Hindi", "English"],
  "Kolkata": ["Bengali", "Hindi", "English"],
  "Ahmedabad": ["Gujarati", "Hindi"],
  "Chandigarh": ["Punjabi", "Hindi", "English"],
  "Kochi": ["Malayalam", "English"]
};

const THEATERS_TEMPLATE = [
  { name: "PVR ICON", prefix: "Mall" },
  { name: "Cinepolis", prefix: "Nexus" },
  { name: "INOX", prefix: "City Center" },
  { name: "Carnival Cinemas", prefix: "Square" },
  { name: "Miraj Cinemas", prefix: "Plaza" }
];

async function seed() {
  await client.connect();
  console.log("Connected to database.");

  try {
    const apiKey = process.env.TMDB_API_KEY;
    console.log("Fetching movies from TMDB...");
    const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
    const data = await res.json();
    const movies = data.results.slice(0, 20); // Take top 20 movies for better distribution

    for (const movie of movies) {
      await client.query(
        `INSERT INTO movies (id, title, overview, poster_path, release_date) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [movie.id, movie.title, movie.overview, movie.poster_path, movie.release_date]
      );
    }
    console.log("Inserted movies into DB.");

    for (const city of CITIES) {
      await client.query(`INSERT INTO cities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;`, [city]);
    }
    
    const citiesRes = await client.query('SELECT id, name FROM cities');
    const citiesDb = citiesRes.rows;

    let screenCounter = 1;
    for (const city of citiesDb) {
      for (let i = 0; i < 5; i++) {
        const tTemplate = THEATERS_TEMPLATE[i];
        const tName = `${tTemplate.name}: ${tTemplate.prefix} ${city.name}`;
        
        const theaterRes = await client.query(
          `INSERT INTO theaters (city_id, name, location) VALUES ($1, $2, $3) RETURNING id`,
          [city.id, tName, `${tTemplate.prefix}, ${city.name}`]
        );
        const theaterId = theaterRes.rows[0].id;
        
        for (let s = 1; s <= 3; s++) {
          await client.query(
            `INSERT INTO screens (id, theater_id, name, capacity) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
            [screenCounter++, theaterId, `Screen ${s}`, s === 1 ? 120 : (s === 2 ? 80 : 60)]
          );
        }
      }
    }

    console.log("Generating showtimes...");
    const basePrice = 250;
    
    for (const city of citiesDb) {
      const cityScreensRes = await client.query(`
        SELECT s.id 
        FROM screens s
        JOIN theaters t ON s.theater_id = t.id
        WHERE t.city_id = $1
      `, [city.id]);
      const cityScreens = cityScreensRes.rows.map(row => row.id);
      
      const cityLangs = CITY_LANGUAGES[city.name] || ["English"];

      // Select a random subset of movies (e.g. 10 out of 20) for this city to ensure variety
      const shuffledMovies = [...movies].sort(() => 0.5 - Math.random());
      const activeMoviesForCity = shuffledMovies.slice(0, 10);

      for (const movie of activeMoviesForCity) {
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          
          // Assign 2-3 random screens in this city to play this movie
          const numScreens = Math.floor(Math.random() * 2) + 2; 
          const shuffledScreens = [...cityScreens].sort(() => 0.5 - Math.random());
          const assignedScreens = shuffledScreens.slice(0, numScreens);
          
          for (const screenId of assignedScreens) {
            const times = ['10:00:00', '14:30:00', '19:00:00'];
            for (const time of times) {
              const start_time = `${date.toLocaleDateString('en-CA')} ${time}`;
              const lang = cityLangs[Math.floor(Math.random() * cityLangs.length)];
              await client.query(
                `INSERT INTO showtimes (movie_id, screen_id, start_time, price, language) VALUES ($1, $2, $3, $4, $5)`,
                [movie.id, screenId, start_time, basePrice + (time === '19:00:00' ? 50 : 0), lang]
              );
            }
          }
        }
      }
    }
    
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    await client.end();
  }
}

seed();
