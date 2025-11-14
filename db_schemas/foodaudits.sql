CREATE TABLE food_audits (
    id              SERIAL PRIMARY KEY,
    food_id         VARCHAR(50) NOT NULL,
    user_id         VARCHAR(50),
    action          VARCHAR(50), -- "create", "update"
    change_log      TEXT,
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (food_id) REFERENCES foods(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);