"use client";

import { useEffect, useState, useRef } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import CustomToast from "../components/CustomToast";

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string;
  created_at: string;
  user_name: string;
  user_email: string;
  status: string;
  total: number;
  products: Product[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const previousOrders = useRef<Order[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Set up polling every 15 seconds
    const pollingInterval = setInterval(() => {
      console.log("Polling for order updates...");
      fetchOrders();
    }, 15000); // 15 seconds

    // Cleanup on component unmount
    return () => {
      console.log("Cleaning up polling interval");
      clearInterval(pollingInterval);
    };
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(Date.now());
  };

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchOrders = async () => {
    try {
      if (orders.length === 0) setLoading(true);
      const { data, error } = await supabase
        .from("activity")
        .select("*")
        .neq("status", "view")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const formattedData = (data || []).map((order) => ({
        ...order,
        products: Array.isArray(order.products) ? order.products : [],
      }));

      // Check for new orders
      if (previousOrders.current.length > 0 && formattedData.length > 0) {
        const newOrders = formattedData.filter(
          (newOrder) =>
            !previousOrders.current.some(
              (prevOrder) => prevOrder.id === newOrder.id
            )
        );

        if (newOrders.length > 0) {
          const customerNames = [
            ...new Set(newOrders.map((order) => order.user_name)),
          ];
          const message = `New order${
            newOrders.length > 1 ? "s" : ""
          } from ${customerNames.join(", ")}`;
          showNotification(message, "success");

          // Play notification sound
          if (typeof window !== "undefined") {
            const audio = new Audio("/notification.mp3");
            audio.play().catch((e) => console.log("Audio play failed:", e));
          }
        }
      }

      previousOrders.current = [...formattedData];
      setOrders(formattedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      // Add more status types as needed
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] ||
          "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  // No loading spinner - we'll show the table immediately

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={fetchOrders}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CustomToast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-right mb-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center"
            disabled={loading}
          >
            <svg
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                Object.entries(
                  orders.reduce((acc: Record<string, Order[]>, order) => {
                    if (!acc[order.user_name]) {
                      acc[order.user_name] = [];
                    }
                    acc[order.user_name].push(order);
                    return acc;
                  }, {})
                ).map(([customerName, customerOrders]) => (
                  <React.Fragment key={customerName}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={6}
                        className="px-6 py-2 text-sm font-medium text-gray-900"
                      >
                        {customerName}
                      </td>
                    </tr>
                    {customerOrders.map((order: Order) => (
                      <tr
                        key={order.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {order.id.split("-")[0]}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {order.products?.map((product, idx) => {
                              const productTotal =
                                (product.quantity || 0) * (product.price || 0);
                              return (
                                <div
                                  key={`${product.id}-${idx}`}
                                  className="flex items-start py-1 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex justify-between">
                                      <span>
                                        {product.quantity} × ₦
                                        {product.price.toFixed(2)}
                                      </span>
                                      <span className="font-medium">
                                        ₦{productTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ₦
                          {order.products
                            ?.reduce(
                              (sum, product) =>
                                sum +
                                (product.quantity || 0) * (product.price || 0),
                              0
                            )
                            .toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
