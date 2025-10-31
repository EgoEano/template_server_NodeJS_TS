DO $$ 
BEGIN
	RAISE INFO '>>>>>LOG - CREATE TABLES';
	RAISE INFO '>>>>>LOG - CREATE REF TABLES';
	--refs area
	DROP TABLE IF EXISTS common.ref_log_levels;
	CREATE TABLE common.ref_log_levels (
		id SERIAL PRIMARY KEY,
		code VARCHAR(50) UNIQUE NOT NULL,
		description TEXT
	);

	RAISE INFO '>>>>>LOG - CREATE BASIC TABLES';

	DROP TABLE IF EXISTS common.users;
	CREATE TABLE common.users (
		id BIGSERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT DEFAULT 'user',
		is_active BOOLEAN DEFAULT TRUE,
		is_verified BOOLEAN DEFAULT FALSE,
		is_submitted BOOLEAN DEFAULT FALSE,
		last_login TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW()
	);

	
	DROP TABLE IF EXISTS common.logs;
	CREATE TABLE common.logs (
		id BIGSERIAL PRIMARY KEY,
		level INT NOT NULL REFERENCES common.ref_log_levels(id),
		source TEXT,
		message TEXT NOT NULL,
		data JSONB,
		created_at TIMESTAMPTZ DEFAULT now()
	);

	RAISE INFO '>>>>>LOG - CREATE SPECIAL LOGIC REF TABLES';



	RAISE INFO '>>>>>LOG - CREATE SPECIAL LOGIC MAIN TABLES';
	




END $$;



