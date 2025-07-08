// src/Utils/RawBTPrintButton.jsx
import React from "react";

export default function Rawbt3Inch({
  productsToSend,
  customerPhone,
  customerName,
  customerAddress,
 icon: Icon,
  timestamp,
  includeGST = true,
}){

  // Helper to calculate total price
  const calculateTotalPrice = (items = []) =>
    items.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);

 const handleRawBTPrint = () => {

    const orderWidth = 2;
    const nameWidth = 26; // Set a fixed width for product name
    const priceWidth = 4; // Set a fixed width for price
    const totalwidth = 4;
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
        const paddedPrice = `${product.price}`.padStart(priceWidth, " ");
        const paddedTotalPrice = `${product.price * product.quantity}`.padStart(totalwidth, " "); // Pad price to the left
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
              )}${paddedPrice} x ${paddedQuantity} = ${paddedTotalPrice} `;
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
    const header = ` No    Item Name              price  Qty  total`;
    const separator = `+${"-".repeat(nameWidth + 2)}+${"-".repeat(
      priceWidth + 2
    )}+${"-".repeat(quantityWidth + 2)}+`;
    const dash = `------------------------------------------------`; 
    const totalprice = `${calculateTotalPrice(productsToSend)}`.padStart(
      priceWidth,
      " "
    );

    // Combine header, separator, and product details
    const detailedItems = `${dash}\n${header}\n${dash}\n${productDetails}\n${dash}`;

    const date = timestamp ? new Date(timestamp) : new Date();
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const itemTotal = calculateTotalPrice(productsToSend);
  const gstAmount = includeGST ? +(itemTotal * 0.05).toFixed(2) : 0;

  const invoiceText = `
\x1B\x61\x01\x1D\x21\x33Pizza Italia\x1D\x21\x00
\x1B\x61\x01\x1D\x21\x10OPP. BAJAJ BIKE AGENCY\x1B\x21\x00
\x1B\x61\x01\x1D\x21\x10KAITHAL ROAD PEHOWA\x1B\x21\x00
\x1B\x61\x01\x1D\x21\x10 7222006000 9992271872\x1B\x21\x00    
\x1B\x61\x01\x1D\x21\x10 GstNo:06QTIPS7467A1Z1\x1B\x21\x00\x1B\x61\x00
  \x1B\x21\x30---Invoice Details---\x1B\x21\x00
  \x1B\x21\x20${formattedDate} ${formattedTime}\x1B\x21\x00
\x1B\x21\x20 Bill No: #${Math.floor(1000 + Math.random() * 9000)}\x1B\x21\x00
${
  [customerName, customerPhone, customerAddress]
    .map((value, index) => {
      if (!value) return "";
      const label = ["Name   :", "Phone  :", "Address:"][index];
      return `\x1B\x21\x20 ${label} ${value}\x1B\x21\x00`;
    })
    .filter(Boolean)
    .join("\n")
}
${detailedItems}
  ${[
  includeGST && `Item Total:                             ${totalprice} `,
  includeGST && `  GST (5%):                               +${gstAmount} `,
]
  .filter(Boolean)
  .join("\n")}

\x1B\x21\x30    Total: Rs ${
      calculateTotalPrice(productsToSend) + (includeGST ? gstAmount : 0)
    }/-  \x1B\x21\x00

          Thank You Visit Again!\n${dash}
             Powered by BillZo
       
  `;

    // Send the content to RawBT (add more parameters if required)
    const encodedText = encodeURIComponent(invoiceText);
    const rawBTUrl = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    // Trigger RawBT
    window.location.href = rawBTUrl;
  };

  return (
    <div onClick={handleRawBTPrint}>
      {Icon ? (
        <Icon/>
      ) : (
        <button className="kot-btn" >Mobile Print</button>
      )}
      </div>
  );
}
