import React, { useState, useEffect } from "react";
import { FaImage } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import "./Invoice.css";
import {
  FaMinusCircle,
  FaPlusCircle,
  FaArrowRight,
  FaBars,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
// import { AiOutlineBars } from "react-icons/ai";
import { IoMdCloseCircle } from "react-icons/io";
import Header from "../header/Header";
import { fetchProducts, removeProduct } from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "bottom-right",
  autoClose: 2000,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
  width: "90%",
};
const Invoice = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsToSend, setProductsToSend] = useState([]);
  const [Search, setSearch] = useState(""); // State for search query
  const [showPopup, setShowPopup] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryVisible, setIsCategoryVisible] = useState(false);

  const navigate = useNavigate(); // For navigation

  const [showRemoveBtn, setShowRemoveBtn] = useState(false);
  let pressTimer;

  const handlePressStart = () => {
    // Set a timeout to show the remove button after 1 second (1000 ms)
    pressTimer = setTimeout(() => {
      setShowRemoveBtn(true);
    }, 1000);
  };

  const handlePressEnd = () => {
    // Clear the timeout if the user releases the press before 1 second
    clearTimeout(pressTimer);
  };

  const filteredProducts = selectedProducts
    .filter((product) =>
      product.name.toLowerCase().includes(Search.toLowerCase())
    )
    .reduce((acc, product) => {
      const category = product.category || "Others";

      // Ensure the category key exists in the accumulator
      if (!acc[category]) {
        acc[category] = [];
      }

      // Add the product to the correct category group
      acc[category].push(product);

      return acc;
    }, {});

  // Load products from localStorage on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await fetchProducts(); // Use the function from api.js
        setSelectedProducts(products);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error.message); // Logs the error message
        setLoading(false);
      }
    };

    fetchData();

    const storedProductsToSend =
      JSON.parse(localStorage.getItem("productsToSend")) || [];
    setProductsToSend(storedProductsToSend);

    localStorage.removeItem("deliveryCharge");

    // setSelectedVariety([]);
  }, []);

  const handleOpenPopup = (product) => {
    if (product.varieties && product.varieties.length > 0) {
      setCurrentProduct(product);
      setShowPopup(true);

      const savedSelectedVarieties = JSON.parse(
        localStorage.getItem("selectedVariety") || "[]"
      );
      setSelectedVariety(
        savedSelectedVarieties.filter((v) => v.productId === product.id)
      ); // Filter by productId
    } else {
      handleAddToWhatsApp(product); // Directly add product if no varieties
    }
  };

  // useEffect(() => {
  //   // Reset selectedVariety on popup close or when a new product is selected
  //   setSelectedVariety([]);
  // }, [showPopup]);

  // Save selectedVariety to localStorage whenever it changes
  useEffect(() => {
    if (selectedVariety.length > 0) {
      localStorage.setItem("selectedVariety", JSON.stringify(selectedVariety));
    }
  }, [selectedVariety]);

  // Clear selectedVariety from localStorage when page refreshes
  useEffect(() => {
    localStorage.removeItem("selectedVariety");
  }, []);

  const handleVarietyQuantityChange = (variety, delta, productId) => {
    setSelectedVariety((prev) => {
      let updatedVarieties = prev.map((selected) =>
        selected.size === variety.size &&
        selected.price === variety.price &&
        selected.productId === productId
          ? { ...selected, quantity: (selected.quantity || 0) + delta }
          : selected
      );

      // Remove variety if the quantity becomes less than 1
      updatedVarieties = updatedVarieties.filter(
        (selected) => selected.quantity > 0
      );

      // Save updated selectedVariety to localStorage
      localStorage.setItem("selectedVariety", JSON.stringify(updatedVarieties));

      // Update productsToSend based on the updated selectedVarieties

      return updatedVarieties;
    });
  };

  const handleVarietyChange = (variety, isChecked, productId) => {
    setSelectedVariety((prev) => {
      let updatedVarieties;
      if (isChecked) {
        updatedVarieties = [
          ...prev,
          { ...variety, quantity: 1, productId }, // Add productId to variety
        ];
      } else {
        updatedVarieties = prev.filter(
          (selected) =>
            !(
              selected.size === variety.size &&
              selected.price === variety.price &&
              selected.productId === productId
            ) // Match by productId too
        );
      }

      localStorage.setItem("selectedVariety", JSON.stringify(updatedVarieties));
      return updatedVarieties;
    });
  };

  const handleAddToWhatsApp = (product, selectedVarieties = []) => {
    // Handle products with no varieties
    if (selectedVarieties.length === 0) {
      const exists = productsToSend.some(
        (prod) =>
          prod.name === product.name &&
          prod.price === product.price &&
          prod.size === product.size
      );

      if (!exists) {
        // Add the product if it doesn't already exist
        setProductsToSend((prev) => {
          const updatedProducts = [...prev, { ...product, quantity: 1 }];
          // Update localStorage after setting the state
          localStorage.setItem(
            "productsToSend",
            JSON.stringify(updatedProducts)
          );
          return updatedProducts;
        });
      } else {
        // Update quantity if the product already exists
        setProductsToSend((prev) => {
          const updatedProducts = prev.map((prod) =>
            prod.name === product.name &&
            prod.price === product.price &&
            prod.size === product.size
              ? { ...prod, quantity: prod.quantity + 1 }
              : prod
          );
          // Update localStorage after setting the state
          localStorage.setItem(
            "productsToSend",
            JSON.stringify(updatedProducts)
          );
          return updatedProducts;
        });
      }
      return;
    }

    // Handle products with selected varieties
    const newProducts = selectedVarieties.map((variety) => ({
      ...product,
      ...variety,
      quantity: variety.quantity || 0, // Default quantity for each variety
    }));

    setProductsToSend((prev) => {
      let updatedProductsToSend = [...prev];

      newProducts.forEach((newProduct) => {
        const exists = updatedProductsToSend.some(
          (prod) =>
            prod.name === newProduct.name &&
            prod.price === newProduct.price &&
            prod.size === newProduct.size
        );

        if (!exists) {
          updatedProductsToSend.push(newProduct);
        } else {
          updatedProductsToSend = updatedProductsToSend.map((prod) =>
            prod.name === newProduct.name &&
            prod.price === newProduct.price &&
            prod.size === newProduct.size
              ? { ...prod, quantity: newProduct.quantity }
              : prod
          );
        }
      });

      // Update localStorage after state update
      localStorage.setItem(
        "productsToSend",
        JSON.stringify(updatedProductsToSend)
      );

      return updatedProductsToSend;
    });

    setShowPopup(false); // Close popup
    setSelectedVariety([]); // Reset selected varieties
  };

  // Function to handle quantity changes
  const handleQuantityChange = (productName, productPrice, delta) => {
    const updatedProductsToSend = productsToSend
      .map((prod) => {
        if (prod.name === productName && prod.price === productPrice) {
          const newQuantity = prod.quantity + delta;
          if (newQuantity < 1) {
            return null; // Remove the product if quantity goes below 1
          }
          return { ...prod, quantity: newQuantity };
        }
        return prod;
      })
      .filter(Boolean); // Remove any null values

    setProductsToSend(updatedProductsToSend);
    localStorage.setItem(
      "productsToSend",
      JSON.stringify(updatedProductsToSend)
    );
  };

  // Function to remove a product from selected products and productsToSend
  const handleRemoveProduct = async (productName, productPrice) => {
    try {
      // Call the API function
      await removeProduct(productName, productPrice);

      // Remove product from the selectedProducts and productsToSend arrays
      const updatedSelectedProducts = selectedProducts.filter(
        (prod) => !(prod.name === productName && prod.price === productPrice)
      );
      const updatedProductsToSend = productsToSend.filter(
        (prod) => !(prod.name === productName && prod.price === productPrice)
      );

      // Update the state
      setSelectedProducts(updatedSelectedProducts);
      setProductsToSend(updatedProductsToSend);

      // Update localStorage
      localStorage.setItem("products", JSON.stringify(updatedSelectedProducts));
      localStorage.setItem(
        "productsToSend",
        JSON.stringify(updatedProductsToSend)
      );

      console.log("Product removed successfully from both MongoDB and state");
    } catch (error) {
      console.error("Error removing product:", error.message);
    }
  };

  // Navigate to the customer details page
  const handleDone = () => {
    if (productsToSend.length === 0) {
      toast.error(
        "Please add at least one product before proceeding.",
        toastOptions
      );
      return; // Prevent navigation if no products are selected
    }

    navigate("/customer-detail"); // Navigate to customer detail page
  };

  // Helper function to calculate total price
  const calculateTotalPrice = (products = []) => {
    return products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const handleCategoryClick = (category) => {
    const categoryElement = document.getElementById(category);
    if (categoryElement) {
      // Calculate the offset position (7rem margin)
      const offset = 7 * 16; // Convert rem to pixels (assuming 1rem = 16px)
      const elementPosition = categoryElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      // Smooth scroll to the position with the offset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsCategoryVisible((prev) => !prev);
  };

  const toggleCategoryVisibility = () => {
    setIsCategoryVisible((prev) => !prev); // Toggle visibility
  };

  // New: KOT (Kitchen Order Ticket) print handler
  const handleKot = () => {
    // Identify the printable section by ID
    const printArea = document.getElementById("sample-section");
    if (!printArea) {
      console.warn("No sample-section found to print.");
      return;
    }
    // Open new window and write content
    const printContent = printArea.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(
      `<html><head><title>KOT Ticket</title><style>body{font-family:sans-serif;padding:1rem;} .product-item{margin-bottom:.5rem;} .hr{border:1px solid #000;}</style></head><body>${printContent}</body></html>`
    );
    win.document.close();
    // win.focus();
    // win.print();
    // win.close();
  };

  return (
    <div>
      <ToastContainer />
      <Header
        headerName="Urban Pizzeria"
        setSearch={setSearch}
        onClick={toggleCategoryVisibility}
      />
      <div className="invoice-container">
        <div className="category-barr">
          <div className="category-b">
            <div className="category-bar">
              {Object.keys(filteredProducts)
                .sort((a, b) => a.localeCompare(b))
                .map((category, index) => (
                  <button
                    key={index}
                    className="category-btn"
                    onClick={() => handleCategoryClick(category)} // Trigger scroll to category
                  >
                    {category}
                  </button>
                ))}
            </div>
          </div>
        </div>
        <div className="main-section">
          <div className="main">
            {loading ? (
              // Display loading effect when fetching data
              <div className="lds-ripple">
                <div></div>
                <div></div>
              </div>
            ) : Object.keys(filteredProducts).length > 0 ? (
              Object.keys(filteredProducts)
                .sort((a, b) => a.localeCompare(b)) // Sort category names alphabetically
                .map((category, index) => (
                  <div key={index} className="category-container">
                    <h2 className="category" id={category}>
                      {category}
                    </h2>
                    {filteredProducts[category]
                      .sort((a, b) => a.price - b.price) // Sort products by price in ascending order
                      .map((product, idx) => (
                        <>
                          <hr />
                          <div>
                            <div key={idx} className="main-box">
                              {/* <div className="img-box">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: "3rem", height: "3rem" }}
                            />
                          ) : (
                            <FaImage
                              style={{ width: "3rem", height: "3rem" }}
                            />
                          )}
                        </div> */}

                              <div
                                className="sub-box"
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                              >
                                <h4 className="p-name">
                                  {product.name}
                                  {product.varieties &&
                                  Array.isArray(product.varieties) &&
                                  product.varieties[0]?.size
                                    ? ` (${product.varieties[0].size})`
                                    : ""}
                                </h4>
                                <p className="p-name-price">
                                  Rs.{" "}
                                  {product.price
                                    ? product.price.toFixed(2) // Use product price if it exists
                                    : product.varieties.length > 0
                                    ? product.varieties[0].price.toFixed(2) // Fallback to first variety price
                                    : "N/A"}{" "}
                                  {/* Handle case when neither price nor varieties are available */}
                                  {showRemoveBtn && (
                                    <span
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemoveProduct(
                                          product.name,
                                          product.price
                                        )
                                      }
                                    >
                                      <FaTimesCircle />
                                    </span>
                                  )}
                                </p>
                              </div>

                              {productsToSend.some(
                                (prod) =>
                                  prod.name === product.name &&
                                  prod.price === product.price
                              ) ? (
                                <div className="quantity-btns">
                                  <button
                                    className="icons"
                                    onClick={() =>
                                      handleQuantityChange(
                                        product.name,
                                        product.price,
                                        -1
                                      )
                                    }
                                  >
                                    <FaMinusCircle />
                                  </button>
                                  <span style={{ margin: "0 .4rem" }}>
                                    {productsToSend.find(
                                      (prod) =>
                                        prod.name === product.name &&
                                        prod.price === product.price
                                    )?.quantity || 1}
                                  </span>
                                  <button
                                    className="icons"
                                    onClick={() =>
                                      handleQuantityChange(
                                        product.name,
                                        product.price,
                                        1
                                      )
                                    }
                                  >
                                    <FaPlusCircle />
                                  </button>
                                </div>
                              ) : (
                                <div className="btn-box">
                                  <button
                                    onClick={() => handleOpenPopup(product)}
                                    className="add-btn"
                                  >
                                    Add
                                  </button>
                                  {product.varieties?.length > 0 && (
                                    <span className="customise-text">
                                      Customise
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ))}
                  </div>
                ))
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        {productsToSend.length > 0 ? (
          <div className="sample-section" id="sample-section">
            <div className="check-container">
              <>
                <ul className="product-list">
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  <li className="product-item" style={{ display: "flex" }}>
                    <div style={{ width: "10%" }}>
                      <span>No.</span>
                    </div>
                    <div style={{ width: "50%", textAlign: "center" }}>
                      <span>Name</span>
                    </div>
                    <div style={{ width: "10%", textAlign: "center" }}>
                      <span>Qty</span>
                    </div>
                    <div style={{ width: "7%", textAlign: "center" }}>
                      <span>x</span>
                    </div>
                    <div style={{ width: "15%", textAlign: "right" }}>
                      <span>Price</span>
                    </div>
                  </li>
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  {productsToSend.map((product, index) => (
                    <li
                      key={index}
                      className="product-item"
                      style={{ display: "flex" }}
                    >
                      <div style={{ width: "10%" }}>
                        <span>{index + 1}.</span>
                      </div>
                      <div style={{ width: "50%" }}>
                        <span>{product.name}</span>
                      </div>
                      <div style={{ width: "10%", textAlign: "center" }}>
                        <span>{product.quantity}</span>
                      </div>{" "}
                      <div style={{ width: "7%", textAlign: "center" }}>
                        <span>x</span>
                      </div>{" "}
                      <div style={{ width: "15%", textAlign: "right" }}>
                        <span>{product.price}</span>
                      </div>
                    </li>
                  ))}
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                  <li className="product-item" style={{ display: "flex" }}>
                    <div
                      style={{
                        width: "77%",
                        textAlign: "center",
                        fontWeight: 800,
                      }}
                    >
                      <span>Total</span>
                    </div>
                    <div
                      style={{
                        width: "15%",
                        textAlign: "right",
                        fontWeight: 900,
                      }}
                    >
                      <span>{calculateTotalPrice(productsToSend)}</span>
                    </div>
                    <div
                      style={{
                        width: "5%",
                        textAlign: "left",
                        fontWeight: 900,
                      }}
                    >
                      <span>/-</span>
                    </div>
                  </li>
                  {/* <div style={{ textAlign: "center" }}>{dash}</div> */}
                  <hr className="hr" />
                </ul>
              </>
            </div>
          </div>
        ) : (
          <p className="no-products">No products found </p>
        )}
      </div>
      <div className="invoice-btn">
        <button
          onClick={() => {
            navigate("/NewProduct");
          }}
          className="invoice-kot-btn"
        >
          <h2> + PRODUCT </h2>
        </button>

        <button
          onClick={handleKot}
          className="invoice-next-btn"
          style={{ borderRadius: "0" }}
        >
          <h2> Kot </h2>
        </button>

        <button onClick={handleDone} className="invoice-next-btn">
          <h2> NEXT ₹{calculateTotalPrice(productsToSend).toFixed(2)}</h2>
          {/* <FaArrowRight className="Invoice-arrow" /> */}
        </button>
      </div>
      {showPopup && currentProduct && currentProduct.varieties?.length > 0 && (
        <div className="popup-overlay">
          <div className="popup-contentt">
            <FaTimesCircle
              className="close-icon"
              onClick={() => setShowPopup(false)}
            />
            <h3>Select Size for {currentProduct.name}</h3>
            {currentProduct.varieties.map((variety, index) => (
              <div key={index} className="variety-option">
                <label className="variety-label">
                  <input
                    type="checkbox"
                    name="variety"
                    value={index}
                    checked={selectedVariety.some(
                      (v) =>
                        v.size === variety.size &&
                        v.price === variety.price &&
                        v.productId === currentProduct.id
                    )}
                    onChange={(e) =>
                      handleVarietyChange(
                        variety,
                        e.target.checked,
                        currentProduct.id
                      )
                    }
                  />
                  <span>
                    {variety.size.charAt(0).toUpperCase()} ~ ₹ {variety.price}
                  </span>
                </label>

                {selectedVariety.some(
                  (v) => v.size === variety.size && v.price === variety.price
                ) && (
                  <div className="quantity-buttons">
                    <button
                      onClick={() =>
                        handleVarietyQuantityChange(
                          variety,
                          -1,
                          currentProduct.id
                        )
                      }
                      disabled={variety.quantity <= 1}
                    >
                      <FaMinusCircle />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={
                        selectedVariety.find(
                          (v) =>
                            v.size === variety.size && v.price === variety.price
                        )?.quantity || 1
                      }
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value, 10);
                        handleVarietyQuantityChange(
                          variety,
                          quantity - variety.quantity
                        );
                      }}
                    />
                    <button
                      onClick={() =>
                        handleVarietyQuantityChange(
                          variety,
                          1,
                          currentProduct.id
                        )
                      }
                    >
                      <FaPlusCircle />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                handleAddToWhatsApp(currentProduct, selectedVariety)
              }
              disabled={selectedVariety?.length === 0}
              className="save-btn"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
