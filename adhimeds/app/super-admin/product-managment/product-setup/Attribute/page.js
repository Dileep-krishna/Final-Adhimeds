"use client";

import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./attribute.css";
import { createAttributeAPI, deleteAttributeAPI, getAttributesAPI, updateAttributeAPI } from "../../../../services/attributeAPI";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [attributeName, setAttributeName] = useState("");
  const [attributeValueItems, setAttributeValueItems] = useState([
    { value: "", packSizesString: "" }
  ]);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAttributesAPI();
      if (response.success) {
        setAttributes(response.data);
        setError(null);
      } else {
        setError("Failed to load attributes");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // ✅ Updated: packSizesStringToArray now keeps ALL non‑empty strings (letters, numbers, etc.)
  const packSizesArrayToString = (arr) => arr.join(", ");
  const packSizesStringToArray = (str) => {
    if (!str.trim()) return [];
    return str.split(",").map(s => s.trim()).filter(s => s !== "");
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setAttributeName("");
    setAttributeValueItems([{ value: "", packSizesString: "" }]);
    setShowModal(true);
  };

  const openEditModal = (attribute) => {
    setIsEditMode(true);
    setEditId(attribute._id);
    setAttributeName(attribute.name);
    let items = [];
    if (attribute.values && Array.isArray(attribute.values)) {
      items = attribute.values.map(v => {
        if (typeof v === "string") {
          return { value: v, packSizesString: "" };
        } else if (typeof v === "object" && v.value !== undefined) {
          const packString = packSizesArrayToString(v.packSizes || []);
          return { value: v.value, packSizesString: packString };
        }
        return { value: "", packSizesString: "" };
      });
    }
    setAttributeValueItems(items.length ? items : [{ value: "", packSizesString: "" }]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setAttributeName("");
    setAttributeValueItems([{ value: "", packSizesString: "" }]);
    setIsEditMode(false);
    setEditId(null);
  };

  const handleNameChange = (e) => setAttributeName(e.target.value);
  const handleValueChange = (idx, newValue) => {
    const updated = [...attributeValueItems];
    updated[idx].value = newValue;
    setAttributeValueItems(updated);
  };
  const handlePackSizesStringChange = (idx, newString) => {
    const updated = [...attributeValueItems];
    updated[idx].packSizesString = newString;
    setAttributeValueItems(updated);
  };
  const addMoreValue = () => {
    setAttributeValueItems([...attributeValueItems, { value: "", packSizesString: "" }]);
  };
  const removeValue = (idx) => {
    if (attributeValueItems.length === 1) {
      toast.error("At least one attribute value is required");
      return;
    }
    const updated = attributeValueItems.filter((_, i) => i !== idx);
    setAttributeValueItems(updated);
  };

  const preparePackSizes = (items) => {
    return items.map(item => ({
      value: item.value.trim(),
      packSizes: packSizesStringToArray(item.packSizesString)
    }));
  };

  const saveAttribute = async () => {
    if (!attributeName.trim()) {
      toast.error("Attribute name is required");
      return;
    }
    const filteredItems = attributeValueItems.filter(item => item.value.trim() !== "");
    if (filteredItems.length === 0) {
      toast.error("At least one attribute value is required");
      return;
    }

    const preparedValues = preparePackSizes(filteredItems);
    const payload = {
      name: attributeName.trim(),
      values: preparedValues
    };

    try {
      let response;
      if (isEditMode) {
        response = await updateAttributeAPI(editId, payload);
      } else {
        response = await createAttributeAPI(payload);
      }
      if (response.success) {
        toast.success(`Attribute ${isEditMode ? "updated" : "created"} successfully`);
        fetchAttributes();
        closeModal();
      } else {
        toast.error(response.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please try again.");
    }
  };

  const deleteAttribute = async (id, name) => {
    if (window.confirm(`Delete attribute "${name}" permanently?`)) {
      try {
        const response = await deleteAttributeAPI(id);
        if (response.success) {
          toast.success("Attribute deleted");
          fetchAttributes();
        } else {
          toast.error(response.message || "Delete failed");
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error. Could not delete.");
      }
    }
  };

  const renderValueChips = (values) => {
    if (!values || !values.length) return "—";
    return values.map((v, idx) => {
      let valueText = "";
      let packString = "";
      if (typeof v === "string") {
        valueText = v;
      } else if (typeof v === "object") {
        valueText = v.value || "";
        if (v.packSizes && v.packSizes.length) {
          packString = ` (${v.packSizes.join(", ")})`;
        }
      }
      return (
        <span key={idx} className="value-chip">
          {valueText}{packString}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div className="attributes-container text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading attributes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attributes-container text-center py-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchAttributes}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="attributes-container">
        <div className="header-actions">
          <h4 className="page-title">Medical Attributes</h4>
          <button className="btn-add" onClick={openAddModal}>
            + Add New Attribute
          </button>
        </div>

        <div className="table-responsive">
          <table className="med-table">
            <thead>
              <tr>
                <th>Attribute Name</th>
                <th>Possible Values (with Pack Sizes)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr._id}>
                  <td><strong>{attr.name}</strong></td>
                  <td>
                    <div className="value-chips">
                      {renderValueChips(attr.values)}
                    </div>
                  </td>
                  <td>
                    <button className="btn-icon edit" onClick={() => openEditModal(attr)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn-icon delete" onClick={() => deleteAttribute(attr._id, attr.name)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {attributes.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4">No attributes found. Click "Add New Attribute" to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>{isEditMode ? "Edit Attribute" : "Attribute Information"}</h5>
                <button className="close-modal" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Attribute Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={attributeName}
                    onChange={handleNameChange}
                    placeholder="e.g., Size, Color, Dosage Form"
                  />
                </div>

                <div className="form-group">
                  <label>Attribute Values & Pack Sizes (optional)</label>
                  {attributeValueItems.map((item, idx) => (
                    <div key={idx} className="value-pack-group">
                      <div className="value-input-row">
                        <input
                          type="text"
                          className="form-control value-input"
                          value={item.value}
                          onChange={(e) => handleValueChange(idx, e.target.value)}
                          placeholder="e.g., M"
                        />
                        <input
                          type="text"
                          className="form-control pack-input"
                          value={item.packSizesString}
                          onChange={(e) => handlePackSizesStringChange(idx, e.target.value)}
                          placeholder="e.g., 32, XL, Small, 5ml"
                        />
                        {attributeValueItems.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-value"
                            onClick={() => removeValue(idx)}
                            title="Remove this value"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="btn-add-more" onClick={addMoreValue}>
                    + Add More Value
                  </button>
                  <small className="text-muted d-block mt-2">
                    Pack sizes are optional; separate multiple with commas (e.g., 32, XL, Small). Any text is allowed.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="btn-save" onClick={saveAttribute}>
                  {isEditMode ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}