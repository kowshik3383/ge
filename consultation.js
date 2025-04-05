const express = require("express");
const db = require("./db");

const router = express.Router();
router.post("/patients", (req, res) => {
    const {
        user_id,
        firstname,
        lastname,
        details,
        occupation,
        consultation_date,
        special_notes,
        address,
        mobile,
        medical_complications,
    } = req.body;

    const sql =
        "INSERT INTO consultation (user_id, firstname, lastname, details, occupation, consultation_date, special_notes, address, mobile, medical_complications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(
        sql,
        [user_id, firstname, lastname, details, occupation, consultation_date, special_notes, address, mobile, medical_complications],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Appointment created", id: result.insertId });
        }
    );
});

// Read all appointments for a user
router.get("/patients/:user_id", (req, res) => {
    const { user_id } = req.params;
    const sql = "SELECT * FROM consultation WHERE user_id = ?";
    
    db.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Update an appointment
router.put("/patients/:id", (req, res) => {
    const { id } = req.params;
    const {
        firstname,
        lastname,
        details,
        occupation,
        consultation_date,
        special_notes,
        address,
        mobile,
        medical_complications,
    } = req.body;

    const sql =
        "UPDATE consultation SET firstname=?, lastname=?, details=?, occupation=?, consultation_date=?, special_notes=?, address=?, mobile=?, medical_complications=? WHERE id=?";

    db.query(
        sql,
        [firstname, lastname, details, occupation, consultation_date, special_notes, address, mobile, medical_complications, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Appointment updated" });
        }
    );
});


// Delete an appointment
router.delete("/patients/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM consultation WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Appointment deleted" });
    });
});
router.post("/checkup", (req, res) => {
    const { userId, firstName, lastName, details, occupation, checkupDate, notes, address, mobile, complications } = req.body;
    const sql = "INSERT INTO checkups (user_id, first_name, last_name, details, occupation, checkup_date, notes, address, mobile, complications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [userId, firstName, lastName, details, occupation, checkupDate, notes, address, mobile, complications], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ message: "Checkup record added successfully" });
    });
});

// Get Checkup Records by User ID
router.get("/checkup/:userId", (req, res) => {
    const userId = req.params.userId;
    db.query("SELECT * FROM checkups WHERE user_id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Update Checkup Record
router.put("/checkup/:id", (req, res) => {
    const checkupId = req.params.id;
    const { details, occupation, checkupDate, notes, address, mobile, complications } = req.body;
    const sql = "UPDATE checkups SET details=?, occupation=?, checkup_date=?, notes=?, address=?, mobile=?, complications=? WHERE id=?";
    db.query(sql, [details, occupation, checkupDate, notes, address, mobile, complications, checkupId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Checkup record updated successfully" });
    });
});

// Delete Checkup Record
router.delete("/checkup/:id", (req, res) => {
    const checkupId = req.params.id;
    db.query("DdELETE FROM checkups WHERE id=?", [checkupId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Checkup record deleted successfully" });
    });
});



module.exports = router;
