DO $$ 
BEGIN
    RAISE INFO '>>>>>LOG - INSERT DATA';

    INSERT INTO common.users (id, name, email, password_hash, role) VALUES (0, 'system', 'system', '0', 'system');

    INSERT INTO common.ref_log_levels (code) VALUES
        ('debug'),
        ('log'),
        ('warn'),
        ('error');

    --End
    RAISE INFO '>>>>>LOG - INSERT DATA SUCCESS';
    RAISE INFO '>>>>>LOG - DB-INIT SUCCESS';
END $$;
