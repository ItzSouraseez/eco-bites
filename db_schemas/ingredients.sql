CREATE TABLE ingredients (
    id              SERIAL PRIMARY KEY,
    food_id         VARCHAR(50) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    is_allergen     BOOLEAN DEFAULT FALSE,
    is_vegan        BOOLEAN,
    is_vegetarian   BOOLEAN,

    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);