
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "zarvisgenix.mysql.database.azure.com",
  user: "hr_genix",
  password: "OWoXzci3cxU5wcH",
  database: "genix",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit if the database connection 
  }
  console.log("Connected to MySQL");
});

module.exports = db;
