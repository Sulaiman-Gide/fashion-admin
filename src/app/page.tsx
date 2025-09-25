"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadImageToCloudinary } from "@/app/utils/cloudinary";
import { supabase } from "@/app/lib/supabase";
import CustomToast from "@/app/components/CustomToast";

export default function UploadPage() {
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
  };

  const categoryOptions = [
    "All",
    "Men",
    "Women",
    "Kids",
    "Unisex",
    "Accessories",
    "Shoes",
    "Sale",
  ];

  interface ProductForm {
    name: string;
    description: string;
    price: string;
    category: string;
    subcategories: string;
    tags: string;
    gender: string;
    stock: string;
    images: string[];
  }

  const [form, setForm] = useState<ProductForm>({
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = async (files: FileList) => {
    setLoadingImages(true);
    const selectedFiles = [...files].slice(0, 3);
    const uploads = await Promise.all(
      selectedFiles.map((file) => uploadImageToCloudinary(file))
    );
    setForm((prev) => ({ ...prev, images: uploads }));
    setLoadingImages(false);
  };

  const submitProduct = async () => {
    if (
      !form.name ||
      !form.description ||
      !form.price ||
      !form.category ||
      !form.stock ||
      form.images.length !== 3
    ) {
      showToast("Please fill all fields and upload 3 images.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: form.name,
            description: form.description,
            images: form.images,
            price: parseFloat(form.price),
            category: form.category.toLowerCase(),
            sizes: form.subcategories
              .split(",")
              .map((x) => x.trim().toLowerCase()),
            colors: form.tags.split(",").map((x) => x.trim().toLowerCase()),
            stock: parseInt(form.stock),
            gender: form.gender,
            view_count: 0,
            purchase_count: 0,
          },
        ])
        .select();

      if (error) throw error;

      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        subcategories: "",
        gender: "unisex",
        tags: "",
        stock: "",
        images: [],
      });

      showToast("Product uploaded!", "success");
    } catch (error) {
      showToast("Upload failed. Please try again.", "error");
      console.log(error);
    }

    setSubmitting(false);
  };

  return (
    <>
      <CustomToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Upload New Product
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Product Name
              </label>
              <input
                id="name"
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="price"
                className="text-sm font-medium text-gray-700"
              >
                Price (₦)
              </label>
              <input
                id="price"
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="stock"
                className="text-sm font-medium text-gray-700"
              >
                Stock Quantity
              </label>
              <input
                id="stock"
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="category"
                className="text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm text-black"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option.toLowerCase()}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="subcategories"
                className="text-sm font-medium text-gray-700"
              >
                Subcategories (comma-separated)
              </label>
              <input
                id="subcategories"
                placeholder="e.g. shirts, pants"
                value={form.subcategories}
                onChange={(e) =>
                  setForm({ ...form, subcategories: e.target.value })
                }
                className="text-sm text-black border rounded-lg px-4 py-2"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label
                htmlFor="tags"
                className="text-sm font-medium text-gray-700"
              >
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                placeholder="e.g. casual, summer"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="text-sm text-black border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Product Description
            </label>
            <textarea
              id="description"
              placeholder="Describe the product"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full text-sm text-black border rounded-lg px-4 py-2 h-28 resize-none"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="images"
              className="text-sm font-medium text-gray-700"
            >
              Upload Images (3 max)
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files!)}
              className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {loadingImages && (
              <p className="text-sm mt-2 text-gray-500">Uploading images...</p>
            )}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {form.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={submitProduct}
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 text-lg rounded-lg font-[400] hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Product"}
          </button>
        </div>
      </div>
    </>
  );
}
