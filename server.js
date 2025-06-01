require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const userRoutes = require("./consultation");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json())
 app.use('/api/user',userRoutes);
// Serve static files for uploaded imagesget the id from local storage and perform crud of payments with the details of type amount and currency and  name date   and other nesasary details use nodejs and react and mysql
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connectio
const db = mysql.createConnection({
  host: "zarvisgenix.mysql.database.azure.com",
  user: "hr_genix",
  password: "OWoXzci3cxU5wcH",
  database: "genix",
  ssl: {
    rejectUnauthorized: true // or false depending on cert config
  }
});


db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");

    // Check if 'profile_pic' column exists and add it if missing
    const checkColumnQuery = `
      SELECT COUNT(*) AS count 
      FROM information_schema.columns 
      WHERE table_schema = 'genix' AND table_name = 'users' AND column_name = 'profile_pic'`;

    db.query(checkColumnQuery, (err, results) => {
      if (err) {
        console.error("Error checking column:", err);
      } else {
        if (results[0].count === 0) {
          const alterTableQuery = "ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) NULL";
          db.query(alterTableQuery, (err) => {
            if (err) {
              console.error("Error adding column:", err);
            } else {
              console.log("Column 'profile_pic' added successfully.");
            }
          });
        } else {
          console.log("Column 'profile_pic' already exists.");
        }
      }
    });
  }
});
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        details TEXT,
        occupation VARCHAR(100),
        appointment_date DATETIME NOT NULL,
        special_notes TEXT,
        address TEXT,
        mobile VARCHAR(15),
        medical_complication TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Appointments table checked/created successfully.");
    }
  });

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// Register API with Profile Picture
app.post("/register", (req, res, next) => {
  // if no multipart form is sent, skip multer and call next
  if (!req.headers['content-type']?.includes('multipart/form-data')) return next();
  upload.single("profile_pic")(req, res, next);
}, async (req, res) => {
  const {
    first_name, last_name, gender, email, password,
    mobile, phone, nhs_number, address,
    doctor_role, department, hospital
  } = req.body;

  const profilePicPath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (first_name, last_name, gender, email, password, mobile, phone, nhs_number, address, doctor_role, department, hospital, profile_pic)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
      first_name, last_name, gender, email, hashedPassword,
      mobile, phone, nhs_number, address,
      doctor_role, department, hospital, profilePicPath
    ], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error registering user" });
      }
      res.status(201).json({ message: "User registered successfully", profile_pic: profilePicPath });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-user/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT first_name, last_name, gender, email, mobile, phone, nhs_number, address, doctor_role, department, hospital, profile_pic FROM users WHERE id = ?", [id], 
  (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user data" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result[0]);
  });
});
app.get("/get-user", (req, res) => {

  db.query("SELECT * FROM users",  
  (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user data" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
app.get("/get-appointments", (req, res) => {

  db.query("SELECT * FROM appointments",  
  (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user data" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
app.get("/get-support", (req, res) => {

  db.query("SELECT * FROM support_tickets",  
  (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user data" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result);
  });
});
app.delete("/delete-user/:id", (req, res) => {
  const userId = req.params.id;

  const query = "DELETE FROM users WHERE id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting user", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  });
});

app.get("/get-user-count", (req, res) => {
  db.query("SELECT COUNT(*) AS userCount FROM users", (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user count" });
    }
    res.json({ count: result[0].userCount });
  });
});



app.put("/edit-profile/:id", upload.single("profile_pic"), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, gender, email, mobile, phone, nhs_number, address, doctor_role, department, hospital, password } = req.body;
  const profilePicPath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Check if user exists
    db.query("SELECT * FROM users WHERE id = ?", [id], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateQuery = `UPDATE users SET first_name=?, last_name=?, gender=?, email=?, mobile=?, phone=?, nhs_number=?, address=?, doctor_role=?, department=?, hospital=?`;
      let queryParams = [first_name, last_name, gender, email, mobile, phone, nhs_number, address, doctor_role, department, hospital];

      // Hash new password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += `, password=?`;
        queryParams.push(hashedPassword);
      }

      // Update profile picture if uploaded
      if (profilePicPath) {
        updateQuery += `, profile_pic=?`;
        queryParams.push(profilePicPath);
      }

      updateQuery += ` WHERE id = ?`;
      queryParams.push(id);

      // Execute the update query
      db.query(updateQuery, queryParams, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error updating profile" });
        }
        res.json({ message: "Profile updated successfully", profile_pic: profilePicPath });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Remove password from response
    delete user.password;

    res.status(200).json({
      message: "Login successful",
      user: user, // Sending all user details including id, name, email, and profile_pic
    });
  });
});
app.post("/appointments", (req, res) => {
  const { user_id, first_name, last_name, details, occupation, appointment_date, special_notes, address, mobile, medical_complication } = req.body;
  
  const sql = `INSERT INTO appointments (user_id, first_name, last_name, details, occupation, appointment_date, special_notes, address, mobile, medical_complication) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [user_id, first_name, last_name, details, occupation, appointment_date, special_notes, address, mobile, medical_complication], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Appointment added", id: result.insertId });
  });
});

// **Read All Appointments for a User**
app.get("/appointments/:user_id", (req, res) => {
  const { user_id } = req.params;
  
  db.query("SELECT * FROM appointments WHERE user_id = ?", [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});
app.get("/appointments/date/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date } = req.query;

  // Validate input
  if (!start_date || !end_date) {
    return res.status(400).json({ error: "Both start_date and end_date are required." });
  }

  const query = `
    SELECT * FROM appointments 
    WHERE user_id = ? 
    AND appointment_date BETWEEN ? AND ? 
    ORDER BY appointment_date ASC
  `;

  db.query(query, [user_id, start_date, end_date], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// **Update Appointment**
app.put("/appointments/:id", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, details, occupation, appointment_date, special_notes, address, mobile, medical_complication } = req.body;

  const sql = `UPDATE appointments 
               SET first_name=?, last_name=?, details=?, occupation=?, appointment_date=?, special_notes=?, address=?, mobile=?, medical_complication=? 
               WHERE id=?`;

  db.query(sql, [first_name, last_name, details, occupation, appointment_date, special_notes, address, mobile, medical_complication, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Appointment updated" });
  });
});
app.get("/appointments/stats/:user_id", (req, res) => {
  const { user_id } = req.params;
  
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM appointments WHERE user_id = ?) AS appointment_count,
      (SELECT COUNT(*) FROM checkups WHERE user_id = ?) AS checkup_count,
      (SELECT COUNT(*) FROM consultation WHERE user_id = ?) AS consultation_count
  `;

  db.query(query, [user_id, user_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json(results[0]); // Send the first row of the result
  });
});
app.get("/admin/stats", (req, res) => {
 
  
  const query = `
    SELECT     
      (SELECT COUNT(*) FROM appointments ) AS appointment_count,
      (SELECT COUNT(*) FROM users ) AS users_count,
      (SELECT COUNT(*) FROM consultation ) AS consultation_count,
(SELECT COUNT(*) FROM support_tickets ) AS support_count
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json(results[0]); // Send the first row of the result
  });
});
app.get("/admin/stats_second", (req, res) => {
 
  
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM appointments ) AS appointment_count,
      (SELECT COUNT(*) FROM checkups ) AS checkup_count,
      (SELECT COUNT(*) FROM consultation ) AS consultation_count
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json(results[0]); // Send the first row of the result
  });
});
app.get("/dashboard/stats/:user_id", (req, res) => {
  const { user_id } = req.params;
  
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM patients WHERE user_id = ?) AS appointment_count,
      (SELECT COUNT(*) FROM appointments WHERE user_id = ?) AS checkup_count,
      (SELECT COUNT(*) FROM consultation WHERE user_id = ?) AS consultation_count
  `;

  db.query(query, [user_id, user_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json(results[0]); // Send the first row of the result
  });
});

// **Delete Appointment**
app.delete("/appointments/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM appointments WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Appointment deleted" });
  });
});
// Create a patient
app.post('/patients', (req, res) => {
    const { user_id, first_name, last_name, details, occupation, checkup_date, address, mobile } = req.body;
    const query = `INSERT INTO patients (user_id, first_name, last_name, details, occupation, checkup_date, address, mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [user_id, first_name, last_name, details, occupation, checkup_date, address, mobile], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Patient added successfully', id: result.insertId });
    });
});

// Read all patients by user_id
app.get('/patients/:user_id', (req, res) => {
    const { user_id } = req.params;
    db.query(`SELECT * FROM patients WHERE user_id = ?`, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Update patient
  
app.put('/patients/:id', (req, res) => {
    const { first_name, last_name, details, occupation, checkup_date, address, mobile } = req.body;
      const { id } = req.params;
    const query = `UPDATE patients SET first_name=?, last_name=?, details=?, occupation=?, checkup_date=?, address=?, mobile=? WHERE id=?`;
    
    db.query(query, [first_name, last_name, details, occupation, checkup_date, address, mobile, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Patient updated successfully' });
    });
});

// Delete patient
app.delete('/patients/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM patients WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Patient deleted successfully' });
    });
});
app.post("/payments", (req, res) => {
  const { user_id, type, amount, currency, name, date } = req.body;
  const sql = "INSERT INTO payments (user_id, type, amount, currency, name, date) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [user_id, type, amount, currency, name, date], (err, result) => {
    if (err) res.status(500).json({ error: err });
    else res.json({ message: "Payment added successfully", id: result.insertId });
  });
});

// Get Payments by User ID
app.get("/payments/:user_id", (req, res) => {
  const { user_id } = req.params;
  db.query("SELECT * FROM payments WHERE user_id = ?", [user_id], (err, result) => {
    if (err) res.status(500).json({ error: err });
    else res.json(result);
  });
});

// Update Payment
app.put("/payments/:id", (req, res) => {
  const { type, amount, currency, name, date } = req.body;
  const { id } = req.params;
  db.query(
    "UPDATE payments SET type=?, amount=?, currency=?, name=?, date=? WHERE id=?",
    [type, amount, currency, name, date, id],
    (err) => {
      if (err) res.status(500).json({ error: err });
      else res.json({ message: "Payment updated successfully" });
    }
  );
});

// Delete Payment
app.delete("/payments/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM payments WHERE id=?", [id], (err) => {
    if (err) res.status(500).json({ error: err });
    else res.json({ message: "Payment deleted successfully" });
  });
});

app.get("/medications", (req, res) => {
  const { user_id } = req.query;
  db.query("SELECT * FROM medications WHERE user_id = ?", [user_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Add New Medication
app.post("/medications", (req, res) => {
  const { user_id, name, dosage, timings, complications, date, notes } = req.body;
  const sql = "INSERT INTO medications (user_id, name, dosage, timings, complications, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [user_id, name, dosage, timings, complications, date, notes], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Medication Added", id: result.insertId });
  });
});

// Update Medication
app.put("/medications/:id", (req, res) => {
  const { id } = req.params;
  const { name, dosage, timings, complications, date, notes } = req.body;
  const sql = "UPDATE medications SET name=?, dosage=?, timings=?, complications=?, date=?, notes=? WHERE id=?";
  db.query(sql, [name, dosage, timings, complications, date, notes, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Medication Updated" });
  });
});

// Delete Medication
app.delete("/medications/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM medications WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Medication Deleted" });
  });
});

// Get all support tickets
app.get("/tickets", (req, res) => {
  db.query("SELECT * FROM support_tickets ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Submit a support ticket
app.post("/tickets", (req, res) => {
  const { name, email, message } = req.body;
  db.query("INSERT INTO support_tickets (name, email, message) VALUES (?, ?, ?)", 
    [name, email, message], 
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true, message: "Ticket submitted successfully" });
    }
  );
});

// Mark as Resolved
app.put("/tickets/:id", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE support_tickets SET status = 'Resolved' WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Ticket marked as Resolved" });
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

