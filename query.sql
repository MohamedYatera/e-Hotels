-- 1. Create Person table (using SSN as provided externally)
CREATE TABLE person (
    ssn VARCHAR(20) PRIMARY KEY,
    phone_number VARCHAR(20),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(200)
);

-- 2. Create Hotel Chain table with auto-increment hotel_chain_id
CREATE TABLE hotel_chain (
    hotel_chain_id SERIAL PRIMARY KEY,
    hc_central_office_address VARCHAR(200),
    hotel_number INT,
    hc_phone_number VARCHAR(20),
    emails VARCHAR(200)
);

-- 3. Create Hotel table with auto-increment hotel_id
CREATE TABLE hotel (
    hotel_id SERIAL PRIMARY KEY,
    rating INT,
    number_of_rooms INT,
    address VARCHAR(200),
    h_phone_numbers VARCHAR(100),
    emails VARCHAR(200),
    hotelchain_id INT,
    FOREIGN KEY (hotelchain_id) REFERENCES hotel_chain(hotel_chain_id)
);

-- 4. Create Room table with auto-increment room_id
CREATE TABLE room (
    room_id SERIAL PRIMARY KEY,
    price NUMERIC(10,2),
    room_capacity VARCHAR(20),
    view VARCHAR(50),
    status VARCHAR(20),
    amenities VARCHAR(200),
    problems VARCHAR(200),
    hroom_id INT,
    FOREIGN KEY (hroom_id) REFERENCES hotel(hotel_id)
);

-- 5. Create Employee table with auto-increment ssne_id and a reference to person via person_ssn
CREATE TABLE employee (
    ssne_id SERIAL PRIMARY KEY,
    person_ssn VARCHAR(20) UNIQUE,
    phone_number VARCHAR(20),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(200),
    roles VARCHAR(100),
    hotel_id INT,
    FOREIGN KEY (hotel_id) REFERENCES hotel(hotel_id),
    FOREIGN KEY (person_ssn) REFERENCES person(ssn)
);

-- 6. Create Manager table with auto-increment ssnm_id and a reference to person via person_ssn
CREATE TABLE manager (
    ssnm_id SERIAL PRIMARY KEY,
    person_ssn VARCHAR(20),
    phone_number VARCHAR(20),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(200),
    hotel_id INT,
    FOREIGN KEY (hotel_id) REFERENCES hotel(hotel_id),
    FOREIGN KEY (person_ssn) REFERENCES person(ssn)
);

-- 7. Create Customer table with auto-increment ssnc_id and a reference to person via person_ssn
-- Removed book_id and rent_id fields to avoid circular references
CREATE TABLE customer (
    ssnc_id SERIAL PRIMARY KEY,
    person_ssn VARCHAR(20),
    phone_number VARCHAR(20),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(200),
    registration_date DATE,
    employee_id INT,
    FOREIGN KEY (person_ssn) REFERENCES person(ssn),
    FOREIGN KEY (employee_id) REFERENCES employee(ssne_id)
);

-- 8. Create Booking table with auto-increment booking_id
CREATE TABLE booking (
    booking_id SERIAL PRIMARY KEY,
    room_b_id INT,
    customer_b_id INT,
    employee_b_id INT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    FOREIGN KEY (room_b_id) REFERENCES room(room_id),
    FOREIGN KEY (customer_b_id) REFERENCES customer(ssnc_id),
    FOREIGN KEY (employee_b_id) REFERENCES employee(ssne_id)
);

-- 9. Create Renting table with auto-increment renting_id
CREATE TABLE renting (
    renting_id SERIAL PRIMARY KEY,
    room_r_id INT,
    customer_r_id INT,
    employee_r_id INT,
    start_date DATE,
    end_date DATE,
    payment_status VARCHAR(20),
    FOREIGN KEY (room_r_id) REFERENCES room(room_id),
    FOREIGN KEY (customer_r_id) REFERENCES customer(ssnc_id),
    FOREIGN KEY (employee_r_id) REFERENCES employee(ssne_id)
);

-- 10. Create Archive table with auto-increment archive_id
CREATE TABLE archive (
    archive_id SERIAL PRIMARY KEY,
    type VARCHAR(20),
    booking_a_id INT,
    renting_a_id INT,
    room_a_id INT,
    customer_a_id INT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    FOREIGN KEY (booking_a_id) REFERENCES booking(booking_id),
    FOREIGN KEY (renting_a_id) REFERENCES renting(renting_id),
    FOREIGN KEY (room_a_id) REFERENCES room(room_id),
    FOREIGN KEY (customer_a_id) REFERENCES customer(ssnc_id)
);
