// ==========================================
// ADD PRODUCT TO CART
// ==========================================

function addToCart(name, price) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let existingProduct = cart.find(function(product) {
        return product.name === name;
    });

    if (existingProduct) {

        existingProduct.quantity =
            (existingProduct.quantity || 1) + 1;

    } else {

        let product = {
            name: name,
            price: Number(price),
            quantity: 1
        };

        cart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(name + " has been added to your cart!");

    displayCart();
}


// ==========================================
// DISPLAY CART
// ==========================================

function displayCart() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let cartItems = document.getElementById("cart-items");
    let cartTotal = document.getElementById("cart-total");

    if (!cartItems || !cartTotal) {
        return;
    }

    if (cart.length === 0) {

        cartItems.innerHTML = "<p>Your cart is empty.</p>";

        cartTotal.textContent = "Total: Ksh 0";

        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(function(product, index) {

        let quantity = product.quantity || 1;

        let subtotal =
            Number(product.price) * quantity;

        total += subtotal;

        let item = document.createElement("div");

        item.className = "cart-item";

        item.innerHTML = `

            <h3>${product.name}</h3>

            <p>
                Price: Ksh ${Number(product.price).toLocaleString()}
            </p>

            <div class="quantity-controls">

                <button onclick="decreaseQuantity(${index})">
                    −
                </button>

                <span>
                    ${quantity}
                </span>

                <button onclick="increaseQuantity(${index})">
                    +
                </button>

            </div>

            <p>
                Subtotal: Ksh ${subtotal.toLocaleString()}
            </p>

            <button onclick="removeFromCart(${index})">
                Remove
            </button>

            <hr>
        `;

        cartItems.appendChild(item);
    });

    cartTotal.textContent =
        "Total: Ksh " + total.toLocaleString();
}


function increaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].quantity =
        (cart[index].quantity || 1) + 1;

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


function decreaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].quantity =
        (cart[index].quantity || 1) - 1;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


function removeFromCart(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart.splice(index, 1);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


// ==========================================
// LOAD PRODUCTS FROM MYSQL
// ==========================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "https://mini-store-production-512b.up.railway.app/api/products"
            );

        const products =
            await response.json();

        const productsContainer =
            document.getElementById(
                "products-container"
            );

        if (!productsContainer) {
            return;
        }

        productsContainer.innerHTML = "";

        products.forEach(function(product) {

            const productCard =
                document.createElement("div");

            productCard.className =
                "product-card";

            productCard.innerHTML = `

                <div class="product-image">
                    🛍️
                </div>

                <h2>
                    ${product.name}
                </h2>

                <p>
                    ${product.description}
                </p>

                <h3>
                    Ksh ${Number(product.price).toLocaleString()}
                </h3>

                <button
                    onclick="addToCart('${product.name}', ${product.price})">
                    Add to Cart
                </button>

            `;

            productsContainer.appendChild(
                productCard
            );
        });

    } catch (error) {

        console.error(
            "Failed to load products:",
            error
        );
    }
}


// ==========================================
// ADD PRODUCT FORM
// ==========================================

const productForm =
    document.getElementById("product-form");

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value;

            const description =
                document.getElementById("description").value;

            const price =
                document.getElementById("price").value;

            try {

                const response =
                    await fetch(
                        "https://mini-store-production-512b.up.railway.app/api/products",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                description: description,
                                price: price
                            })
                        }
                    );

                const data =
                    await response.json();

                const message =
                    document.getElementById("message");

                if (response.ok) {

                    message.textContent =
                        data.message;

                    productForm.reset();

                } else {

                    message.textContent =
                        "Failed to add product.";
                }

            } catch (error) {

                console.error(
                    "Error adding product:",
                    error
                );

                document.getElementById(
                    "message"
                ).textContent =
                    "Could not connect to the server.";
            }
        }
    );
}


// ==========================================
// CHECKOUT FORM
// ==========================================

