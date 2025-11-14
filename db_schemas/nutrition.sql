CREATE TABLE nutrition (
    id              SERIAL PRIMARY KEY,
    food_id         VARCHAR(50) UNIQUE NOT NULL,
    
    calories        DECIMAL(10,2),
    protein         DECIMAL(10,2),
    carbohydrates   DECIMAL(10,2),
    sugars          DECIMAL(10,2),
    fat             DECIMAL(10,2),
    saturated_fat   DECIMAL(10,2),
    fiber           DECIMAL(10,2),
    salt            DECIMAL(10,2),
    sodium          DECIMAL(10,2),

    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);