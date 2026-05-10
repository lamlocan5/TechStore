package com.example.chatbot_service.util;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;

public class FunctionDefinitions {

    public static JsonObject getSearchProductsFunction() {
        JsonObject function = new JsonObject();
        function.addProperty("name", "search_products");
        function.addProperty("description",
            "Search for laptops and smartphones (điện thoại) based on user criteria like category, brand, price range, specs, keywords. " +
            "For smartphones, use keywords for features like camera, pin (battery), 5G, AMOLED, gaming, etc.");

        JsonObject parameters = new JsonObject();
        parameters.addProperty("type", "object");

        JsonObject properties = new JsonObject();

        // Category
        JsonObject category = new JsonObject();
        category.addProperty("type", "string");
        category.addProperty("description", "Product category: 'laptop' for laptops, 'smartphone' for điện thoại/phones");
        properties.add("category", category);

        // Brand
        JsonObject brand = new JsonObject();
        brand.addProperty("type", "string");
        brand.addProperty("description",
            "Brand name - Laptops: Dell, HP, Asus, Acer, Lenovo, MSI, Apple. " +
            "Smartphones: Apple, Samsung, Xiaomi, OPPO, Vivo, Realme, OnePlus, Google, Huawei");
        properties.add("brand", brand);

        // Min price
        JsonObject minPrice = new JsonObject();
        minPrice.addProperty("type", "number");
        minPrice.addProperty("description", "Minimum price in VND");
        properties.add("min_price", minPrice);

        // Max price
        JsonObject maxPrice = new JsonObject();
        maxPrice.addProperty("type", "number");
        maxPrice.addProperty("description", "Maximum price in VND");
        properties.add("max_price", maxPrice);

        // Keywords
        JsonObject keywords = new JsonObject();
        keywords.addProperty("type", "string");
        keywords.addProperty("description",
            "Keywords to search - Laptops: gaming, business, thin, light. " +
            "Smartphones: camera, selfie, pin (battery), sạc nhanh, 5G, AMOLED, 120Hz, gaming, chống nước");
        properties.add("keywords", keywords);

        // RAM
        JsonObject ramGb = new JsonObject();
        ramGb.addProperty("type", "number");
        ramGb.addProperty("description", "Minimum RAM in GB (applies to both laptops and smartphones)");
        properties.add("ram_gb", ramGb);

        // Storage
        JsonObject storageGb = new JsonObject();
        storageGb.addProperty("type", "number");
        storageGb.addProperty("description", "Minimum storage in GB (applies to both laptops and smartphones)");
        properties.add("storage_gb", storageGb);

        // Chipset (for smartphones)
        JsonObject chipset = new JsonObject();
        chipset.addProperty("type", "string");
        chipset.addProperty("description",
            "Chipset/processor for smartphones: Snapdragon, Exynos, MediaTek, Dimensity, Apple A-series");
        properties.add("chipset", chipset);

        // Limit
        JsonObject limit = new JsonObject();
        limit.addProperty("type", "number");
        limit.addProperty("description", "Number of results to return (max 10)");
        limit.addProperty("default", 5);
        properties.add("limit", limit);

        parameters.add("properties", properties);
        function.add("parameters", parameters);

        return function;
    }

    public static JsonObject getProductDetailsFunction() {
        JsonObject function = new JsonObject();
        function.addProperty("name", "get_product_details");
        function.addProperty("description", "Get detailed information about a specific product by ID");

        JsonObject parameters = new JsonObject();
        parameters.addProperty("type", "object");

        JsonObject properties = new JsonObject();

        // Product ID
        JsonObject productId = new JsonObject();
        productId.addProperty("type", "number");
        productId.addProperty("description", "The product ID");
        properties.add("product_id", productId);

        // Include variants
        JsonObject includeVariants = new JsonObject();
        includeVariants.addProperty("type", "boolean");
        includeVariants.addProperty("description", "Whether to include variant details");
        includeVariants.addProperty("default", true);
        properties.add("include_variants", includeVariants);

        parameters.add("properties", properties);

        JsonArray required = new JsonArray();
        required.add("product_id");
        parameters.add("required", required);

        function.add("parameters", parameters);

        return function;
    }

    public static JsonObject getCompareProductsFunction() {
        JsonObject function = new JsonObject();
        function.addProperty("name", "compare_products");
        function.addProperty("description", "Compare multiple products side by side");

        JsonObject parameters = new JsonObject();
        parameters.addProperty("type", "object");

        JsonObject properties = new JsonObject();

        // Product IDs
        JsonObject productIds = new JsonObject();
        productIds.addProperty("type", "array");

        JsonObject items = new JsonObject();
        items.addProperty("type", "number");
        productIds.add("items", items);

        productIds.addProperty("description", "Array of product IDs to compare (2-5 products)");
        properties.add("product_ids", productIds);

        parameters.add("properties", properties);

        JsonArray required = new JsonArray();
        required.add("product_ids");
        parameters.add("required", required);

        function.add("parameters", parameters);

        return function;
    }

    public static JsonArray getAllFunctions() {
        JsonArray functions = new JsonArray();
        functions.add(getSearchProductsFunction());
        functions.add(getProductDetailsFunction());
        // Removed compare_products function
        return functions;
    }
}