const checkoutForm =
    document.getElementById("checkout-form");

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "customer-name"
                ).value;

            const email =
                document.getElementById(
                    "customer-email"
                ).value;

            const phone =
                document.getElementById(
                    "customer-phone"
                ).value;

            const address =
                document.getElementById(
                    "customer-address"
                ).value;

            const cart =
                JSON.parse(
                    localStorage.getItem("cart")
                ) || [];

            const message =
                document.getElementById(
                    "checkout-message"
                );

            if (cart.length === 0) {

                message.textContent =
                    "Your cart is empty.";

                return;
            }

            try {

                const response =
                    await fetch(
                        "https://mini-store-production-512b.up.railway.app/api/orders",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                customerName: name,

                                customerEmail: email,

                                customerPhone: phone,

                                deliveryAddress: address,

                                cart: cart

                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.ok) {

                    localStorage.setItem(
                        "lastOrderId",
                        data.orderId
                    );

                    localStorage.setItem(
                        "lastOrderEmail",
                        email
                    );

                    localStorage.removeItem(
                        "cart"
                    );

                    window.location.href =
                        "order-confirmation.html";

                } else {

                    message.textContent =
                        data.error ||
                        "Failed to place order.";
                }

            } catch (error) {

                console.error(
                    "Checkout error:",
                    error
                );

                message.textContent =
                    "Could not connect to the server.";
            }
        }
    );
}


// ==========================================
// LOAD ADMIN ORDERS
// ==========================================

async function loadOrders() {

    const container =
        document.getElementById(
            "orders-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "<p class='loading-orders'>Loading orders...</p>";

    try {

        const response =
            await fetch(
                "https://mini-store-production-512b.up.railway.app/api/orders",
                {
                    headers: {
                        "Authorization":
                            "Bearer " +
                            localStorage.getItem("adminToken")
                    }
                }
            );

        const orders =
            await response.json();

        if (!response.ok) {

            container.innerHTML =
                "<p>Could not load orders.</p>";

            return;
        }

        const totalOrders =
            document.getElementById(
                "total-orders"
            );

        const pendingOrders =
            document.getElementById(
                "pending-orders"
            );

        const processingOrders =
            document.getElementById(
                "processing-orders"
            );

        const deliveredOrders =
            document.getElementById(
                "delivered-orders"
            );

        if (totalOrders) {

            totalOrders.textContent =
                orders.length;
        }

        if (pendingOrders) {

            pendingOrders.textContent =
                orders.filter(order =>
                    order.status === "Pending"
                ).length;
        }

        if (processingOrders) {

            processingOrders.textContent =
                orders.filter(order =>
                    order.status === "Processing"
                ).length;
        }

        if (deliveredOrders) {

            deliveredOrders.textContent =
                orders.filter(order =>
                    order.status === "Delivered"
                ).length;
        }

        if (orders.length === 0) {

            container.innerHTML = `

                <div class="order-card">

                    <h2>
                        No Orders Yet
                    </h2>

                    <p>
                        Customer orders will appear here
                        when they place an order.
                    </p>

                </div>

            `;

            return;
        }

        let ordersHTML = "";

        orders.forEach(function(order) {

            let productsHTML = "";

            if (
                order.items &&
                order.items.length > 0
            ) {

                order.items.forEach(
                    function(item) {

                        productsHTML += `

                            <div class="order-product">

                                <span>
                                    ${item.product_name}
                                    × ${item.quantity}
                                </span>

                                <strong>
                                    Ksh ${Number(
                                        item.subtotal
                                    ).toLocaleString()}
                                </strong>

                            </div>

                        `;
                    }
                );

            } else {

                productsHTML = `
                    <p>No products found.</p>
                `;
            }

            ordersHTML += `

                <div class="order-card">

                    <div class="order-card-header">

                        <h2>
                            Order #${order.id}
                        </h2>

                        <span class="order-status">
                            ${order.status}
                        </span>

                    </div>

                    <div class="order-details">

                        <div class="order-detail">

                            <span>
                                Customer
                            </span>

                            <strong>
                                ${order.customer_name}
                            </strong>

                        </div>

                        <div class="order-detail">

                            <span>
                                Email
                            </span>

                            <strong>
                                ${order.customer_email}
                            </strong>

                        </div>

                        <div class="order-detail">

                            <span>
                                Phone
                            </span>

                            <strong>
                                ${order.customer_phone}
                            </strong>

                        </div>

                        <div class="order-detail">

                            <span>
                                Order Date
                            </span>

                            <strong>
                                ${new Date(
                                    order.order_date
                                ).toLocaleString()}
                            </strong>

                        </div>

                    </div>

                    <div class="order-detail">

                        <span>
                            Delivery Address
                        </span>

                        <strong>
                            ${order.delivery_address}
                        </strong>

                    </div>

                    <div class="order-products">

                        <h3>
                            Products
                        </h3>

                        ${productsHTML}

                    </div>

                    <div class="order-total">

                        Total:
                        Ksh ${Number(
                            order.total_amount
                        ).toLocaleString()}

                    </div>

                    <div class="order-actions">

                        <label>
                            Update Status:
                        </label>

                        <select
                            onchange="updateOrderStatus(
                                ${order.id},
                                this.value
                            )"
                        >

                            <option
                                value="Pending"
                                ${order.status === "Pending"
                                    ? "selected"
                                    : ""}
                            >
                                Pending
                            </option>

                            <option
                                value="Processing"
                                ${order.status === "Processing"
                                    ? "selected"
                                    : ""}
                            >
                                Processing
                            </option>

                            <option
                                value="Shipped"
                                ${order.status === "Shipped"
                                    ? "selected"
                                    : ""}
                            >
                                Shipped
                            </option>

                            <option
                                value="Delivered"
                                ${order.status === "Delivered"
                                    ? "selected"
                                    : ""}
                            >
                                Delivered
                            </option>

                        </select>

                    </div>

                </div>

            `;
        });

        container.innerHTML =
            ordersHTML;

    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );

        container.innerHTML = `

            <div class="order-card">

                <h2>
                    Could not load orders
                </h2>

                <p>
                    Please make sure the Mini Store
                    backend is running.
                </p>

            </div>

        `;
    }
}


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

