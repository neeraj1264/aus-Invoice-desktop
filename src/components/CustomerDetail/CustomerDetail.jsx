// CustomerDetail.js
import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { handleScreenshot } from "../Utils/DownloadPng"; // Import the function
import "./Customer.css";
// import { handleScreenshotAsPDF } from "../Utils/DownloadPdf";
import Header from "../header/Header";
import { sendorder, setdata, fetchcustomerdata } from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "bottom-right",
  autoClose: 2000,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};
const CustomerDetail = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [productsToSend, setproductsToSend] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const getdeliveryCharge = localStorage.getItem("deliveryCharge");
  const deliveryChargeAmount = parseFloat(getdeliveryCharge) || 0;
  // State to hold all saved customers for auto-fill
  const [savedCustomers, setSavedCustomers] = useState([]);
  // State to hold suggestions based on current phone input
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);

  const invoiceRef = useRef(); // Reference to the hidden invoice content
  const navigate = useNavigate();

  useEffect(() => {
    // Load selected products and total amount from localStorage
    const storedProducts =
      JSON.parse(localStorage.getItem("productsToSend")) || [];
    const storedAmount = parseFloat(localStorage.getItem("totalAmount")) || 0;
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(savedOrders);

    setproductsToSend(storedProducts);
    setTotalAmount(storedAmount);
  }, []);

  useEffect(() => {
    // Fetch customer data from API (or use localStorage fallback)
    const fetchData = async () => {
      try {
        const response = await fetchcustomerdata();
        const customersArray = Array.isArray(response)
          ? response
          : response.data || [];
        setSavedCustomers(customersArray);
      } catch (error) {
        console.error("Error fetching customer data:", error.message);
        const localStorageCustomers =
          JSON.parse(localStorage.getItem("customers")) || [];
        if (localStorageCustomers.length > 0) {
          setSavedCustomers(localStorageCustomers);
        }
      }
    };
    fetchData();
  }, []);

  // Update suggestions based on current phone input (prefix match)
  useEffect(() => {
    if (customerPhone.trim().length === 10) {
      setPhoneSuggestions([]);
    } else if (customerPhone.trim() !== "") {
      const suggestions = savedCustomers.filter((customer) =>
        String(customer.phone).trim().startsWith(customerPhone.trim())
      );
      setPhoneSuggestions(suggestions);
    } else {
      setPhoneSuggestions([]);
    }
  }, [customerPhone, savedCustomers]);

  // When a suggestion is clicked, fill the fields and clear suggestions.
  const handleSuggestionClick = (customer) => {
    setCustomerPhone(String(customer.phone));
    setCustomerName(customer.name);
    setCustomerAddress(customer.address);
    setPhoneSuggestions([]);
  };

  const handleSendToWhatsApp = () => {
    const restaurantName = "Urban Pizzeria";

    const currentTotalAmount =
      calculateTotalPrice(productsToSend) + deliveryChargeAmount;

    // Map product details into a formatted string
    const productDetails = productsToSend
      .map((product) => {
        const quantity = product.quantity || 1;
        const size = product.size ? ` ${product.size}` : ""; // Include size only if it exists
        return `${quantity}.0 x ${product.name}${size} = ₹${
          product.price * quantity
        }`;
      })
      .join("\n"); // Join product details with a single newline

    // Check if deliveryCharge exists
    const serviceChargeText = deliveryCharge
      ? `Service Charge: ₹${deliveryChargeAmount}` // No extra newline
      : "";

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Construct the WhatsApp message
    const message = encodeURIComponent(
      `*🍔🍟🍕 ${restaurantName} 🍕🍟🍔*\n\n` +
        `Order: *${orderId}*` +
        (customerPhone ? `\nPhone: *${customerPhone}*` : "") +
        (customerName ? `\nName: *${customerName}*` : "") +
        (customerAddress ? `\nAddress: *${customerAddress}*` : "") +
        `\nAmount: *₹${currentTotalAmount}*` +
        `\n\n----------item----------\n${productDetails}` + // No extra newline here
        (serviceChargeText ? `\n${serviceChargeText}` : "") // Add only if serviceChargeText exists
    );

    const phoneNumber = customerPhone;

    const formattedPhoneNumber = phoneNumber
      ? `+91${phoneNumber}` // Prepend +91 for India if the phone number is present
      : phoneNumber;

    if (phoneNumber) {
      window.open(
        `https://wa.me/${formattedPhoneNumber}?text=${message}`,
        "_blank"
      );
    } else {
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSendClick = async () => {
    const productsToSend = JSON.parse(localStorage.getItem("productsToSend"));
    if (!productsToSend || productsToSend.length === 0) {
      toast.error("Please add product before proceed", toastOptions);
      return; // Exit the function early
    }

    setShowPopup(true);

    if (deliveryCharge) {
      localStorage.setItem("deliveryCharge", deliveryCharge);
    }

    const orderId = `order_${Date.now()}`;

    // Create an order object
    const order = {
      id: orderId,
      products: productsToSend,
      totalAmount: calculateTotalPrice(productsToSend) + deliveryChargeAmount,
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      timestamp: new Date().toISOString(),
    };

    const customerDataObject = {
      id: orderId,
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      timestamp: new Date().toISOString(),
    };

    // Get the current orders from localStorage
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];

    // Add the new order to the list
    savedOrders.push(order);

    // Save the updated orders back to localStorage
    localStorage.setItem("orders", JSON.stringify(savedOrders));

    try {
      // Send the order to your backend to be saved in MongoDB
      const data = await sendorder(order);
      console.log("Order created:", data);

      // You can clear localStorage or perform any other actions as needed
      // localStorage.removeItem("products"); // Example
    } catch (error) {
      console.error("Error sending order:", error.message);
    }

    try {
      const customerDataResponse = await setdata(customerDataObject);
      if (
        customerDataResponse.message ===
        "Customer already exists, no changes made."
      ) {
        console.log(
          "Customer already exists in the database, no need to add again."
        );
      } else {
        console.log("Customer Data Added", customerDataResponse);
      }
    } catch (error) {
      console.error("Error sending customer data:", error.message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);

    // Navigate to the invoice page
    navigate("/invoice");

    window.location.reload();
  };

  const handlePngDownload = () => {
    // Show the hidden invoice, take the screenshot, and then hide it again
    invoiceRef.current.style.display = "block";
    setTimeout(() => {
      handleScreenshot("mobileinvoice");
      invoiceRef.current.style.display = "none";
    }, 10);
  };

  const convertImageToBase64 = (imagePath) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "Anonymous"; // To handle cross-origin issues if needed
      image.src = imagePath;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = (error) => reject(error);
    });
  };

  const MobilePrint = async () => {
    try {
      // Convert both logo and QR code to Base64
      const logoBase64 = await convertImageToBase64("/logo.png");
      const qrBase64 = await convertImageToBase64("/qr.png");

      const kotContent = document.getElementById("mobileinvoice").innerHTML;

      const newWindow = window.open("", "", "width=600,height=400");
      newWindow.document.write(`
        <html>
          <head>
            <title>KOT</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                margin: 3rem 0;
                padding: 0;
                width: 48mm;
              }
              table {
                width: 94%;
                border-collapse: collapse;
              }
              th, td {
                border: 2px solid black;
                padding: 2px;
                text-align: left;
                font-size: 10px;
                font-weight: bold;
              }
              .total {
                font-size: 13px;
                text-align: left;
                margin-top: 4px;
              }
              .totalAmount {
                font-size: 15px;
                font-weight: 800;
                border: 2px dashed;
                text-align: center;
                background: black;
                color: white;
                padding: 0.4rem;
              }
              .logo {
                display: flex;
                margin: auto;
              }
              .logo img {
                width: 40px;
                height: auto;
              }
              hr {
                border: 2px dashed;
              }
            </style>
          </head>
          <body>
            ${kotContent}
          </body>
        </html>
      `);

      newWindow.document.close();

      newWindow.onload = () => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      };
    } catch (error) {
      console.error("Error generating printable content:", error);
    }
  };

  // Helper function to calculate total price
  const calculateTotalPrice = (products = []) => {
    return products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  // Handle customer phone input validation
  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value;

    // Only allow numeric input and ensure length is <= 10
    if (/^\d*$/.test(phoneValue) && phoneValue.length <= 10) {
      setCustomerPhone(phoneValue);
    }
  };

  const handleRawBTPrint = () => {
    const hasDeliveryCharge = getdeliverycharge !== 0; // Check if delivery charge exists

    const orderWidth = 2;
    const nameWidth = 16; // Set a fixed width for product name
    const priceWidth = 4; // Set a fixed width for price
    const quantityWidth = 2; // Set a fixed width for quantity

    // Helper function to break a product name into multiple lines if needed
    const breakProductName = (name, maxLength) => {
      const lines = [];
      while (name.length > maxLength) {
        lines.push(name.substring(0, maxLength)); // Add a line of the name
        name = name.substring(maxLength); // Remove the part that has been used
      }
      lines.push(name); // Add the last remaining part of the name
      return lines;
    };

    // Map product details into a formatted string with borders
    const productDetails = productsToSend
      .map((product, index) => {
        const orderNumber = `${index + 1}`.padStart(orderWidth, " "); // Format the order number
        const productSize = product.size ? `(${product.size})` : "";

        // Break the product name into multiple lines if it exceeds the fixed width
        const nameLines = breakProductName(
          product.name + " " + productSize,
          nameWidth
        );

        // Format the price and quantity with proper padding
        const paddedPrice = `${product.price}`.padStart(priceWidth, " "); // Pad price to the left
        const paddedQuantity = `${product.quantity}`.padStart(
          quantityWidth,
          " "
        ); // Pad quantity to the left

        // Combine name lines with the proper padding for price and quantity
        const productText = nameLines
          .map((line, index) => {
            if (index === 0) {
              return `${orderNumber}. ${line.padEnd(
                nameWidth,
                " "
              )} ${paddedQuantity} x ${paddedPrice} `;
            } else {
              return `    ${line.padEnd(nameWidth, " ")} ${"".padEnd(
                priceWidth,
                " "
              )} ${"".padEnd(quantityWidth, " ")} `;
            }
          })
          .join(""); // Join the product name lines with a newline

        return productText;
      })
      .join("\n");

    // Add a border for the header
    const header = ` No    Item Name     Qty  price `;
    const separator = `+${"-".repeat(nameWidth + 2)}+${"-".repeat(
      priceWidth + 2
    )}+${"-".repeat(quantityWidth + 2)}+`;
    const dash = `--------------------------------`;
    const totalprice = `${calculateTotalPrice(productsToSend)}`.padStart(
      priceWidth,
      " "
    );
    const delivery = `${getdeliverycharge}`.padStart(priceWidth, " ");
    // Combine header, separator, and product details
    const detailedItems = `\n${dash}\n${header}\n${dash}\n${productDetails}\n${dash}`;

    const invoiceText = `
  \x1B\x61\x01  Pehowa, Haryana, 136128\x1B\x61\x00
  \x1B\x61\x01  Phone: +91 81689-01827\x1B\x61\x00

  \x1B\x61\x01Lal Dawara Mandir Wali Gali,\x0ANear Body Fine Gym Ambala \x0A   Road Pehowa.\x1B\x61\x00

  \x1B\x21\x10-----Invoice Details-----\x1B\x21\x00
  
  Bill No: #${Math.floor(1000 + Math.random() * 9000)}
  Date: ${
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Enables 12-hour format
    })
  }
  Customer: ${customerName || "Guest Customer"}
  Phone: ${customerPhone || "N/A"}
  Address: ${customerAddress || "N/A"}  
  ${detailedItems}
  ${hasDeliveryCharge ? `           Item Total:  ${totalprice} ` : " "}
  ${hasDeliveryCharge ? `       Service Charge:  ${delivery}\n${dash}` : " "}
\x1B\x21\x30\x1B\x34Total: Rs ${
      calculateTotalPrice(productsToSend) + getdeliverycharge
    }/-\x1B\x21\x00\x1B\x35

    Thank You Visit Again!
  ---------------------------
  
       Powered by BillZo
       
  `;

    // Send the content to RawBT (add more parameters if required)
    const encodedText = encodeURIComponent(invoiceText);
    const rawBTUrl = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    // Trigger RawBT
    window.location.href = rawBTUrl;
  };

  const getdeliverycharge = localStorage.getItem("deliveryCharge")
    ? parseFloat(localStorage.getItem("deliveryCharge"))
    : 0; // Default to 0 if not set
  return (
    <div>
      <ToastContainer />
      <Header />
      <div className="cust-inputs" style={{ marginTop: "4rem" }}>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name..."
        />
      </div>
      <div className="cust-inputs">
        <input
          type="text"
          value={customerPhone}
          onChange={handlePhoneChange}
          placeholder="Customer phone..."
        />
      </div>

      {/* Suggestions Dropdown */}
      {phoneSuggestions.length > 0 && (
        <ul
          className="suggestions"
          style={{
            background: "#fff",
            border: "2px solid black",
            zIndex: 10,
            listStyle: "none",
            padding: 0,
            margin: "auto",
            width: "90%",
            maxHeight: "150px",
            overflowY: "auto",
            borderRadius: "1rem",
          }}
        >
          {phoneSuggestions.map((suggestion) => (
            <li
              key={suggestion.phone}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: "0.5rem",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {suggestion.phone} - {suggestion.name}
            </li>
          ))}
        </ul>
      )}

      <div className="cust-inputs">
        <input
          type="text"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="Customer address..."
        />
      </div>
      <div className="cust-inputs">
        <input
          type="number"
          value={deliveryCharge}
          onChange={(e) => setDeliveryCharge(e.target.value)}
          placeholder="Delivery charge..."
        />
      </div>
      {/* mobile print content */}
      <div
        className="invoice-content"
        id="mobileinvoice"
        ref={invoiceRef}
        style={{ display: "none" }}
      >
        <img src="/logo.png" alt="Logo" width={150} className="logo" />
        {/* <h1 style={{ textAlign: "center", margin: 0, fontSize: "25px" }}>
          Urban Pizzeria
        </h1> */}
        <p
          style={{
            textAlign: "center",
            margin: 0,
            fontSize: "14px",
            padding: "0 2px",
          }}
        >
          Lal Dawara Mandir Wali Gali, Near Body Fine Gym Ambala Road Pehowa.
        </p>
        <p style={{ textAlign: "center", margin: 0, fontSize: "14px" }}>
          +91 81689-01827
        </p>
        <hr />
        <h2 style={{ textAlign: "center", margin: 0, fontSize: "20px" }}>
          Invoice Details
        </h2>
        <div className="customer-info">
          <p style={{ fontSize: "12px", margin: "0" }}>
            Bill No:&nbsp;&nbsp;
            {`#${Math.floor(1000 + Math.random() * 9000)}`}{" "}
            {/* Random 6-digit bill number */}
          </p>
          <p style={{ fontSize: "12px", margin: "0" }}>
            Date:&nbsp;&nbsp;&nbsp;&nbsp;
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
              " " +
              new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true, // Enables 12-hour format
              })}
          </p>

          {customerName && (
            <p style={{ fontSize: "12px", margin: "0" }}>
              Customer:&nbsp;{customerName}
            </p>
          )}
          {customerPhone && (
            <p style={{ fontSize: "12px", margin: "0" }}>
              Phone:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{customerPhone}
            </p>
          )}
          {customerAddress && (
            <p style={{ fontSize: "12px", margin: "0 0 1rem 0" }}>
              Address:&nbsp;&nbsp;&nbsp;&nbsp;{customerAddress}
            </p>
          )}
        </div>
        <table>
          <thead>
            <tr className="productname">
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {productsToSend.map((product, index) => (
              <tr key={index} className="productdetail">
                <td>
                  {product.size
                    ? `${product.name} (${product.size})`
                    : product.name}
                </td>
                <td style={{ textAlign: "Center" }}>{product.quantity || 1}</td>
                <td style={{ textAlign: "Center" }}>₹{product.price}</td>
                <td style={{ textAlign: "Center" }}>
                  ₹{product.price * (product.quantity || 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {getdeliverycharge !== 0 && (
          <>
            <div className="total">
              <p style={{ margin: "1rem 0 0 0" }}>
                Item Total{" "}
                <span>
                  ₹{" "}
                  {productsToSend
                    .reduce(
                      (sum, product) =>
                        sum + product.price * (product.quantity || 1),
                      0
                    )
                    .toFixed(2)}
                </span>
              </p>
            </div>
            <div className="total">
              <p style={{ margin: "0" }}>
                Service Charge: <span>₹{getdeliverycharge.toFixed(2)}</span>
              </p>
            </div>
          </>
        )}
        <p className="totalAmount">
          Net Total: ₹
          {(
            productsToSend.reduce(
              (sum, product) => sum + product.price * (product.quantity || 1),
              0
            ) + getdeliverycharge
          ).toFixed(2)}
        </p>{" "}
        <div
          style={{
            textAlign: "center",
            fontSize: "15px",
            paddingBottom: "2rem",
          }}
        >
          Thank You Visit Again!
        </div>
        <hr />
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {" "}
          Order Online
        </div>
        <img
          src="/qr.png"
          alt="QR Code"
          style={{ display: "flex", margin: "2px auto" }}
        />
      </div>
      <div className="invoice-btn">
        <button
          onClick={() => {
            navigate("/invoice");
          }}
          className="invoice-kot-btn"
        >
          <h2> BACK </h2>
        </button>

        <button onClick={handleSendClick} className="invoice-next-btn">
          <h2> NEXT</h2>
          {/* <FaArrowRight className="Invoice-arrow" /> */}
        </button>
      </div>
      {/* Modal Popup */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <h2>Select Action</h2>
            <button onClick={handleSendToWhatsApp} style={styles.popupButton}>
              Send to WhatsApp
            </button>
            <button onClick={handlePngDownload} style={styles.popupButton}>
              Download Invoice
            </button>
            <button onClick={handleRawBTPrint} style={styles.popupButton}>
              Mobile Print
            </button>
            <button onClick={MobilePrint} style={styles.popupButton}>
              Usb Print
            </button>

            <button onClick={handleClosePopup} style={styles.popupCloseButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
  },
  popupButton: {
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  popupCloseButton: {
    marginTop: "10px",
    backgroundColor: "red",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CustomerDetail;
