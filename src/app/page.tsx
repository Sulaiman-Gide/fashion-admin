"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadImageToCloudinary } from "@/app/utils/cloudinary";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function UploadPage() {
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategories: "",
    gender: "unisex",
    brand: "",
    tags: "",
    stock: "",
    images: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return () => unsubscribe();
  }, []);

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
      !form.gender ||
      !form.brand ||
      !form.stock ||
      form.images.length !== 3
    ) {
      alert("Please fill all required fields and upload 3 images.");
      return;
    }

    setSubmitting(true);

    await addDoc(collection(db, "products"), {
      name: form.name,
      description: form.description,
      images: form.images,
      price: parseFloat(form.price),
      category: form.category.toLowerCase(),
      subcategories: form.subcategories
        .split(",")
        .map((x) => x.trim().toLowerCase()),
      gender: form.gender,
      brand: form.brand,
      rating: 0,
      createdAt: serverTimestamp(),
      tags: form.tags.split(",").map((x) => x.trim().toLowerCase()),
      stock: parseInt(form.stock),
    });

    setSubmitting(false);
    alert("Product uploaded!");
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      subcategories: "",
      gender: "unisex",
      brand: "",
      tags: "",
      stock: "",
      images: [],
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Upload New Product</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-4 py-2 text-sm text-black"
          />
          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="border rounded-lg px-4 py-2 text-sm text-black"
          />
          <input
            type="number"
            placeholder="Price (₦)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border rounded-lg px-4 py-2 text-sm text-black"
          />
          <input
            type="number"
            placeholder="Stock Quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="border rounded-lg px-4 py-2 text-sm text-black"
          />
          <input
            placeholder="Category (e.g. hoodie)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded-lg px-4 py-2 text-sm text-black"
          />
          <select
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
          <input
            placeholder="Subcategories (comma-separated)"
            value={form.subcategories}
            onChange={(e) =>
              setForm({ ...form, subcategories: e.target.value })
            }
            className="text-sm text-black border rounded-lg px-4 py-2 col-span-full"
          />
          <input
            placeholder="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="text-sm text-black border rounded-lg px-4 py-2 col-span-full"
          />
        </div>

        <textarea
          placeholder="Product Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full text-sm text-black border rounded-lg px-4 py-2 h-28 resize-none"
        />

        <div>
          <input
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
  );
}
