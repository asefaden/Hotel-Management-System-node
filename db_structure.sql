CREATE TABLE hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(255),
    city VARCHAR(255),
    address TEXT,
    distance VARCHAR(255),
    photos JSON,
    title VARCHAR(255),
    `desc` TEXT,
    rating INT,
    cheapestPrice INT,
    featured TINYINT(1) DEFAULT 0
);

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT,
    title VARCHAR(255),
    price INT,
    maxPeople INT,
    description TEXT,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE roomNumbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    number INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isAdmin TINYINT(1) DEFAULT 0
);

CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE unavailableDates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roomNumber_id INT,
    date DATE,
    user_id INT,
    FOREIGN KEY (roomNumber_id) REFERENCES roomNumbers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);