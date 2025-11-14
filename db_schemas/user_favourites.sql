CREATE TABLE favorites (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(50) NOT NULL,
    food_id         VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, food_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (food_id) REFERENCES foods(id)
);