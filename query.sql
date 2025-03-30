
CREATE TABLE person (
    ssn VARCHAR(20) PRIMARY KEY,
    phone_number VARCHAR(20),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(200)
);


CREATE TABLE hotel_chain (
    hotel_chain_id SERIAL PRIMARY KEY,
    hc_central_office_address VARCHAR(200),
    hotel_number INT,
    hc_phone_number VARCHAR(20),
    emails VARCHAR(200)
);


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





CREATE TABLE archive (
    archive_id SERIAL PRIMARY KEY,
    type VARCHAR(20),
    booking_a_id INT,
    room_a_id INT,
    customer_a_id INT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    FOREIGN KEY (booking_a_id) REFERENCES booking(booking_id),
    FOREIGN KEY (room_a_id) REFERENCES room(room_id),
    FOREIGN KEY (customer_a_id) REFERENCES customer(ssnc_id)
);
