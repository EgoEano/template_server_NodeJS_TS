DO $$ 
BEGIN
    RAISE INFO '>>>>>LOG - INSERT DATA';

    RAISE INFO '>>>>>LOG - SYS LOGS';
    INSERT INTO common.ref_log_levels (code) VALUES
        ('debug'),
        ('log'),
        ('warn'),
        ('error');

    --End
    RAISE INFO '>>>>>LOG - INSERT DATA SUCCESS';
    RAISE INFO '>>>>>LOG - DB-INIT SUCCESS';
END $$;
