"use client";

import Navbar from "../../components/Navbar";
import "./profile.css";

export default function ProfilePage() {
  return (
    <div className="profile-container ">
  <Navbar />
      <div className="row">

        {/* LEFT SIDEBAR */}
        <div className="col-md-3">
          <div className="sidebar-card p-3">

            {/* PROFILE */}
            <div className="text-center mb-3">
              <img
                src="https://i.pravatar.cc/80"
                className="profile-img mb-2"
              />
              <h6>9447478458</h6>
              <small className="text-muted">Pick a photo from desktop</small>
              <div className="mt-2">
                <span className="link">Edit</span> |{" "}
                <span className="link">Remove</span>
              </div>
            </div>

            <hr />

            {/* MENU */}
            <div className="menu">
              <p className="menu-title">Account Setting</p>
              <p className="menu-item active">Profile Information</p>
              <p className="menu-item">User Management</p>
              <p className="menu-item">Change Password</p>
            </div>

            <hr />

            <p className="menu-item">My Orders</p>
            <p className="menu-item text-danger">Logout</p>

          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-md-9">

          <div className="profile-card p-4">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Profile Information</h6>
              <span className="edit-link">Edit</span>
            </div>

            {/* INPUT ROW */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <input className="form-control" value="9447478458" readOnly />
              </div>
              <div className="col-md-4">
                <input className="form-control" value="ADHI VEDA PHARMACEUTICAL PRIVATE LIMITED" readOnly />
              </div>
              <div className="col-md-4">
                <input className="form-control" value="adhiveda2021ltd@gmail.com" readOnly />
              </div>
            </div>

            {/* BUSINESS INFO */}
            <h6 className="mb-3">Business Information</h6>

            {/* STEPS */}
            <div className="steps d-flex justify-content-between mb-4">
              <div className="step active">Firm legal Identities</div>
              <div className="step active">Other Documents</div>
              <div className="step active">Firm Contact Information</div>
            </div>

            {/* FORM */}
            <div className="row g-3">

              <div className="col-md-6">
                <input className="form-control" value="KL-EKM-160750" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="30/10/2028" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="KL-EKM-160751" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="30/10/2028" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="RLF20KL2023005878" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="30/10/2028" readOnly />
              </div>

              <div className="col-md-6">
                <input className="form-control" value="32AAUCA8488M1ZQ" readOnly />
              </div>

              <div className="col-md-6">
                <select className="form-select">
                  <option>Registered</option>
                </select>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}