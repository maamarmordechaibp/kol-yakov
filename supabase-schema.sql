-- schema.sql
-- Run this in your Supabase SQL Editor to create the required tables.

-- ENUMs
CREATE TYPE rider_role AS ENUM ('staff', 'bochur');
CREATE TYPE ride_status AS ENUM ('scheduled', 'departed', 'cancelled');

-- 1. Users (Riders/Staff)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role rider_role DEFAULT 'bochur',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drivers (Staff who drive)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE, -- Link driver profile to rider profile
    car_capacity INT NOT NULL DEFAULT 4,
    default_departure_time TIME NOT NULL, 
    home_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pickup Locations (Safe zones)
CREATE TABLE pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL, -- e.g., 'בית המדרש'
    address TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Driver Schedules (Default weekly overrides, optional)
CREATE TABLE driver_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    departure_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, day_of_week)
);

-- 5. Staff Presets (Guaranteed Seats)
CREATE TABLE staff_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE, -- Staff rider
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rider_id, day_of_week) -- A staff rider has max 1 preset per day
);

-- 6. Daily Rides (Auto-generated every morning or manually added)
CREATE TABLE daily_rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    ride_date DATE NOT NULL,
    estimated_departure_time TIME NOT NULL,
    pickup_location_id UUID REFERENCES pickup_locations(id) ON DELETE SET NULL,
    status ride_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, ride_date)
);

-- 7. Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_ride_id UUID REFERENCES daily_rides(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    is_preset BOOLEAN DEFAULT FALSE, -- True if auto-booked via staff_presets
    is_paid BOOLEAN DEFAULT FALSE,
    status TEXT CHECK(status IN ('active', 'cancelled')) DEFAULT 'active',
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(daily_ride_id, rider_id) -- A rider can only book once per ride
);

-- 8. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method TEXT DEFAULT 'cash'
);

-- 9. Vacation Blocks
CREATE TABLE vacation_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Call Logs
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('inbound', 'outbound')),
    flow TEXT, -- 'rider_booking', 'driver_announce', etc
    duration_seconds INT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) - Basic Disable for internal API server Usage
ALTER TABLE riders DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_presets DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