async function updateOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `https://mini-store-production-512b.up.railway.app/api/orders/${orderId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",

                        "Authorization":
                            "Bearer " +
                            localStorage.getItem("adminToken")
                    },

                    body: JSON.stringify({
                        status: status
                    })
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(
                "Order status updated to " +
                status
            );

        } else {

            alert(
                data.error ||
                "Failed to update status"
            );
        }

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Could not connect to the server."
        );
    }
}


// ==========================================
// DISPLAY CHECKOUT SUMMARY
// ==========================================

function displayCheckoutSummary() {

    const checkoutItems =
        document.getElementById(
            "checkout-items"
        );

    const checkoutTotal =
        document.getElementById(
            "checkout-total"
        );

    if (!checkoutItems ||
        !checkoutTotal) {

        return;
    }

    let cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

    if (cart.length === 0) {

        checkoutItems.innerHTML =
            "<p>Your cart is empty.</p>";

        checkoutTotal.textContent =
            "Total: Ksh 0";

        return;
    }

    checkoutItems.innerHTML = "";

    let total = 0;

    cart.forEach(function(product) {

        const quantity =
            product.quantity || 1;

        const price =
            Number(product.price);

        const subtotal =
            price * quantity;

        total += subtotal;

        const item =
            document.createElement("div");

        item.innerHTML = `

            <p>

                <strong>
                    ${product.name}
                </strong>

                -

                Ksh ${price.toLocaleString()}

                × ${quantity}

                =

                Ksh ${subtotal.toLocaleString()}

            </p>

        `;

        checkoutItems.appendChild(item);
    });

    checkoutTotal.textContent =
        "Total: Ksh " +
        total.toLocaleString();
}


// ==========================================
// ORDER CONFIRMATION
// ==========================================

async function loadOrderConfirmation() {

    const confirmationDetails =
        document.getElementById(
            "confirmation-details"
        );

    if (!confirmationDetails) {
        return;
    }

    const orderId =
        localStorage.getItem(
            "lastOrderId"
        );

    const email =
        localStorage.getItem(
            "lastOrderEmail"
        );

    if (!orderId || !email) {

        confirmationDetails.innerHTML = `

            <p>
                Order information could not be found.
            </p>

        `;

        return;
    }

    try {

        const response =
            await fetch(
                `https://mini-store-production-512b.up.railway.app/api/orders/${orderId}?email=${encodeURIComponent(email)}`
            );

        const order =
            await response.json();

        if (!response.ok) {

            confirmationDetails.innerHTML = `

                <p>
                    ${order.error}
                </p>

            `;

            return;
        }

        let itemsHTML = "";

        order.items.forEach(
            function(item) {

                itemsHTML += `

                    <p>

                        <strong>
                            ${item.product_name}
                        </strong>

                        × ${item.quantity}

                        —

                        Ksh ${Number(
                            item.subtotal
                        ).toLocaleString()}

                    </p>

                `;
            }
        );

        confirmationDetails.innerHTML = `

            <h2>
                Order #${order.id}
            </h2>

            <p>

                <strong>
                    Customer:
                </strong>

                ${order.customer_name}

            </p>

            <h3>
                Status: ${order.status}
            </h3>

            <h3>
                Products Ordered
            </h3>

            ${itemsHTML}

            <h2>

                Total:

                Ksh ${Number(
                    order.total_amount
                ).toLocaleString()}

            </h2>

            <p>

                <strong>
                    Delivery Address:
                </strong>

                ${order.delivery_address}

            </p>

            <p>

                <strong>
                    Order Date:
                </strong>

                ${new Date(
                    order.order_date
                ).toLocaleString()}

            </p>

        `;

    } catch (error) {

        console.error(
            "Confirmation error:",
            error
        );

        confirmationDetails.innerHTML = `

            <p>
                Could not connect to the server.
            </p>

        `;
    }
}


