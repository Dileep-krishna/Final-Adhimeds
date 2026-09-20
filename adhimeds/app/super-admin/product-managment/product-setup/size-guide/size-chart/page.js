'use client';
import React, { useState } from 'react';
import './sizechart.css';
import { motion, AnimatePresence } from 'framer-motion';

function MedicalSizeChart() {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);

  const [charts, setCharts] = useState([
    {
      id: 1,
      name: "Blood Pressure Cuff Sizing",
      category: "Equipment",
      description: "Cuff sizes for accurate BP measurement.",
      measurementType: "cm",
      measurementPoints: ["Arm Circumference"],
      sizeOptions: ["Small (22-26 cm)", "Medium (27-34 cm)", "Large (35-44 cm)"],
      dosageRange: "",
      images: [],
    },
    {
      id: 2,
      name: "Pediatric Paracetamol Dosage",
      category: "Medicine",
      description: "Weight-based dosage for syrup.",
      measurementType: "kg",
      measurementPoints: ["Weight"],
      sizeOptions: ["5-10 kg", "11-20 kg", "21-30 kg"],
      dosageRange: "2.5 ml, 5 ml, 7.5 ml",
      images: [],
    },
  ]);

  const [formData, setFormData] = useState({
    chartName: '',
    category: '',
    medicalCondition: '',
    measurementType: 'cm',
    sizeOptions: [],
    measurementPoints: [],
    dosageRange: '',
    sizeDescription: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const categories = ['Medicine', 'Equipment', 'Dosage Chart', 'Supplements', 'Ayurveda'];
  const measurementPointsList = ['Arm Circumference', 'Chest', 'Waist', 'Hip', 'Height', 'Weight', 'Head Circumference'];
  const sizeOptionsList = ['Small', 'Medium', 'Large', 'X-Large', 'Extra Large', 'Pediatric', 'Adult'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'measurementPoints') {
        let updated = [...formData.measurementPoints];
        if (checked) updated.push(value);
        else updated = updated.filter(v => v !== value);
        setFormData({ ...formData, measurementPoints: updated });
      } else if (name === 'sizeOptions') {
        let updated = [...formData.sizeOptions];
        if (checked) updated.push(value);
        else updated = updated.filter(v => v !== value);
        setFormData({ ...formData, sizeOptions: updated });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSave = () => {
    if (!formData.chartName) {
      alert('Chart Name is required');
      return;
    }
    const newChart = {
      id: charts.length + 1,
      name: formData.chartName,
      category: formData.category,
      description: formData.sizeDescription,
      measurementType: formData.measurementType,
      measurementPoints: formData.measurementPoints,
      sizeOptions: formData.sizeOptions,
      dosageRange: formData.dosageRange,
      medicalCondition: formData.medicalCondition,
      images: imagePreviews,
    };
    setCharts([...charts, newChart]);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      chartName: '',
      category: '',
      medicalCondition: '',
      measurementType: 'cm',
      sizeOptions: [],
      measurementPoints: [],
      dosageRange: '',
      sizeDescription: '',
    });
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleShow = (chart) => {
    setSelectedChart(chart);
    setShowViewModal(true);
  };

  const deleteChart = (id) => {
    if (window.confirm('Delete this size chart?')) {
      setCharts(charts.filter(c => c.id !== id));
    }
  };

  return (
    <div className="size-chart-container">
      {/* Header */}
      <div className="header-actions">
        <div className="header-left">
          <h4 className="page-title">📏 Medical Size & Dosage Charts</h4>
          <p className="page-subtitle">Manage sizing and dosage reference charts for products</p>
        </div>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle"></i> Add New Chart
        </button>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="med-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Chart Name</th>
              <th>Category</th>
              <th>Details</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charts.map((chart, index) => (
              <tr key={chart.id}>
                <td>{index + 1}</td>
                <td>
                  <span className="chart-name">{chart.name}</span>
                </td>
                <td>
                  <span className="category-badge">{chart.category}</span>
                </td>
                <td>
                  <button className="btn-details" onClick={() => handleShow(chart)}>
                    <i className="bi bi-eye"></i> View
                  </button>
                </td>
                <td className="text-center">
                  <button className="btn-icon edit" title="Edit">
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn-icon delete" onClick={() => deleteChart(chart.id)} title="Delete">
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {charts.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  <i className="bi bi-clipboard"></i>
                  <p>No charts added yet.</p>
                  <button className="btn-add-small" onClick={() => setShowModal(true)}>
                    + Add Your First Chart
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="modal-container modal-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h5>📝 Add New Chart</h5>
                <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Chart Name <span className="required">*</span></label>
                      <input type="text" name="chartName" className="form-control" value={formData.chartName} onChange={handleInputChange} placeholder="e.g., BP Cuff Sizing" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Category <span className="required">*</span></label>
                      <select name="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Medical Condition / Usage</label>
                      <input type="text" name="medicalCondition" className="form-control" value={formData.medicalCondition} onChange={handleInputChange} placeholder="e.g., Hypertension, Pediatric Fever" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Images (Size Guide / Dosage Infographic)</label>
                  <div className="file-upload-wrapper">
                    <input type="file" className="file-input" accept="image/*" multiple onChange={handleImageChange} id="chart-images" />
                    <label htmlFor="chart-images" className="file-label">
                      <i className="bi bi-cloud-upload"></i> Choose Images
                    </label>
                    <span className="file-name">{imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'No files chosen'}</span>
                  </div>
                  <small className="text-muted">These images will be shown in the product size/dosage guide.</small>
                  {imagePreviews.length > 0 && (
                    <div className="image-previews mt-2">
                      {imagePreviews.map((src, idx) => (
                        <img key={idx} src={src} alt="preview" className="preview-thumb" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Measurement Type</label>
                      <div className="radio-group">
                        <label className="me-3">
                          <input type="radio" name="measurementType" value="cm" checked={formData.measurementType === 'cm'} onChange={handleInputChange} /> cm
                        </label>
                        <label>
                          <input type="radio" name="measurementType" value="inches" checked={formData.measurementType === 'inches'} onChange={handleInputChange} /> inches
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Dosage / Value Range (if applicable)</label>
                      <input type="text" name="dosageRange" className="form-control" value={formData.dosageRange} onChange={handleInputChange} placeholder="e.g., 2.5 ml, 5 ml, 10 ml" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Measurement Points (for equipment sizing)</label>
                  <div className="checkbox-group">
                    {measurementPointsList.map(point => (
                      <label key={point} className="checkbox-label">
                        <input type="checkbox" name="measurementPoints" value={point} onChange={handleInputChange} /> {point}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Size Options (e.g., Small, Medium, Large)</label>
                  <div className="checkbox-group">
                    {sizeOptionsList.map(option => (
                      <label key={option} className="checkbox-label">
                        <input type="checkbox" name="sizeOptions" value={option} onChange={handleInputChange} /> {option}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Size / Dosage Description</label>
                  <textarea name="sizeDescription" className="form-control" rows="3" value={formData.sizeDescription} onChange={handleInputChange} placeholder="Additional instructions or conversion notes..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSave}>
                  <i className="bi bi-check-lg me-1"></i> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedChart && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <motion.div 
              className="modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h5>{selectedChart.name}</h5>
                <button className="close-modal" onClick={() => setShowViewModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{selectedChart.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Condition/Usage</span>
                    <span className="detail-value">{selectedChart.medicalCondition || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Measurement Type</span>
                    <span className="detail-value">{selectedChart.measurementType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Measurement Points</span>
                    <span className="detail-value">{selectedChart.measurementPoints?.join(', ') || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Size Options</span>
                    <span className="detail-value">{selectedChart.sizeOptions?.join(', ') || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dosage Range</span>
                    <span className="detail-value">{selectedChart.dosageRange || '—'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedChart.description || '—'}</span>
                  </div>
                  {selectedChart.images && selectedChart.images.length > 0 && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Images</span>
                      <div className="image-gallery">
                        {selectedChart.images.map((img, idx) => (
                          <img key={idx} src={img} alt="chart" className="gallery-thumb" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MedicalSizeChart;