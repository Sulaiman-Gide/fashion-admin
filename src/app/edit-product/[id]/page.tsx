"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { supabase } from "@/app/lib/supabase";
import { uploadImageToCloudinary } from "@/app/utils/cloudinary";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategories: "",
    gender: "unisex",
    tags: "",
    stock: "",
    images: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        await fetchProduct();
      }
    });
    return () => unsubscribe();
  }, [id, router]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        subcategories: data.sizes?.join(", ") || "",
        gender: data.gender || "unisex",
        tags: data.colors?.join(", ") || "",
        stock: data.stock?.toString() || "",
        images: data.images || [],
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      showToast("Failed to load product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setLoadingImages(true);
    try {
      const selectedFiles = [...files].slice(0, 3);
      const uploads = await Promise.all(
        selectedFiles.map((file) => uploadImageToCloudinary(file))
      );
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploads].slice(0, 3),
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      showToast("Failed to upload images", "error");
    } finally {
      setLoadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.description ||
      !form.price ||
      !form.category ||
      !form.stock ||
      form.images.length === 0
    ) {
      showToast(
        "Please fill all required fields and upload at least one image.",
        "error"
      );
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          category: form.category.toLowerCase(),
          sizes: form.subcategories
            .split(",")
            .map((x) => x.trim().toLowerCase()),
          colors: form.tags.split(",").map((x) => x.trim().toLowerCase()),
          stock: parseInt(form.stock),
          gender: form.gender,
          updated_at: new Date().toISOString(),
          images: form.images,
        })
        .eq("id", id);

      if (error) throw error;

      showToast("Product updated successfully!", "success");
      setTimeout(() => router.push("/products"), 1000);
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("Failed to update product. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Products
          </button>
        </div>

        {toast.visible && (
          <div
            className={`p-4 rounded-lg ${
              toast.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Price (₦) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Stock *
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
                required
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={form.subcategories}
                onChange={(e) =>
                  setForm({ ...form, subcategories: e.target.value })
                }
                placeholder="e.g. S, M, L, XL"
                className="border rounded-lg px-4 py-2 text-sm text-black"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Colors (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. red, blue, green"
                className="border rounded-lg px-4 py-2 text-sm text-black"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="border rounded-lg px-4 py-2 text-sm text-black w-full"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Product Images *
              <span className="text-xs text-gray-500 ml-2">
                (Max 3 images, first image will be the main display)
              </span>
            </label>
            <div className="flex flex-wrap gap-4">
              {form.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="h-32 w-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {form.images.length < 3 && (
                <label className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      e.target.files && handleImageUpload(e.target.files)
                    }
                  />
                  <div className="text-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mx-auto text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-xs text-gray-500">Add Image</span>
                  </div>
                </label>
              )}
            </div>
            {loadingImages && (
              <div className="text-sm text-gray-500">Uploading images...</div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
