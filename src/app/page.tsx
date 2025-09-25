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
      const { error } = await supabase
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
      <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Upload New Product
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new product to your inventory
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="block w-full pl-7 pr-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-gray-700"
              >
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="stock"
                  type="number"
                  placeholder="Enter stock quantity"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  required
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  required
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="subcategories"
                className="block text-sm font-medium text-gray-700"
              >
                Sizes (comma-separated)
              </label>
              <div className="mt-1">
                <input
                  id="subcategories"
                  type="text"
                  placeholder="e.g. S, M, L, XL"
                  value={form.subcategories}
                  onChange={(e) =>
                    setForm({ ...form, subcategories: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Separate sizes with commas
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                Colors (comma-separated)
              </label>
              <div className="mt-1">
                <input
                  id="tags"
                  type="text"
                  placeholder="e.g. red, blue, green"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Separate colors with commas
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Product Description <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={4}
                placeholder="Enter product description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Images <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Upload exactly 3 images. The first image will be used as the
                main display.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {form.images.length > 0 ? (
                form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...form.images];
                        newImages.splice(i, 1);
                        setForm({ ...form, images: newImages });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      aria-label={`Remove image ${i + 1}`}
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
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="images"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload images</span>
                        <input
                          id="images"
                          name="images"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageUpload(e.target.files);
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {form.images.length > 0 && form.images.length < 3 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors p-4">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple={form.images.length <= 1}
                    onChange={(e) =>
                      e.target.files && handleImageUpload(e.target.files)
                    }
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="mt-1 text-xs text-center text-gray-500">
                    Add {3 - form.images.length} more
                  </span>
                </label>
              )}
            </div>

            {loadingImages && (
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading images...
              </div>
            )}

            {form.images.length === 0 && (
              <p className="text-xs text-red-600">
                At least one image is required
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={submitProduct}
              disabled={submitting || form.images.length !== 3}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading Product...
                </>
              ) : (
                "Submit Product"
              )}
            </button>

            {form.images.length > 0 && form.images.length < 3 && (
              <p className="mt-2 text-sm text-red-600 text-center">
                Please upload exactly 3 images ({3 - form.images.length} more
                required)
              </p>
            )}

            <p className="mt-3 text-xs text-gray-500 text-center">
              Make sure all information is correct before submitting
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