// ==========================================
// FIND CUSTOMER ORDERS BY EMAIL OR PHONE
// ==========================================

const trackOrderForm =
    document.getElementById(
        "track-order-form"
    );

if (trackOrderForm) {

    trackOrderForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const contact =
                document.getElementById(
                    "tracking-contact"
                ).value.trim();

            const result =
                document.getElementById(
                    "tracking-result"
                );

            result.innerHTML =
                "<p>Searching for your orders...</p>";

            try {

                const response =
                    await fetch(
                        "https://mini-store-production-512b.up.railway.app/api/orders/customer",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                contact: contact
                            })
                        }
                    );

                const orders =
                    await response.json();

                if (!response.ok) {

                    result.innerHTML = `

                        <p>
                            ${orders.error}
                        </p>

                    `;

                    return;
                }

                if (orders.length === 0) {

                    result.innerHTML = `

                        <p>
                            No orders were found for this
                            email or phone number.
                        </p>

                    `;

                    return;
                }

                let ordersHTML = `

                    <h2>
                        Your Orders
                    </h2>

                `;

                orders.forEach(
                    function(order) {

                        ordersHTML += `

                            <div class="product-card">

                                <h2>
                                    Order #${order.id}
                                </h2>

                                <p>

                                    <strong>
                                        Date:
                                    </strong>

                                    ${new Date(
                                        order.order_date
                                    ).toLocaleString()}

                                </p>

                                <p>

                                    <strong>
                                        Total:
                                    </strong>

                                    Ksh ${Number(
                                        order.total_amount
                                    ).toLocaleString()}

                                </p>

                                <p>

                                    <strong>
                                        Status:
                                    </strong>

                                    ${order.status}

                                </p>

                                <button
                                    onclick="trackSelectedOrder(
                                        ${order.id},
                                        '${contact.replace(
                                            /'/g,
                                            "\\'"
                                        )}'
                                    )"
                                >
                                    Track This Order
                                </button>

                            </div>

                        `;
                    }
                );

                result.innerHTML =
                    ordersHTML;

            } catch (error) {

                console.error(
                    "Find orders error:",
                    error
                );

                result.innerHTML = `

                    <p>
                        Could not connect to the server.
                    </p>

                `;
            }
        }
    );
}


