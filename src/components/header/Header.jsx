import React, { useState, useRef } from "react";
import "./Header.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const Header = ({ headerName, setSearch, onClick }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false); // Track visibility of search input
  const toggleButtonRef = useRef(null); // Ref for the toggle button
  const navigate = useNavigate();
  const location = useLocation();
  const handleSearchChange = (event) => {
    setSearch(event.target.value); // Update search state
  };

  const toggleSearch = () => {
    setIsSearchVisible((prev) => !prev); // Toggle visibility
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Simulate a button click or toggle the search visibility when Enter is pressed
      toggleSearch();

      if (toggleButtonRef.current) {
        toggleButtonRef.current.click(); // Trigger the button click programmatically
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
      <div className="container-fluid">
        <NavLink
        onClick={onClick}
          className={({ isActive }) =>
            isActive ? "navbar-brand active" : "navbar-brand"
          }
          to="/invoice"
        >
          BillZo
        </NavLink>
        {/* Show search input only on the /invoice page */}
        {location.pathname === "/invoice" && (
          <form className="search" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search products..."
              aria-label="Search"
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
          </form>
        )}
        <button
         ref={toggleButtonRef}
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/invoice"
              >
                Invoice
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/NewProduct"
              >
                Add Product
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/history"
              >
                Order History
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/report"
              >
                Order Report
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/customer-data"
              >
                 Data
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/customer-detail"
              >
                Customer Detail
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "nav-link custom-text active"
                    : "nav-link custom-text"
                }
                to="/advance"
              >
                Setting
              </NavLink>
            </li>
          </ul>
          <form className="d-flex-search" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search products..."
              aria-label="Search"
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown} 
            />
            {/* <button className="btn btn-outline-success" type="submit">Search</button> */}
            {/* <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search"/> */}
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Header;
