
import { useEffect, useState } from "react";

import {
  getFoodsApi,
  createFoodApi,
  updateFoodApi,
  deleteFoodApi,
  updateFoodAvailabilityApi,
} from "../api/food.api";

import { getCategoriesApi } from "../api/category.api";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  preparationTime: "",
  isAvailable: true,
  isVegetarian: false,
  image: null,
};

function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [foodResponse, categoryResponse] = await Promise.all([
        getFoodsApi(),
        getCategoriesApi(),
      ]);

      setFoods(
        foodResponse?.data?.foods ||
        foodResponse?.foods ||
        []
      );

      setCategories(
        categoryResponse?.data?.categories ||
        categoryResponse?.categories ||
        []
      );
    } catch (err) {
      console.error("Load data error:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load foods and categories."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async () => {
    try {
      const response = await getFoodsApi();

      console.log("FOODS FROM SERVER:", response);

      const foodsData =
        response?.data?.foods ||
        response?.foods ||
        [];

      console.log("FOODS SET TO STATE:", foodsData);

      setFoods(foodsData);
    } catch (err) {
      console.error("Load foods error:", err);

      setError("Failed to load foods.");
    }
  };

  // =========================
  // FORM HANDLING
  // =========================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================
  // IMAGE HANDLING
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("IMAGE SELECTED:", file);
    console.log("IMAGE NAME:", file.name);
    console.log("IMAGE TYPE:", file.type);
    console.log("IMAGE SIZE:", file.size);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setError("");

    // Store actual File object
    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    // Revoke old blob preview
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    // Create new preview
    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm(initialForm);
    setPreview("");
    setEditingId(null);
    setError("");
  };

  // =========================
  // CREATE / UPDATE FOOD
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------
    // Validation
    // -------------------------

    if (!form.name.trim()) {
      setError("Food name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Food description is required.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Please enter a valid food price.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (
      !form.preparationTime ||
      Number(form.preparationTime) <= 0
    ) {
      setError("Please enter a valid preparation time.");
      return;
    }

    try {
      setSaving(true);

      // =========================
      // CREATE FORMDATA
      // =========================

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "price",
        String(form.price)
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "preparationTime",
        String(form.preparationTime)
      );

      formData.append(
        "isAvailable",
        String(form.isAvailable)
      );

      formData.append(
        "isVegetarian",
        String(form.isVegetarian)
      );

      // =========================
      // IMPORTANT IMAGE CODE
      // =========================

      console.log(
        "FORM IMAGE:",
        form.image
      );

      console.log(
        "IS FILE:",
        form.image instanceof File
      );

      if (form.image instanceof File) {
        formData.append(
          "image",
          form.image,
          form.image.name
        );

        console.log(
          "IMAGE APPENDED TO FORMDATA:",
          form.image.name
        );
      } else {
        console.log(
          "NO NEW IMAGE SELECTED"
        );
      }

      // Debug FormData
      for (const [key, value] of formData.entries()) {
        console.log(
          "FORMDATA:",
          key,
          value
        );
      }

      // =========================
      // API REQUEST
      // =========================

      let response;

      if (editingId) {
        // UPDATE EXISTING FOOD

        response = await updateFoodApi(
          editingId,
          formData
        );

        console.log(
          "UPDATE RESPONSE:",
          response
        );

        setSuccess(
          "Food updated successfully."
        );
      } else {
        // CREATE NEW FOOD

        response = await createFoodApi(
          formData
        );

        console.log(
          "CREATE RESPONSE:",
          response
        );

        setSuccess(
          "Food added successfully."
        );
      }

      // =========================
      // REFRESH FOOD LIST
      // =========================

      await loadFoods();

      // =========================
      // RESET FORM
      // =========================

      resetForm();
    } catch (err) {
      console.error(
        "Food save error:",
        err
      );

      console.error(
        "Server response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
        "Failed to save food."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT FOOD
  // =========================

  const handleEdit = (food) => {
    setError("");
    setSuccess("");

    setEditingId(food._id);

    setForm({
      name: food.name || "",

      description:
        food.description || "",

      price:
        food.price ?? "",

      category:
        food.category?._id ||
        food.category ||
        "",

      preparationTime:
        food.preparationTime ?? "",

      isAvailable:
        food.isAvailable ?? true,

      isVegetarian:
        food.isVegetarian ?? false,

      // IMPORTANT:
      // null means no NEW image selected.
      // Existing image is kept by backend.
      image: null,
    });

    // Show existing image
    setPreview(
      food.image || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE FOOD
  // =========================

  const handleDelete = async (foodId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteFoodApi(foodId);

      setSuccess(
        "Food deleted successfully."
      );

      await loadFoods();

      if (editingId === foodId) {
        resetForm();
      }
    } catch (err) {
      console.error(
        "Delete food error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete food."
      );
    }
  };

  // =========================
  // AVAILABILITY
  // =========================

  const handleAvailability = async (food) => {
    try {
      setError("");
      setSuccess("");

      await updateFoodAvailabilityApi(
        food._id,
        !food.isAvailable
      );

      setSuccess(
        food.isAvailable
          ? "Food marked as unavailable."
          : "Food marked as available."
      );

      await loadFoods();
    } catch (err) {
      console.error(
        "Availability update error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to update availability."
      );
    }
  };

  // =========================
  // FILTER FOODS
  // =========================

  const filteredFoods =
    selectedCategory === "ALL"
      ? foods
      : foods.filter((food) => {
        const categoryId =
          food.category?._id ||
          food.category;

        return (
          String(categoryId) ===
          String(selectedCategory)
        );
      });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main
        style={{
          padding: "40px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h2>
          Loading food management...
        </h2>
      </main>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>
        Admin Food Management
      </h1>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#b00020",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "6px",
            border: "1px solid #ffb3b3",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            background: "#e5ffe8",
            color: "#087f23",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "6px",
            border: "1px solid #a8e6af",
          }}
        >
          {success}
        </div>
      )}

      {/* =========================
          FOOD FORM
      ========================= */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "25px",
          marginBottom: "40px",
        }}
      >
        <h2>
          {editingId
            ? "Edit Food Item"
            : "Add New Food Item"}
        </h2>

        {categories.length === 0 && (
          <p style={{ color: "red" }}>
            No categories available.
            Create a category first.
          </p>
        )}

        <form onSubmit={handleSubmit}>

          {/* FOOD NAME */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Food Name
              </strong>
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Chicken Pizza"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* DESCRIPTION */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Description
              </strong>
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Food description"
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* CATEGORY */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Category
              </strong>
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
              }}
            >
              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* PRICE */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Price (Rs.)
              </strong>
            </label>

            <input
              type="number"
              name="price"
              min="1"
              value={form.price}
              onChange={handleChange}
              placeholder="500"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* PREPARATION TIME */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Preparation Time (minutes)
              </strong>
            </label>

            <input
              type="number"
              name="preparationTime"
              min="1"
              max="180"
              value={
                form.preparationTime
              }
              onChange={handleChange}
              placeholder="20"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* IMAGE */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              <strong>
                Food Image
              </strong>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageChange
              }
              style={{
                display: "block",
                marginTop: "8px",
              }}
            />

            {editingId && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#666",
                }}
              >
                Select a new image only
                if you want to replace
                the existing image.
              </small>
            )}
          </div>

          {/* IMAGE PREVIEW */}

          {preview && (
            <div
              style={{
                marginBottom: "15px",
              }}
            >
              <p>
                <strong>
                  Image Preview
                </strong>
              </p>

              <img
                src={preview}
                alt="Food preview"
                style={{
                  width: "180px",
                  height: "130px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border:
                    "1px solid #ddd",
                }}
              />
            </div>
          )}

          {/* OPTIONS */}

          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: "30px",
              flexWrap: "wrap",
            }}
          >
            <label>
              <input
                type="checkbox"
                name="isAvailable"
                checked={
                  form.isAvailable
                }
                onChange={
                  handleChange
                }
              />{" "}
              Available
            </label>

            <label>
              <input
                type="checkbox"
                name="isVegetarian"
                checked={
                  form.isVegetarian
                }
                onChange={
                  handleChange
                }
              />{" "}
              Vegetarian
            </label>
          </div>

          {/* BUTTONS */}

          <button
            type="submit"
            disabled={
              saving ||
              categories.length === 0
            }
            style={{
              padding: "12px 20px",
              marginRight: "10px",
              cursor:
                saving ||
                  categories.length === 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Food"
                : "Add Food"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={{
                padding:
                  "12px 20px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      {/* =========================
          CATEGORY FILTER
      ========================= */}

      <section
        style={{
          marginBottom: "25px",
        }}
      >
        <h2>
          Food Items
        </h2>

        <select
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            minWidth: "250px",
          }}
        >
          <option value="ALL">
            All Categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category._id}
                value={category._id}
              >
                {category.name}
              </option>
            )
          )}
        </select>
      </section>

      {/* =========================
          FOOD LIST
      ========================= */}

      {filteredFoods.length === 0 ? (
        <p>
          No food items found.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredFoods.map(
            (food) => (
              <div
                key={food._id}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                  padding: "15px",
                }}
              >
                {/* IMAGE */}

                {food.image ? (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      borderRadius: "8px",
                      background: "#eee",
                    }}
                  >
                    <img
                      src={food.image}
                      alt={food.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      background: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* DETAILS */}

                <h3>
                  {food.name}
                </h3>

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  {food.category
                    ?.name ||
                    "Unknown"}
                </p>

                <p>
                  {food.description ||
                    "No description"}
                </p>

                <p>
                  <strong>
                    Rs.{" "}
                    {food.price}
                  </strong>
                </p>

                <p>
                  Preparation:{" "}
                  {
                    food.preparationTime
                  }{" "}
                  minutes
                </p>

                <p>
                  {food.isVegetarian
                    ? "🌱 Vegetarian"
                    : "🍗 Non-Vegetarian"}
                </p>

                <p>
                  Status:{" "}
                  <strong>
                    {food.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </strong>
                </p>

                {/* ACTION BUTTONS */}

                <div
                  style={{
                    display: "flex",
                    flexWrap:
                      "wrap",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        food
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAvailability(
                        food
                      )
                    }
                  >
                    {food.isAvailable
                      ? "Mark Unavailable"
                      : "Mark Available"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        food._id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}

export default AdminFoods;