DO $$
DECLARE 
    db_name TEXT := 'test_project';
    user_name TEXT;
    pswrd TEXT;
    role_name TEXT;
BEGIN
    RAISE INFO '>>>>>LOG - CREATE ROLES';

    -- Admin role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
    END IF;
    -- Configure admin
    GRANT USAGE ON SCHEMA common, super TO admin;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA common, super TO admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common, super GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin;
    GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA common, super TO admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common, super GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO admin;
    ALTER ROLE admin WITH LOGIN;

    -- Basic role
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'basic') THEN
        CREATE ROLE basic;
    END IF;
    -- Configure basic
    GRANT USAGE ON SCHEMA common TO basic;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA common TO basic;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO basic;
    GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA common TO basic;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO basic;
    ALTER ROLE basic WITH LOGIN;

    -- Basic readonly
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'basic_readonly') THEN
        CREATE ROLE basic_readonly;
    END IF;
    -- Configure basic_readonly
    GRANT USAGE ON SCHEMA common TO basic_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA common TO basic_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT SELECT ON TABLES TO basic_readonly;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA common TO basic_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT USAGE, SELECT ON SEQUENCES TO basic_readonly;
    ALTER ROLE basic_readonly WITH LOGIN;

    EXECUTE format('GRANT CONNECT ON DATABASE %I TO admin;', db_name);
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO basic;', db_name);
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO basic_readonly;', db_name);

    RAISE INFO '>>>>>LOG - CREATE USERS';
    ------ Users
    -- common
    user_name := 'app_server';
    pswrd := '12345';
    role_name := 'basic';

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = user_name) THEN
        EXECUTE format('CREATE USER %I WITH ENCRYPTED PASSWORD %L', user_name, pswrd);
    END IF;
    EXECUTE format('GRANT %I TO %I', role_name, user_name);

    -- super
    user_name := 'super';
    pswrd := '54321';
    role_name := 'admin';

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = user_name) THEN
        EXECUTE format('CREATE USER %I WITH ENCRYPTED PASSWORD %L', user_name, pswrd);
    END IF;
    EXECUTE format('GRANT %I TO %I', role_name, user_name);
END $$;




