const bcrypt = require("bcryptjs");
const db = require("./db");

const username = "admin";
const password = "Admin@123";

bcrypt.hash(password, 10, (err, hashedPassword) => {

    if (err) {
        console.error("Password hashing failed:", err);
        return;
    }

    const sql = `
        INSERT INTO admins (username, password)
        VALUES (?, ?)
    `;

    db.query(
        sql,
        [username, hashedPassword],
        (err, result) => {

            if (err) {
                console.error(
                    "Failed to create admin:",
                    err
                );

                return;
            }

            console.log(
                "Admin account created successfully!"
            );

            console.log(
                "Username: admin"
            );

            console.log(
                "Password: Admin@123"
            );

            process.exit();
        }
    );
});