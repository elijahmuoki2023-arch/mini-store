require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateAdmin(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            error: "Authentication required"
        });
    }

    const token =
        authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            error: "Authentication token missing"
        });
    }

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            error: "Invalid or expired authentication token"
        });
    }
}


// ==========================================
// ADMIN LOGIN
// ==========================================

app.post("/api/admin/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    if (!username || !password) {

        return res.status(400).json({
            error: "Username and password are required"
        });
    }

    const sql = `
        SELECT
            id,
            username,
            password
        FROM admins
        WHERE username = ?
    `;

    db.query(
        sql,
        [username],
        async (err, admins) => {

            if (err) {

                console.error(
                    "Admin login database error:",
                    err
                );

                return res.status(500).json({
                    error: "Server error"
                });
            }

            if (admins.length === 0) {

                return res.status(401).json({
                    error: "Invalid username or password"
                });
            }

            const admin = admins[0];

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    admin.password
                );

            if (!passwordMatch) {

                return res.status(401).json({
                    error: "Invalid username or password"
                });
            }

            const token =
                jwt.sign(
                    {
                        id: admin.id,
                        username: admin.username
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

            res.json({
                message: "Login successful",
                token: token,
                username: admin.username
            });
        }
    );
});


const PORT = 3000;


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.send("Mini Store Backend is running!");
});


// ==========================================
// GET PRODUCTS
// ==========================================

app.get("/api/products", (req, res) => {

    const sql = "SELECT * FROM products";

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "Database query failed:",
                err
            );

            return res.status(500).json({
                error: "Database error"
            });
        }

        res.json(results);
    });
});


// ==========================================
// POST PRODUCT
// ==========================================

app.post("/api/products", (req, res) => {

    const {
        name,
        description,
        price
    } = req.body;

    const sql = `
        INSERT INTO products
        (
            name,
            description,
            price
        )
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            description,
            price
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "Failed to add product:",
                    err
                );

                return res.status(500).json({
                    error: "Failed to add product"
                });
            }

            res.json({
                message: "Product added successfully",
                productId: result.insertId
            });
        }
    );
});


// ==========================================
// CREATE NEW ORDER
// ==========================================

app.post("/api/orders", (req, res) => {

    const {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        cart
    } = req.body;

    // Check that the cart is not empty
    if (!cart || cart.length === 0) {

        return res.status(400).json({
            error: "Cart is empty"
        });
    }

    // Calculate total amount
    let totalAmount = 0;

    cart.forEach(product => {

        totalAmount +=
            Number(product.price) *
            Number(product.quantity || 1);
    });

    // Insert the order
    const orderSql = `
        INSERT INTO orders
        (
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            total_amount
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        orderSql,
        [
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            totalAmount
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "Failed to create order:",
                    err
                );

                return res.status(500).json({
                    error: "Failed to create order"
                });
            }

            const orderId = result.insertId;

            // Insert products into order_items
            const itemSql = `
                INSERT INTO order_items
                (
                    order_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                )
                VALUES ?
            `;

            const items = cart.map(product => {

                const quantity =
                    Number(
                        product.quantity || 1
                    );

                const price =
                    Number(product.price);

                const subtotal =
                    price * quantity;

                return [
                    orderId,
                    product.name,
                    price,
                    quantity,
                    subtotal
                ];
            });

            db.query(
                itemSql,
                [items],
                (err) => {

                    if (err) {

                        console.error(
                            "Failed to save order items:",
                            err
                        );

                        return res.status(500).json({
                            error: "Failed to save order items"
                        });
                    }

                    res.json({
                        message:
                            "Order placed successfully",
                        orderId: orderId,
                        total: totalAmount
                    });
                }
            );
        }
    );
});


// ==========================================
// GET ONE ORDER - VERIFY EMAIL OR PHONE
// ==========================================

app.get("/api/orders/:id", (req, res) => {

    const orderId = req.params.id;

    const email = req.query.email;
    const phone = req.query.phone;

    if (!email && !phone) {

        return res.status(400).json({
            error:
                "Email or phone number is required"
        });
    }

    const orderSql = `
        SELECT
            id,
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            total_amount,
            status,
            order_date
        FROM orders
        WHERE id = ?
        AND (
            customer_email = ?
            OR customer_phone = ?
        )
    `;

    db.query(
        orderSql,
        [
            orderId,
            email || "",
            phone || ""
        ],
        (err, orders) => {

            if (err) {

                console.error(
                    "Failed to retrieve order:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to retrieve order"
                });
            }

            if (orders.length === 0) {

                return res.status(404).json({
                    error: "Order not found"
                });
            }

            const order = orders[0];

            const itemsSql = `
                SELECT
                    product_name,
                    price,
                    quantity,
                    subtotal
                FROM order_items
                WHERE order_id = ?
            `;

            db.query(
                itemsSql,
                [orderId],
                (err, items) => {

                    if (err) {

                        console.error(
                            "Failed to retrieve order items:",
                            err
                        );

                        return res.status(500).json({
                            error:
                                "Failed to retrieve order items"
                        });
                    }

                    order.items = items;

                    res.json(order);
                }
            );
        }
    );
});


// ==========================================
// UPDATE ORDER STATUS
// PROTECTED - ADMIN ONLY
// ==========================================

