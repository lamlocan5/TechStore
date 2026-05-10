#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math
import time
import json
import sys
from pathlib import Path
import mimetypes  # <-- Thêm thư viện
from urllib.parse import urlparse  # <-- Thêm thư viện

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ================== CONFIG ==================
API_LIST_URL = "https://discovery.tekoapis.com/api/v2/search-skus-v2"
API_DETAIL_URL = "https://discovery.tekoapis.com/api/v1/product"

TERMINAL_ID = 4
SLUG = "/c/laptop"

PAGE_SIZE = 40  # server có thể override; script đọc lại từ response
START_PAGE = 1
SLEEP_LIST = 0.25  # delay giữa các trang (giây)
SLEEP_ITEM = 0.20  # delay giữa các SKU (giây)

OUT_DIR = Path("dataset")  # Thư mục gốc
SKU_LIST_FILE = Path("laptopSkus.txt")
ERRORS_FILE = Path("../errors.txt")

HEADERS_LIST = {
    "accept": "*/*",
    "accept-language": "vi",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "origin": "https://phongvu.vn",
    "pragma": "no-cache",
    "referer": "https://phongvu.vn/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
}
HEADERS_DETAIL = {
    "accept": "*/*",
    "accept-language": "vi",
    "cache-control": "no-cache",
    "origin": "https://phongvu.vn",
    "pragma": "no-cache",
    "referer": "https://phongvu.vn/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
}

SORTING = {"sort": "SORT_BY_CREATED_AT", "order": "ORDER_BY_DESCENDING"}


def make_session():
    s = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=0.6,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retries))
    return s


