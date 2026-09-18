-- Drop tables to recreate with cities
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS showtimes CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS screens CASCADE;
DROP TABLE IF EXISTS theaters CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Create Theaters table
CREATE TABLE IF NOT EXISTS theaters (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL
);

-- Create Screens table
CREATE TABLE IF NOT EXISTS screens (
    id SERIAL PRIMARY KEY,
    theater_id INT REFERENCES theaters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

-- Create Movies table (Cached from TMDB)
CREATE TABLE IF NOT EXISTS movies (
    id INT PRIMARY KEY, -- We use TMDB movie ID here
    title VARCHAR(255) NOT NULL,
    overview TEXT,
    poster_path VARCHAR(255),
    release_date DATE,
    duration INT -- in minutes
);

-- Create Showtimes table
CREATE TABLE IF NOT EXISTS showtimes (
    id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES movies(id) ON DELETE CASCADE,
    screen_id INT REFERENCES screens(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'English'
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    showtime_id INT REFERENCES showtimes(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tickets table (mapping booking to specific seat)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    seat_row VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    UNIQUE(booking_id, seat_row, seat_number)
);
