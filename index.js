import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.static(path.join(process.cwd(), "public")));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "dbHotel",
  password: "M252627y$",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));

// Synce database id with server
setupBookingSequence();
setupCustomerSequence();


// Home route
app.get("/", async (req, res) => {
  res.render("index", { message: "Welcome to e-Hotels Online Booking System" });
});

// Customer dashboard route
app.get("/customer", async (req, res) => {
  res.render("customer", {
    rooms: [],
    success: req.query.success,
    error: req.query.error
  });
});


// Employee dashboard route
app.get("/employee", async (req, res) => {
  try {
    // Fetch active bookings to display on the dashboard

    const bookingsResult = await db.query(`
      SELECT * FROM booking 
      WHERE status IN ('confirmed', 'pending check-in')
      ORDER BY start_date DESC
    `);


    const customers = await db.query(`SELECT * FROM customer`);

    res.render("new", {
      bookings: bookingsResult.rows,
      success: req.query.success,
      error: req.query.error,
      customers: customers.rows
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.render("new", {
      bookings: [],
      error: "Failed to load bookings"
    });
  }
});

app.get("/manager", async (req, res) => {
  try {
    // Fetch active bookings to display on the dashboard

    const archiveResult = await db.query(`
      SELECT * FROM archive
    `);


    res.render("manager", {
      archive: archiveResult.rows,
      error: req.query.error,

    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.render("new", {
      archive: [],
      error: "Failed to load bookings"
    });
  }
});


// Book room (by employee)
app.post("/employee/create-booking", async (req, res) => {
  let { customer_ssn_temp, room_id, start_date, end_date, employee_id } = req.body;
  try {
    // Check room availability first
    const startDateTime = new Date(start_date);
    const endDateTime = new Date(end_date);

    if (startDateTime >= endDateTime) {
      return res.redirect("/employee?error=" + encodeURIComponent("Start date must be before end date"));
    }

    // Check if room exists and is available
    const roomCheck = await db.query(
      "SELECT status FROM room WHERE room_id = $1",
      [room_id]
    );

    if (roomCheck.rows.length === 0) {
      return res.redirect("/employee?error=" + encodeURIComponent("Room does not exist"));
    }

    if (roomCheck.rows[0].status !== 'available') {
      return res.redirect("/employee?error=" + encodeURIComponent("Room is not currently available"));
    }

    // Check for overlapping bookings
    const availabilityCheck = `
      SELECT * FROM booking
      WHERE room_b_id = $1
      AND status IN ('confirmed', 'pending check-in')
      AND (
        (start_date < $3 AND end_date > $2)
      )
    `;
    const availabilityResult = await db.query(availabilityCheck, [room_id, start_date, end_date]);

    if (availabilityResult.rows.length > 0) {
      return res.redirect("/employee?error=" + encodeURIComponent("Room is not available for the selected dates"));
    }

    // Get customer ID
    let customer_id = await db.query(
      "SELECT ssnc_id FROM customer WHERE person_ssn = $1;",
      [customer_ssn_temp]
    );

    if (customer_id.rows.length === 0) {
      return res.redirect("/employee?error=" + encodeURIComponent("Customer not found, Please Register the Customer first"));
    }

    // Insert booking
    const query = `
      INSERT INTO booking (room_b_id, customer_b_id, employee_b_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING booking_id;
    `;
    await db.query(query, [room_id, customer_id.rows[0].ssnc_id, employee_id, start_date, end_date]);

    // Triggers will handle room availability and archive updates
    res.redirect("/employee?success=true");
  } catch (error) {
    console.error("Error booking room:", error);
    res.redirect("/employee?error=" + encodeURIComponent(error.message));
  }
});



// Check-in route 
app.post("/employee/check-in", async (req, res) => {
  const { customer_ssn } = req.body;
  try {
    let customer_id = await db.query(
      "SELECT ssnc_id FROM customer WHERE person_ssn = $1; ",
      [customer_ssn]
    );



    // Change customer booking from pending check-in to confirmed
    await db.query(`Update booking SET status = 'confirmed' WHERE customer_b_id = $1 AND status = 'pending check-in'`, [customer_id.rows[0].ssnc_id]);

    // change archive type from booking to renting
    await db.query(`UPDATE archive SET type = 'renting' WHERE customer_a_id = $1`, [customer_id.rows[0].ssnc_id]);


    res.redirect("/employee?success=true");
  } catch (error) {
    console.error("Error during check-in:", error);
    res.redirect("/employee?error=" + encodeURIComponent(error.message));
  }
});

// delete booking route 
app.post("/employee/delete", async (req, res) => {
  const { customer_ssn } = req.body;
  try {
    let customer_id = await db.query(
      "SELECT ssnc_id FROM customer WHERE person_ssn = $1;",
      [customer_ssn]
    );

    // Delete booking
    await db.query(`DELETE FROM booking WHERE customer_b_id = $1`, [customer_id.rows[0].ssnc_id]);

    // Triggers will handle room availability and archive updates
    res.redirect("/employee?success=true");
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.redirect("/employee?error=" + encodeURIComponent(error.message));
  }
});


// Create customer
app.post("/employee/create-customer", async (req, res) => {
  let { customer_ssn, first_name, last_name, email, phone_number, address } = req.body;
  try {
    // Check if customer already exists
    const checkResult = await db.query(`SELECT * FROM customer WHERE person_ssn = $1`, [customer_ssn]);


    if (checkResult.rows.length > 0) {
      return res.redirect("/employee?error=" + encodeURIComponent("Customer ID already exists"));
    }
    // we need to add in person first cause of the foreign key constraint in customer - person

    const queryPerson = `
    INSERT INTO person (ssn, phone_number, first_name, last_name, email, address)
    VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(queryPerson, [customer_ssn, phone_number, first_name, last_name, email, address]);


    const query = `
      INSERT INTO customer (person_ssn, phone_number, first_name, last_name, email, address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [customer_ssn, phone_number, first_name, last_name, email, address]);
    res.redirect("/employee?success=true");
  } catch (error) {
    console.error("Error creating customer:", error);
    res.redirect("/employee?error=" + encodeURIComponent(error.message));
  }
});

// Book room (by customer)
app.post("/customer/book-room", async (req, res) => {
  let { customer_ssn, first_name, last_name, email, phone_number, address, room_id, start_date, end_date } = req.body;

  // Check room availability
  const availabilityCheck = `
      SELECT * FROM booking 
      WHERE room_b_id = $1 
      AND ((start_date <= $2 AND end_date >= $2) 
      OR (start_date <= $3 AND end_date >= $3)
      OR (start_date >= $2 AND end_date <= $3))
      AND status IN ('confirmed', 'pending check-in')
    `;
  const availabilityResult = await db.query(availabilityCheck, [room_id, start_date, end_date]);

  if (availabilityResult.rows.length > 0) {
    return res.redirect("/customer?error=" + encodeURIComponent("Room is not available for the selected dates"));
  }

  try {
    // Verify the customer exists
    const customerResult = await db.query(`SELECT * FROM customer WHERE person_ssn = $1`, [customer_ssn]);

    // Add customer to the database if they don't exist
    if (customerResult.rows.length === 0) {
      const queryPerson = `
      INSERT INTO person (ssn, phone_number, first_name, last_name, email, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await db.query(queryPerson, [customer_ssn, phone_number, first_name, last_name, email, address]);

      const queryCustomer = `
        INSERT INTO customer (person_ssn, phone_number, first_name, last_name, email, address, registration_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.query(queryCustomer, [customer_ssn, phone_number, first_name, last_name, email, address, start_date]);
    }

    // Get customer ID
    const customer_id = await db.query(
      "SELECT ssnc_id FROM customer WHERE person_ssn = $1;",
      [customer_ssn]
    );

    // Insert booking
    const queryBook = `
      INSERT INTO booking (room_b_id, customer_b_id, employee_b_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, 'pending check-in')
      RETURNING booking_id;
    `;
    let employee_b_id = 1; // Default employee ID for online bookings
    await db.query(queryBook, [room_id, customer_id.rows[0].ssnc_id, employee_b_id, start_date, end_date]);

    // Triggers will handle room availability and archive updates
    res.redirect("/customer?success=true");
  } catch (error) {
    console.error("Error booking room (customer):", error);
    res.redirect("/customer?error=" + encodeURIComponent(error.message));
  }
});

// Search rooms
app.get("/search-rooms", async (req, res) => {
  const { start_date, end_date, room_capacity, view, price_range } = req.query;

  try {
    let priceMin = 0;
    let priceMax = 10000; // Some very high default value

    if (price_range) {
      const priceParts = price_range.split('-');
      if (priceParts.length === 2) {
        const [min, max] = priceParts.map(val => parseFloat(val.trim()));
        if (!isNaN(min)) priceMin = min;
        if (!isNaN(max)) priceMax = max;
      }
    }

    // Query to find available rooms
    const query = `
      SELECT room_id, room_capacity, price, view, amenities
      FROM room 
      WHERE room_capacity = $1
      AND price BETWEEN $2 AND $3
      AND status = 'available'
      AND room_id NOT IN (
        SELECT room_b_id FROM booking
        WHERE (
          (start_date <= $4 AND end_date >= $4)
          OR (start_date <= $5 AND end_date >= $5)
          OR (start_date >= $4 AND end_date <= $5)
        )
        AND status IN ('confirmed', 'pending check-in', 'checked-in')
      )
      AND view = $6
   
    `;

    const result = await db.query(query, [room_capacity, priceMin, priceMax, start_date, end_date, view]);

    // If no rooms found, try a simpler query to debug
    if (result.rows.length === 0) {
      const allRoomsQuery = `SELECT * FROM room WHERE room_capacity = $1 LIMIT 10`;
      const allRoomsResult = await db.query(allRoomsQuery, [room_capacity]);

      // If we have rooms of this capacity but none are available, explain that
      if (allRoomsResult.rows.length > 0) {
        return res.render("customer", {
          rooms: [],
          error: "All rooms of this type are booked for the selected dates",
          success: false
        });
      }
    }

    res.render("customer", {
      rooms: result.rows,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error("Error searching rooms:", error);
    res.render("customer", {
      rooms: [],
      error: "Error searching for rooms: " + error.message,
      success: false
    });
  }
});

// Add route to view room details
app.get("/room/:id", async (req, res) => {
  const roomId = req.params.id;

  try {
    const query = `SELECT * FROM room WHERE room_id = $1`;
    const result = await db.query(query, [roomId]);


    let hotelQuery = await db.query(
      "SELECT * FROM hotel JOIN room ON hotel.hotel_id = room.hroom_id WHERE room_id = $1",
      [roomId]
    );

    let hotelInfo = await db.query("SELECT * FROM hotel WHERE hotel_id = $1", [hotelQuery.rows[0].hroom_id]);



    if (result.rows.length === 0) {
      return res.status(404).send("Room not found");
    }

    res.render("room-details", { room: result.rows[0], hotel: hotelInfo.rows[0] });
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).send("Error fetching room details");
  }
});

// sync database id with server (for some reason importing data causes id to start at 1 even if i already have data in the database - these will sync up the max id)
async function setupBookingSequence() {
  try {
    const result = await db.query('SELECT MAX(booking_id) FROM booking');
    const maxId = result.rows[0].max || 0;
    await db.query(`SELECT setval('booking_booking_id_seq', ${maxId})`);
  } catch (error) {
    console.error('Error setting up booking sequence:', error);
  }
}

async function setupCustomerSequence() {
  try {
    const result = await db.query('SELECT MAX(ssnc_id) FROM customer');
    const maxId = result.rows[0].max || 0;
    await db.query(`SELECT setval('customer_ssnc_id_seq', ${maxId})`);
  } catch (error) {
    console.error('Error setting up customer sequence:', error);
  }
}




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});