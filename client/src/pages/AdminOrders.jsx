import { useEffect, useState } from "react";
import {
  getAllOrdersAdminApi,
  updateAdminOrderApi,
} from "../api/order.api";
import { getFoodsApi } from "../api/food.api";

const PAYMENT_METHODS = ["COD", "ESEWA", "KHALTI"];

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [foodsLoading, setFoodsLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const [editForm, setEditForm] = useState({
    deliveryAddress: "",
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    orderStatus: "PENDING",
    items: [],
  });

  useEffect(() => {
    loadOrders();
    loadFoods();
  }, []);

  // =========================
  // LOAD ORDERS
  // =========================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllOrdersAdminApi();

      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error("Failed to load admin orders:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD FOODS
  // =========================

  const loadFoods = async () => {
    try {
      setFoodsLoading(true);

      const response = await getFoodsApi();

      const availableFoods =
        response.data?.foods?.filter(
          (food) => food.isAvailable
        ) || [];

      setFoods(availableFoods);
    } catch (err) {
      console.error("Failed to load foods:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load foods"
      );
    } finally {
      setFoodsLoading(false);
    }
  };

  // =========================
  // START EDITING
  // =========================

  const startEditing = (order) => {
    setEditingId(order._id);
    setSuccess("");
    setError("");

    setEditForm({
      deliveryAddress: order.deliveryAddress || "",
      paymentMethod: order.paymentMethod || "COD",
      paymentStatus:
        order.paymentStatus || "PENDING",
      orderStatus:
        order.orderStatus || "PENDING",

      items:
        order.items?.map((item) => ({
          food:
            item.food?._id ||
            item.food ||
            "",
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })) || [],
    });
  };

  // =========================
  // CANCEL EDITING
  // =========================

  const cancelEditing = () => {
    setEditingId(null);

    setEditForm({
      deliveryAddress: "",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      items: [],
    });
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // CHANGE ITEM QUANTITY
  // =========================

  const increaseQuantity = (index) => {
    setEditForm((prev) => {
      const items = [...prev.items];

      items[index] = {
        ...items[index],
        quantity: items[index].quantity + 1,
      };

      return {
        ...prev,
        items,
      };
    });
  };

  const decreaseQuantity = (index) => {
    setEditForm((prev) => {
      const items = [...prev.items];

      if (items[index].quantity <= 1) {
        return prev;
      }

      items[index] = {
        ...items[index],
        quantity: items[index].quantity - 1,
      };

      return {
        ...prev,
        items,
      };
    });
  };

  // =========================
  // REMOVE ITEM
  // =========================

  const removeItem = (index) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  // =========================
  // ADD NEW FOOD
  // =========================

  const addFood = (e) => {
    const foodId = e.target.value;

    if (!foodId) {
      return;
    }

    const food = foods.find(
      (item) => item._id === foodId
    );

    if (!food) {
      return;
    }

    setEditForm((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) =>
          item.food === food._id
      );

      // If food already exists, increase quantity
      if (existingIndex !== -1) {
        const items = [...prev.items];

        items[existingIndex] = {
          ...items[existingIndex],
          quantity:
            items[existingIndex].quantity + 1,
        };

        return {
          ...prev,
          items,
        };
      }

      // Otherwise add a new item
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            food: food._id,
            name: food.name,
            price: food.price,
            quantity: 1,
          },
        ],
      };
    });

    // Reset dropdown
    e.target.value = "";
  };

  // =========================
  // SAVE ORDER
  // =========================

  const saveOrder = async (orderId) => {
    try {
      setSavingId(orderId);
      setError("");
      setSuccess("");

      if (
        !editForm.deliveryAddress ||
        editForm.deliveryAddress.trim().length < 5
      ) {
        setError(
          "Delivery address must be at least 5 characters."
        );

        return;
      }

      if (editForm.items.length === 0) {
        setError(
          "Order must contain at least one food item."
        );

        return;
      }

      const payload = {
        deliveryAddress:
          editForm.deliveryAddress.trim(),

        paymentMethod:
          editForm.paymentMethod,

        paymentStatus:
          editForm.paymentStatus,

        orderStatus:
          editForm.orderStatus,

        items: editForm.items.map((item) => ({
          food: item.food,
          quantity: Number(item.quantity),
        })),
      };

      const response =
        await updateAdminOrderApi(
          orderId,
          payload
        );

      const updatedOrder =
        response.data?.order;

      if (!updatedOrder) {
        throw new Error(
          "Updated order was not returned by server."
        );
      }

      // Replace updated order in state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? updatedOrder
            : order
        )
      );

      setSuccess(
        "Order updated successfully."
      );

      setEditingId(null);
    } catch (err) {
      console.error(
        "Failed to update order:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update order"
      );
    } finally {
      setSavingId(null);
    }
  };

  // =========================
  // CALCULATE EDIT TOTAL
  // =========================

  const calculateEditSubtotal = () => {
    return editForm.items.reduce(
      (total, item) =>
        total +
        Number(item.price) *
        Number(item.quantity),
      0
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Admin Orders</h1>
        <p>Loading orders...</p>
      </main>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1>Admin Orders</h1>

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#b00020",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "15px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#e5ffe9",
            color: "#087f23",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "15px",
            marginBottom: "15px",
          }}
        >
          {success}
        </div>
      )}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ marginTop: "25px" }}>
          {orders.map((order) => {
            const isEditing =
              editingId === order._id;

            return (
              <div
                key={order._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "25px",
                  marginBottom: "25px",
                  background: "#fff",
                }}
              >
                {/* =========================
                    ORDER HEADER
                ========================= */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3>
                    Order #{order._id}
                  </h3>

                  {!isEditing && (
                    <button
                      onClick={() =>
                        startEditing(order)
                      }
                    >
                      Edit Order
                    </button>
                  )}
                </div>

                {/* =========================
                    CUSTOMER
                ========================= */}

                <div
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <p>
                    <strong>
                      Customer:
                    </strong>{" "}
                    {order.user?.name ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>
                      Email:
                    </strong>{" "}
                    {order.user?.email ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>
                      Phone:
                    </strong>{" "}
                    {order.user?.phone ||
                      "N/A"}
                  </p>
                </div>

                {/* =========================
                    EDIT MODE
                ========================= */}

                {isEditing ? (
                  <div>
                    {/* DELIVERY ADDRESS */}

                    <div
                      style={{
                        marginBottom: "15px",
                      }}
                    >
                      <label>
                        <strong>
                          Delivery Address
                        </strong>
                      </label>

                      <input
                        type="text"
                        name="deliveryAddress"
                        value={
                          editForm.deliveryAddress
                        }
                        onChange={
                          handleFormChange
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                        }}
                      />
                    </div>

                    {/* PAYMENT METHOD */}

                    <div
                      style={{
                        marginBottom: "15px",
                      }}
                    >
                      <label>
                        <strong>
                          Payment Method
                        </strong>
                      </label>

                      <select
                        name="paymentMethod"
                        value={
                          editForm.paymentMethod
                        }
                        onChange={
                          handleFormChange
                        }
                        style={{
                          display: "block",
                          padding: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {PAYMENT_METHODS.map(
                          (method) => (
                            <option
                              key={method}
                              value={method}
                            >
                              {method}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* PAYMENT STATUS */}

                    <div
                      style={{
                        marginBottom: "15px",
                      }}
                    >
                      <label>
                        <strong>
                          Payment Status
                        </strong>
                      </label>

                      <select
                        name="paymentStatus"
                        value={
                          editForm.paymentStatus
                        }
                        onChange={
                          handleFormChange
                        }
                        style={{
                          display: "block",
                          padding: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {PAYMENT_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* ORDER STATUS */}

                    <div
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      <label>
                        <strong>
                          Order Status
                        </strong>
                      </label>

                      <select
                        name="orderStatus"
                        value={
                          editForm.orderStatus
                        }
                        onChange={
                          handleFormChange
                        }
                        style={{
                          display: "block",
                          padding: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {ORDER_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* ORDERED ITEMS */}

                    <div
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      <h3>
                        Ordered Items
                      </h3>

                      {editForm.items.map(
                        (item, index) => (
                          <div
                            key={`${item.food}-${index}`}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              padding:
                                "10px",
                              border:
                                "1px solid #ddd",
                              borderRadius:
                                "6px",
                              marginBottom:
                                "10px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                              }}
                            >
                              <strong>
                                {item.name}
                              </strong>

                              <div>
                                Rs.{" "}
                                {item.price}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  index
                                )
                              }
                              disabled={
                                item.quantity <=
                                1
                              }
                            >
                              −
                            </button>

                            <strong>
                              {item.quantity}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  index
                                )
                              }
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}

                      {/* ADD FOOD */}

                      <div
                        style={{
                          marginTop: "15px",
                        }}
                      >
                        <label>
                          <strong>
                            Add Food Item
                          </strong>
                        </label>

                        <select
                          defaultValue=""
                          onChange={addFood}
                          disabled={
                            foodsLoading
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "10px",
                            marginTop:
                              "5px",
                          }}
                        >
                          <option
                            value=""
                          >
                            {foodsLoading
                              ? "Loading foods..."
                              : "Select food to add"}
                          </option>

                          {foods.map(
                            (food) => (
                              <option
                                key={
                                  food._id
                                }
                                value={
                                  food._id
                                }
                              >
                                {food.name} — Rs.{" "}
                                {food.price}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* NEW TOTAL */}

                      <div
                        style={{
                          marginTop: "20px",
                          fontSize:
                            "18px",
                        }}
                      >
                        <strong>
                          New Subtotal:
                        </strong>{" "}
                        Rs.{" "}
                        {calculateEditSubtotal()}
                      </div>
                    </div>

                    {/* SAVE / CANCEL */}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          saveOrder(
                            order._id
                          )
                        }
                        disabled={
                          savingId ===
                          order._id
                        }
                      >
                        {savingId ===
                          order._id
                          ? "Saving..."
                          : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={
                          cancelEditing
                        }
                        disabled={
                          savingId ===
                          order._id
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* =========================
                     VIEW MODE
                  ========================= */

                  <div>
                    <p>
                      <strong>
                        Total:
                      </strong>{" "}
                      Rs.{" "}
                      {order.totalAmount}
                    </p>

                    <p>
                      <strong>
                        Payment:
                      </strong>{" "}
                      {order.paymentMethod}
                    </p>

                    <p>
                      <strong>
                        Payment Status:
                      </strong>{" "}
                      {order.paymentStatus}
                    </p>

                    <p>
                      <strong>
                        Order Status:
                      </strong>{" "}
                      {order.orderStatus}
                    </p>

                    <p>
                      <strong>
                        Delivery Address:
                      </strong>{" "}
                      {order.deliveryAddress}
                    </p>

                    <div>
                      <strong>
                        Ordered Items:
                      </strong>

                      <ul>
                        {order.items?.map(
                          (
                            item,
                            index
                          ) => (
                            <li
                              key={
                                index
                              }
                            >
                              {item.name} ×{" "}
                              {
                                item.quantity
                              }{" "}
                              — Rs.{" "}
                              {
                                item.subtotal
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <small>
                      Created:{" "}
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default AdminOrders;