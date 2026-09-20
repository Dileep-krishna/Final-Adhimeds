import { memo, useState, useRef, useEffect } from "react";

export const ProductRow = memo(
  ({
    product,
    onTogglePublished,
    onToggleFeatured,
    onToggleTodayDeal,
    onEdit,
    onDelete,
    onInfo,
    getImageUrl,
  }) => {
    const thumbnailUrl = getImageUrl(product.thumbnail);
    const dropdownRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = (e) => {
      e.stopPropagation();
      setDropdownOpen((prev) => !prev);
    };

    return (
      <tr className="product-row">
        {/* Checkbox */}
        <td className="checkbox-cell">
          <input type="checkbox" className="row-checkbox" />
        </td>

        {/* Thumb */}
        <td>
          <div className="product-image">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={product.productName}
                loading="lazy"
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <div className="no-image"><i className="bi bi-image"></i></div>
            )}
          </div>
        </td>

        {/* Name / Brand */}
        <td>
          <div className="product-wrapper">
            <div className="product-content">
              <h6>{product.productName}</h6>
              <span className="brand">{product.brand || "-"}</span>
            </div>
          </div>
        </td>

        {/* Owner / Category – "In-House" removed */}
        <td>
          <div className="category-box">
            <strong className="category-main">Main Category</strong>
            <span className="category-name">{product.mainCategory || "-"}</span>
          </div>
        </td>

        {/* Ratings */}
        <td>
          <div className="rating-box">
            <div className="stars">
              {"★".repeat(Math.floor(product.avgRating))}
              {product.avgRating > 0 && (
                <span className="rating-value">{product.avgRating} out of 5.0</span>
              )}
            </div>
            <small className="review-count">{product.reviewCount || 0} reviews</small>
          </div>
        </td>

        {/* Price Details */}
        <td>
          <div className="price-detail">
            <span className="price-label">Price</span>
            <span className="price-value">${product.unitPrice}</span>
          </div>
          {product.discount > 0 && (
            <div className="discount-detail">
              <span className="discount-label">Discount</span>
              <span className="discount-value">{product.discount}%</span>
            </div>
          )}
        </td>

        {/* Info */}
        <td>
          <div className="sale-info">
            <span className="sale-label">Number of Sale</span>
            <span className="sale-count">{product.saleCount || 0}</span>
          </div>
          <button className="info-btn view-stock-btn" onClick={() => onInfo(product._id)}>
            View Stock
          </button>
        </td>

        {/* Toggles */}
        <td>
          <label className="switch">
            <input
              type="checkbox"
              checked={product.published || false}
              onChange={() => onTogglePublished(product._id, product.published)}
            />
            <span className="slider"></span>
          </label>
        </td>
        <td>
          <label className="switch">
            <input
              type="checkbox"
              checked={product.featured || false}
              onChange={() => onToggleFeatured(product._id, product.featured)}
            />
            <span className="slider"></span>
          </label>
        </td>
        <td>
          <label className="switch">
            <input
              type="checkbox"
              checked={product.todaysDeal || false}
              onChange={() => onToggleTodayDeal(product._id, product.todaysDeal)}
            />
            <span className="slider"></span>
          </label>
        </td>

        {/* Options Dropdown */}
        <td>
          <div className="options-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="options-toggle-btn"
              onClick={toggleDropdown}
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <ul className={`dropdown-menu options-dropdown ${dropdownOpen ? 'open' : ''}`}>
              <li>
                <button className="dropdown-option-btn" onClick={() => { setDropdownOpen(false); onEdit(product._id); }}>
                  <i className="bi bi-pencil-square option-icon"></i> Edit
                </button>
              </li>
              <li>
                <button className="dropdown-option-btn" onClick={() => { setDropdownOpen(false); onInfo(product._id); }}>
                  <i className="bi bi-eye option-icon"></i> View Product
                </button>
              </li>
              <li>
                <button className="dropdown-option-btn" onClick={() => setDropdownOpen(false)}>
                  <i className="bi bi-files option-icon"></i> Make a Clone
                </button>
              </li>
              <li className="dropdown-divider"></li>
              <li>
                <button className="dropdown-option-btn delete-option" onClick={() => { setDropdownOpen(false); onDelete(product._id); }}>
                  <i className="bi bi-trash option-icon"></i> Delete
                </button>
              </li>
            </ul>
          </div>
        </td>
      </tr>
    );
  }
);

ProductRow.displayName = "ProductRow";