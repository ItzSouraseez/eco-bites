CREATE TABLE search_history (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(50) NOT NULL,
    food_id         VARCHAR(50),
    query           VARCHAR(255),
    viewed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);