def fetch_page(session: requests.Session, page: int, page_size: int):
    payload = {
        "terminalId": TERMINAL_ID,
        "page": page,
        "pageSize": page_size,
        "slug": SLUG,
        "filter": {},
        "sorting": SORTING,
        "returnFilterable": [],
        "isNeedFeaturedProducts": True,
    }
    resp = session.post(API_LIST_URL, headers=HEADERS_LIST, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_product_detail(session: requests.Session, sku: str):
    """
    Tương đương lệnh curl:
    curl "https://discovery.tekoapis.com/api/v1/product?sku=<SKU>&location=&terminalCode=phongvu"
    """
    params = {
        "sku": sku,
        "location": "",
        "terminalCode": "phongvu",
    }
    resp = session.get(API_DETAIL_URL, headers=HEADERS_DETAIL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    session = make_session()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # reset file output
    if SKU_LIST_FILE.exists():
        SKU_LIST_FILE.unlink()
    if ERRORS_FILE.exists():
        ERRORS_FILE.unlink()

    with SKU_LIST_FILE.open("a", encoding="utf-8") as out_skus, \
            ERRORS_FILE.open("a", encoding="utf-8") as out_err:

        # 1) Gọi trang đầu để lấy tổng số trang
        try:
            first = fetch_page(session, START_PAGE, PAGE_SIZE)
        except Exception as e_first:
            print(f"[!] Lỗi nghiêm trọng khi tải trang đầu tiên: {e_first}", file=sys.stderr)
            sys.exit(1)

        if first.get("code") != 200:
            print(f"[!] Trang đầu trả về mã lỗi body: {first.get('code')}", file=sys.stderr)
            sys.exit(1)

        d0 = first.get("data") or {}
        cur_page = d0.get("page", START_PAGE)
        resp_page_size = d0.get("pageSize", PAGE_SIZE)
        total = d0.get("total", 0)
        total_pages = math.ceil(total / resp_page_size) if total and resp_page_size else START_PAGE

        seen = set()
        wrote = 0

        # ================== HÀM XỬ LÝ SẢN PHẨM ĐÃ CẬP NHẬT ==================
        def handle_products(products, page_num, total_pages_):
            nonlocal wrote
            page_wrote = 0
            for p in products or []:
                sku = (p or {}).get("sku")
                if not sku or sku in seen:
                    continue

                # Ghi SKU vào file laptopSkus.txt
                out_skus.write(str(sku) + "\n")
                out_skus.flush()
                seen.add(sku)
                page_wrote += 1
                wrote += 1

                # 1) Lấy JSON chi tiết (chỉ để lấy slug và link ảnh)
                try:
                    js = fetch_product_detail(session, str(sku))

                    # --- MỚI: Lấy slug từ JSON ---
                    product_info = js.get("result", {}).get("product", {}).get("productInfo", {})
                    slug = product_info.get("slug")
                    if not slug:
                        print(f"[WARN] SKU {sku} không có slug, dùng SKU làm tên thư mục.")
                        slug = str(sku)  # Fallback nếu không có slug
                    # --- KẾT THÚC MỚI ---

                    # ============ BẮT ĐẦU CODE TẢI ẢNH ============
                    try:
                        # --- MỚI: Dùng slug làm tên thư mục ---
                        img_save_dir = OUT_DIR / str(slug)
                        img_save_dir.mkdir(parents=True, exist_ok=True)

                        images_list = js.get("result", {}).get("product", {}).get("productDetail", {}).get("images", [])

                        if not images_list:
                            print(f"  [INFO] SKU {sku} (slug: {slug}) không có ảnh nào để tải.")
                            continue  # Chuyển sang sản phẩm tiếp theo

                        total_imgs = len(images_list)
                        downloaded_count = 0

                        # --- MỚI: Dùng enumerate để đếm (bắt đầu từ 1) ---
                        for i, img_data in enumerate(images_list, start=1):
                            img_url = img_data.get("url")
                            if not img_url:
                                continue

                            try:
                                img_resp = session.get(img_url, timeout=15)
                                img_resp.raise_for_status()

                                # Đoán đuôi file
                                content_type = img_resp.headers.get('Content-Type', 'image/jpeg')
                                ext = mimetypes.guess_extension(content_type)
                                if not ext or ext == ".jpe":
                                    ext = '.jpg'

                                # --- MỚI: Đặt tên file dạng img_01.jpg, img_02.jpg ---
                                filename = f"img_{i:02d}{ext}"  # :02d = pad số 0 (01, 02, ... 10, 11)
                                img_save_path = img_save_dir / filename

                                img_save_path.write_bytes(img_resp.content)
                                downloaded_count += 1

                            except Exception as img_e:
                                msg = f"{sku}\t__image__\t{img_url}\t{repr(img_e)}\n"
                                out_err.write(msg)
                                out_err.flush()
                                print(f"  [WARN] tải ảnh thất bại cho {slug} ({img_url}): {img_e}")
                                time.sleep(0.1)

                                # --- MỚI: Log sau khi tải xong 1 sản phẩm ---
                        if total_imgs > 0:
                            if downloaded_count == total_imgs:
                                print(f"  [OK] Đã tải thành công {downloaded_count}/{total_imgs} ảnh cho: {slug}")
                            else:
                                print(f"  [WARN] Chỉ tải được {downloaded_count}/{total_imgs} ảnh cho: {slug}")
                        # --- KẾT THÚC MỚI ---

                    except Exception as e_img_block:
                        msg = f"{sku}\t__image_block__\t{repr(e_img_block)}\n"
                        out_err.write(msg)
                        out_err.flush()
                        print(f"  [WARN] khối xử lý ảnh thất bại cho {slug}: {e_img_block}")
                    # ============= KẾT THÚC CODE TẢI ẢNH =============

                except Exception as e:
                    # Lỗi khi fetch_product_detail thất bại
                    msg = f"{sku}\t{repr(e)}\n"
                    out_err.write(msg)
                    out_err.flush()
                    print(f"[WARN] lấy chi tiết sản phẩm thất bại cho {sku}: {e}")

                time.sleep(SLEEP_ITEM)  # throttle nhẹ

            print(f"[+] Trang {page_num}/{total_pages_}: đã xử lý {page_wrote} SKUs (tổng cộng: {len(seen)})")

        # ================== KẾT THÚC HÀM XỬ LÝ ==================

        # xử lý trang đầu
        handle_products(d0.get("products"), cur_page, total_pages)
        time.sleep(SLEEP_LIST)

        # xử lý các trang tiếp theo
        for page in range(cur_page + 1, total_pages + 1):
            try:
                js = fetch_page(session, page, resp_page_size)
            except Exception as e:
                out_err.write(f"__page__\t{page}\t{repr(e)}\n")
                out_err.flush()
                print(f"[WARN] list page fetch failed @ {page}: {e}")
                break

            if js.get("code") != 200:
                out_err.write(f"__page__\t{page}\tcode:{js.get('code')}\n")
                out_err.flush()
                print(f"[!] Page {page} returned non-200 code in body: {js.get('code')}")
                break

            d = js.get("data") or {}
            handle_products(d.get("products"), page, total_pages)
            time.sleep(SLEEP_LIST)

        print(f"✅ Hoàn tất. Đã xử lý {len(seen)} SKUs (danh sách lưu tại {SKU_LIST_FILE.resolve()})")
        print(f"📁 Ảnh đã được lưu vào thư mục con bên trong: {OUT_DIR.resolve() / 'images'}")

        # Nếu không có lỗi, xoá errors file cho sạch
        try:
            if ERRORS_FILE.exists() and ERRORS_FILE.stat().st_size == 0:
                ERRORS_FILE.unlink(missing_ok=True)
        except Exception:
            pass


if __name__ == "__main__":
    main()