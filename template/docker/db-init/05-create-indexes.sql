DO $$ 
BEGIN
    RAISE INFO '>>>>>LOG - CREATE INDEXES';

    CREATE INDEX idx_users_email ON common.users(email);
    CREATE INDEX idx_users_id ON common.users(id);

END $$;



