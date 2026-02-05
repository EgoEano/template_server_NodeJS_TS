DO $$ 
BEGIN
	RAISE INFO '>>>>>LOG - CREATE TABLES';
	RAISE INFO '>>>>>LOG - CREATE SYS LOG TABLES';
	--refs area
	DROP TABLE IF EXISTS common.ref_logs_levels;
	CREATE TABLE common.ref_logs_levels (
		id SERIAL PRIMARY KEY,
		code VARCHAR(50) UNIQUE NOT NULL,
		description TEXT
	);

	DROP TABLE IF EXISTS common.logs;
	CREATE TABLE common.logs (
		id BIGSERIAL PRIMARY KEY,
		level INT NOT NULL REFERENCES common.ref_logs_levels(id),
		source TEXT,
		message TEXT NOT NULL,
		data JSONB,
		created_at TIMESTAMPTZ DEFAULT now()
	);


	RAISE INFO '>>>>>LOG - END CREATE TABLES';
END $$;