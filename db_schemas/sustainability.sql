CREATE TABLE sustainability (
    id                  SERIAL PRIMARY KEY,
    food_id             VARCHAR(50) UNIQUE NOT NULL,

    ecoscore            CHAR(1),            -- A–E
    packaging_material  VARCHAR(255),       -- "Plastic", "Paper", etc.
    packaging_recyclable BOOLEAN,
    carbon_footprint    DECIMAL(10,3),      -- kg CO2 per kg
    is_organic          BOOLEAN,

    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);