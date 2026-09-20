"use client";

import "./orders.css";
import {
  FaEye,
  FaDownload,
  FaTrashAlt,
} from "react-icons/fa";

const orders = [
  {
    code: "20260408-07391540",
    products: 1,
    customer: "Arathy Vipin",
    seller: "Inhouse Order",
    amount: "Rs90.90",
    delivery: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Un-Paid",
  },
  {
    code: "20260309-11492221",
    products: 1,
    customer: "Sudhin TS",
    seller: "Inhouse Order",
    amount: "Rs2,599.00",
    delivery: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Un-Paid",
  },
  {
    code: "20260305-12173938",
    products: 3,
    customer: "Arun Baby",
    seller: "Inhouse Order",
    amount: "Rs1,780.35",
    delivery: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Un-Paid",
  },
  {
    code: "20260302-11022164",
    products: 1,
    customer: "Arun Baby",
    seller: "Inhouse Order",
    amount: "Rs2,599.00",
    delivery: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Un-Paid",
  },
  {
    code: "20260301-18352181",
    products: 1,
    customer: "Arun Baby",
    seller: "Inhouse Order",
    amount: "Rs882.70",
    delivery: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Un-Paid",
  },
];

export default function Page() {
  return (
    <div className=" ">

      <div className="orders-card">

        <div className="orders-header">

          <h3>All Orders</h3>
<div className="row g-3 align-items-center mb-4">

  <div className="col-lg-2 col-md-6">
    <select className="form-select">
      <option>Bulk Action</option>
    </select>
  </div>

  <div className="col-lg-2 col-md-6">
    <select className="form-select">
      <option>Filter by Delivery Status</option>
    </select>
  </div>

  <div className="col-lg-2 col-md-6">
    <select className="form-select">
      <option>Filter by Payment Status</option>
    </select>
  </div>

  <div className="col-lg-2 col-md-6">
    <input
      type="date"
      className="form-control"
    />
  </div>

  <div className="col-lg-2 col-md-6">
    <input
      type="text"
      className="form-control"
      placeholder="Type Order code & hit Enter"
    />
  </div>

  <div className="col-lg-1 col-md-6">
    <button className="btn btn-primary w-100">
      Filter
    </button>
  </div>

</div>

        </div>

        <div className="table-responsive">

          <table className="table align-middle orders-table">

            <thead>

              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Order Code</th>
                <th>No. Products</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Delivery Status</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th className="text-center">Options</th>
              </tr>

            </thead>

            <tbody>

              {orders.map((item, index) => (

                <tr key={index}>

                  <td>
                    <input type="checkbox" />
                  </td>

                  <td>{item.code}</td>

                  <td>{item.products}</td>

                  <td>{item.customer}</td>

                  <td>{item.seller}</td>

                  <td>{item.amount}</td>

                  <td>{item.delivery}</td>

                  <td>{item.paymentMethod}</td>

                  <td>
                    <span className="status-badge">
                      {item.paymentStatus}
                    </span>
                  </td>

                  <td>

                    <div className="action-buttons">

                      <button className="action-btn view">
                        <FaEye />
                      </button>

                      <button className="action-btn download">
                        <FaDownload />
                      </button>

                      <button className="action-btn delete">
                        <FaTrashAlt />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}