CREATE TABLE foods (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    barcode         VARCHAR(100) UNIQUE,
    image_url       TEXT,
    description     TEXT,
    created_by      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);