app.put(
    "/api/orders/:id/status",
    authenticateAdmin,
    (req, res) => {

        const orderId = req.params.id;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                error: "Invalid order status"
            });
        }

        const sql = `
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [status, orderId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Failed to update order status:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to update order status"
                    });
                }

                if (result.affectedRows === 0) {

                    return res.status(404).json({
                        error: "Order not found"
                    });
                }

                res.json({
                    message:
                        "Order status updated successfully"
                });
            }
        );
    }
);


// ==========================================
// GET CUSTOMER ORDERS BY EMAIL OR PHONE
// ==========================================

app.post(
    "/api/orders/customer",
    (req, res) => {

        const { contact } = req.body;

        if (!contact) {

            return res.status(400).json({
                error:
                    "Email or phone number is required"
            });
        }

        const sql = `
            SELECT
                id,
                customer_name,
                customer_email,
                customer_phone,
                total_amount,
                status,
                order_date
            FROM orders
            WHERE customer_email = ?
            OR customer_phone = ?
            ORDER BY order_date DESC
        `;

        db.query(
            sql,
            [contact, contact],
            (err, orders) => {

                if (err) {

                    console.error(
                        "Failed to retrieve customer orders:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to retrieve orders"
                    });
                }

                res.json(orders);
            }
        );
    }
);


// ==========================================
// GET ONE ORDER - VERIFY CUSTOMER EMAIL
// ==========================================

app.get(
    "/api/orders/:id",
    (req, res) => {

        const orderId = req.params.id;
        const customerEmail =
            req.query.email;

        if (!customerEmail) {

            return res.status(400).json({
                error: "Email is required"
            });
        }

        const orderSql = `
            SELECT
                id,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                total_amount,
                status,
                order_date
            FROM orders
            WHERE id = ?
            AND customer_email = ?
        `;

        db.query(
            orderSql,
            [
                orderId,
                customerEmail
            ],
            (err, orders) => {

                if (err) {

                    console.error(
                        "Failed to retrieve order:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to retrieve order"
                    });
                }

                if (orders.length === 0) {

                    return res.status(404).json({
                        error:
                            "Order not found or email does not match"
                    });
                }

                const order = orders[0];

                const itemsSql = `
                    SELECT
                        product_name,
                        price,
                        quantity,
                        subtotal
                    FROM order_items
                    WHERE order_id = ?
                `;

                db.query(
                    itemsSql,
                    [orderId],
                    (err, items) => {

                        if (err) {

                            console.error(
                                "Failed to retrieve order items:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to retrieve order items"
                            });
                        }

                        order.items = items;

                        res.json(order);
                    }
                );
            }
        );
    }
);


// ==========================================
// GET ALL ORDERS WITH ORDER ITEMS
// PROTECTED - ADMIN ONLY
// ==========================================

app.get(
    "/api/orders",
    authenticateAdmin,
    (req, res) => {

        const ordersSql = `
            SELECT
                id,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                total_amount,
                status,
                order_date
            FROM orders
            ORDER BY order_date DESC
        `;

        db.query(
            ordersSql,
            (err, orders) => {

                if (err) {

                    console.error(
                        "Failed to retrieve orders:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to retrieve orders"
                    });
                }

                if (orders.length === 0) {

                    return res.json([]);
                }

                const orderIds =
                    orders.map(
                        order => order.id
                    );

                const itemsSql = `
                    SELECT
                        order_id,
                        product_name,
                        price,
                        quantity,
                        subtotal
                    FROM order_items
                    WHERE order_id IN (?)
                `;

                db.query(
                    itemsSql,
                    [orderIds],
                    (err, items) => {

                        if (err) {

                            console.error(
                                "Failed to retrieve order items:",
                                err
                            );

                            return res.status(500).json({
                                error:
                                    "Failed to retrieve order items"
                            });
                        }

                        orders.forEach(order => {

                            order.items =
                                items.filter(
                                    item =>
                                        item.order_id ===
                                        order.id
                                );

                        });

                        res.json(orders);
                    }
                );
            }
        );
    }
);


// ==========================================
// CUSTOMER CONTACT MESSAGE
// PUBLIC
// ==========================================

app.post(
    "/api/contact",
    (req, res) => {

        const {
            name,
            email,
            subject,
            message
        } = req.body;

        if (
            !name ||
            !email ||
            !subject ||
            !message
        ) {

            return res.status(400).json({
                error:
                    "All fields are required"
            });
        }

        const sql = `
            INSERT INTO customer_messages
            (
                customer_name,
                customer_email,
                subject,
                message
            )
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                name,
                email,
                subject,
                message
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "Failed to save customer message:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to send message"
                    });
                }

                res.json({
                    message:
                        "Your message has been sent successfully!",
                    messageId:
                        result.insertId
                });
            }
        );
    }
);


// ==========================================
// GET CUSTOMER MESSAGES
// PROTECTED - ADMIN ONLY
// ==========================================

app.get(
    "/api/contact",
    authenticateAdmin,
    (req, res) => {

        const sql = `
            SELECT
                id,
                customer_name,
                customer_email,
                subject,
                message,
                message_date
            FROM customer_messages
            ORDER BY message_date DESC
        `;

        db.query(
            sql,
            (err, messages) => {

                if (err) {

                    console.error(
                        "Failed to retrieve customer messages:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to retrieve customer messages"
                    });
                }

                res.json(messages);
            }
        );
    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
    `Server is running on port ${PORT}`
);
    }
);