// ==========================================
// TRACK SELECTED ORDER
// ==========================================

async function trackSelectedOrder(
    orderId,
    contact
) {

    const result =
        document.getElementById(
            "tracking-result"
        );

    result.innerHTML =
        "<p>Loading order details...</p>";

    try {

        const isEmail =
            contact.includes("@");

        const parameter =
            isEmail
                ? `email=${encodeURIComponent(contact)}`
                : `phone=${encodeURIComponent(contact)}`;

        const response =
            await fetch(
                `https://mini-store-production-512b.up.railway.app/api/orders/${orderId}?${parameter}`
            );

        const order =
            await response.json();

        if (!response.ok) {

            result.innerHTML = `

                <p>
                    ${order.error}
                </p>

            `;

            return;
        }

        let itemsHTML = "";

        order.items.forEach(
            function(item) {

                itemsHTML += `

                    <p>

                        <strong>
                            ${item.product_name}
                        </strong>

                        × ${item.quantity}

                        —

                        Ksh ${Number(
                            item.subtotal
                        ).toLocaleString()}

                    </p>

                `;
            }
        );

        result.innerHTML = `

            <div class="product-card">

                <h2>
                    Order #${order.id}
                </h2>

                <h3>
                    Order Status: ${order.status}
                </h3>

                <div class="order-progress">

                    <div class="status-step ${
                        order.status === "Pending" ||
                        order.status === "Processing" ||
                        order.status === "Shipped" ||
                        order.status === "Delivered"
                            ? "active"
                            : ""
                    }">

                        <span>
                            1
                        </span>

                        <p>
                            Pending
                        </p>

                    </div>

                    <div class="status-line"></div>

                    <div class="status-step ${
                        order.status === "Processing" ||
                        order.status === "Shipped" ||
                        order.status === "Delivered"
                            ? "active"
                            : ""
                    }">

                        <span>
                            2
                        </span>

                        <p>
                            Processing
                        </p>

                    </div>

                    <div class="status-line"></div>

                    <div class="status-step ${
                        order.status === "Shipped" ||
                        order.status === "Delivered"
                            ? "active"
                            : ""
                    }">

                        <span>
                            3
                        </span>

                        <p>
                            Shipped
                        </p>

                    </div>

                    <div class="status-line"></div>

                    <div class="status-step ${
                        order.status === "Delivered"
                            ? "active"
                            : ""
                    }">

                        <span>
                            4
                        </span>

                        <p>
                            Delivered
                        </p>

                    </div>

                </div>

                <p>

                    <strong>
                        Customer:
                    </strong>

                    ${order.customer_name}

                </p>

                <p>

                    <strong>
                        Delivery Address:
                    </strong>

                    ${order.delivery_address}

                </p>

                <h3>
                    Products
                </h3>

                ${itemsHTML}

                <h2>

                    Total:

                    Ksh ${Number(
                        order.total_amount
                    ).toLocaleString()}

                </h2>

                <p>

                    <strong>
                        Order Date:
                    </strong>

                    ${new Date(
                        order.order_date
                    ).toLocaleString()}

                </p>

                <button onclick="location.reload()">
                    Back to My Orders
                </button>

            </div>

        `;

    } catch (error) {

        console.error(
            "Tracking error:",
            error
        );

        result.innerHTML = `

            <p>
                Could not connect to the server.
            </p>

        `;
    }
}


// ==========================================
// RUN FUNCTIONS
// ==========================================

loadProducts();

displayCart();

displayCheckoutSummary();

loadOrders();

loadOrderConfirmation();


// ==========================================
// CUSTOMER CONTACT FORM
// ==========================================

