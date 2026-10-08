import { useEffect, useState } from "react";

import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../api/category.api";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: null,
  });

  const [preview, setPreview] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const response = await getCategoriesApi();

      setCategories(
        response.data?.categories || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setPreview(
      URL.createObjectURL(file)
    );
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      image: null,
    });

    setPreview("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Category name is required");
        return;
      }

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      if (editingId) {
        await updateCategoryApi(
          editingId,
          formData
        );

        setSuccess(
          "Category updated successfully"
        );
      } else {
        await createCategoryApi(
          formData
        );

        setSuccess(
          "Category created successfully"
        );
      }

      resetForm();
      loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Operation failed"
      );
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);

    setForm({
      name: category.name || "",
      description:
        category.description || "",
      image: null,
    });

    setPreview(category.image || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteCategoryApi(categoryId);

      setSuccess(
        "Category deleted successfully"
      );

      loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to delete category"
      );
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>Loading categories...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>
        Admin Category Management
      </h1>

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "red",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "5px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#e5ffe8",
            color: "green",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "5px",
          }}
        >
          {success}
        </div>
      )}

      {/* CATEGORY FORM */}

      <section
        style={{
          border: "1px solid #ddd",
          padding: "25px",
          borderRadius: "10px",
          marginBottom: "40px",
        }}
      >
        <h2>
          {editingId
            ? "Edit Category"
            : "Add New Category"}
        </h2>

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label>
              Category Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter category name"
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
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter category description"
              rows="4"
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
              Category Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                display: "block",
                marginTop: "8px",
              }}
            />
          </div>

          {/* IMAGE PREVIEW */}

          {preview && (
            <div
              style={{
                marginBottom: "15px",
              }}
            >
              <p>Image Preview:</p>

              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "150px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: "12px 20px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          >
            {editingId
              ? "Update Category"
              : "Create Category"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
              }}
            >
              Cancel Edit
            </button>
          )}

        </form>
      </section>

      {/* CATEGORY LIST */}

      <section>
        <h2>
          Existing Categories
        </h2>

        {categories.length === 0 ? (
          <p>
            No categories found.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {categories.map((category) => (
              <div
                key={category._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                }}
              >
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}

                <h3>
                  {category.name}
                </h3>

                <p>
                  {category.description ||
                    "No description"}
                </p>

                <button
                  onClick={() =>
                    handleEdit(category)
                  }
                  style={{
                    padding: "8px 12px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(category._id)
                  }
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>

              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}

export default AdminCategories;