CREATE TABLE additives (
    id              SERIAL PRIMARY KEY,
    food_id         VARCHAR(50) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    description     TEXT,
    risk_level      VARCHAR(50),   -- e.g. "high", "moderate", "low"

    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);