const contactForm =
    document.getElementById(
        "contact-form"
    );

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "contact-name"
                ).value.trim();

            const email =
                document.getElementById(
                    "contact-email"
                ).value.trim();

            const subject =
                document.getElementById(
                    "contact-subject"
                ).value.trim();

            const message =
                document.getElementById(
                    "contact-message"
                ).value.trim();

            const responseMessage =
                document.getElementById(
                    "contact-response"
                );

            responseMessage.textContent =
                "Sending message...";

            try {

                const response =
                    await fetch(
                        "https://mini-store-production-512b.up.railway.app/api/contact",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                name: name,

                                email: email,

                                subject: subject,

                                message: message

                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    responseMessage.textContent =
                        data.error ||
                        "Failed to send message.";

                    return;
                }

                responseMessage.textContent =
                    data.message;

                contactForm.reset();

            } catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );

                responseMessage.textContent =
                    "Could not connect to the server.";
            }
        }
    );
}


// ==========================================
// LOAD CUSTOMER MESSAGES
// ==========================================

async function loadCustomerMessages() {

    const container =
        document.getElementById(
            "messages-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "<p>Loading customer messages...</p>";

    try {

       const response =
    await fetch(
        "https://mini-store-production-512b.up.railway.app/api/contact",
        {
            headers: {
                "Authorization":
                    "Bearer " +
                    localStorage.getItem("adminToken")
            }
        }
    );

        const messages =
            await response.json();

        if (!response.ok) {

            container.innerHTML = `

                <p>
                    ${messages.error}
                </p>

            `;

            return;
        }

        if (messages.length === 0) {

            container.innerHTML = `

                <div class="product-card">

                    <h2>
                        No Messages
                    </h2>

                    <p>
                        There are currently no customer messages.
                    </p>

                </div>

            `;

            return;
        }

        let messagesHTML = "";

        messages.forEach(
            function(message) {

                messagesHTML += `

                    <div class="product-card">

                        <h2>
                            ${message.subject}
                        </h2>

                        <p>

                            <strong>
                                Customer:
                            </strong>

                            ${message.customer_name}

                        </p>

                        <p>

                            <strong>
                                Email:
                            </strong>

                            ${message.customer_email}

                        </p>

                        <p>

                            <strong>
                                Date:
                            </strong>

                            ${new Date(
                                message.message_date
                            ).toLocaleString()}

                        </p>

                        <hr>

                        <p>

                            <strong>
                                Message:
                            </strong>

                        </p>

                        <p>
                            ${message.message}
                        </p>

                    </div>

                `;
            }
        );

        container.innerHTML =
            messagesHTML;

    } catch (error) {

        console.error(
            "Customer messages error:",
            error
        );

        container.innerHTML = `

            <p>
                Could not connect to the server.
            </p>

        `;
    }
}


// ==========================================
// ADMIN LOGIN
// ==========================================

const adminLoginForm =
    document.getElementById(
        "admin-login-form"
    );

if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const username =
                document.getElementById(
                    "admin-username"
                ).value.trim();

            const password =
                document.getElementById(
                    "admin-password"
                ).value;

            const message =
                document.getElementById(
                    "admin-login-message"
                );

            message.textContent =
                "Logging in...";

            try {

                const response =
                    await fetch(
                        "https://mini-store-production-512b.up.railway.app/api/admin/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                username: username,
                                password: password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    message.textContent =
                        data.error ||
                        "Login failed.";

                    return;
                }

                localStorage.setItem(
                    "adminToken",
                    data.token
                );

                localStorage.setItem(
                    "adminUsername",
                    data.username
                );

                window.location.href =
                    "admin-orders.html";

            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );

                message.textContent =
                    "Could not connect to the server.";
            }
        }
    );
}


// ==========================================
// ADMIN LOGOUT
// ==========================================

function adminLogout() {

    localStorage.removeItem(
        "adminToken"
    );

    localStorage.removeItem(
        "adminUsername"
    );

    window.location.href =
        "admin-login.html";
}