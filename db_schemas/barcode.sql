CREATE TABLE barcodes (
    id              SERIAL PRIMARY KEY,
    food_id         VARCHAR(50) NOT NULL,
    barcode         VARCHAR(100) UNIQUE NOT NULL,

    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);