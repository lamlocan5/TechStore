"use client";

import { useEffect, useState } from "react";

export default function APITestPage() {
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        // Test API without auth
        fetch("http://localhost:8888/api/v1/product/products?page=1&limit=5")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => setResult(data))
            .catch((err) => setError(err.message));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">API Test - Products Endpoint</h1>

            <div className="mb-4">
                <strong>Endpoint:</strong> GET /product/products?page=1&limit=5
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <strong>Success!</strong>
                    <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            {!result && !error && (
                <div className="text-gray-500">Loading...</div>
            )}
        </div>
    );
}
