"""
Example Usage: Custom Dataset Download
Shows how to use the download_dataset.py script with your own image URLs.
"""

from download_dataset import create_dataset, print_statistics

# Your custom image dataset
# Replace these with your actual image URLs
images = {
    # ASUS laptops
    "asus_rog_strix": [
        "https://dlcdnwebimgs.asus.com/gain/E0275281-F18B-42C3-A025-3331C35A888F",
    ],

    # Apple MacBook
    "macbook_pro_14": [
        "https://www.apple.com/v/macbook-pro/au/images/overview/product-viewer/pv_hero_endframe__b69evl1aibiu_large.jpg",
        "https://www.apple.com/v/macbook-pro/au/images/overview/product-viewer/pv_colors_spaceblack__9ja3btfshpuq_large.jpg",
        "https://www.apple.com/v/macbook-pro/au/images/overview/product-viewer/pv_colors_silver__bnbenbl45l9e_large.jpg",
    ],

    "macbook_air_13": [
        "https://www.apple.com/v/macbook-air/w/images/overview/hero/hero_static__c9sislzzicq6_large.png",
        "https://www.apple.com/v/macbook-air/w/images/overview/design/design_hero_endframe__dv7t8042ce6a_large.jpg",
    ],

    # ASUS ZenBook
    "asus_zenbook_14_oled": [
        "https://dlcdnwebimgs.asus.com/gain/03506954-4dfb-473a-b057-db5554d6d9e8/",
        "https://dlcdnwebimgs.asus.com/gain/2520d5e0-be26-41d0-be04-fc6ebfd289c1/",
        "https://dlcdnwebimgs.asus.com/gain/e83f2ab1-5fc0-4e3e-8475-12b582e0717b/",
    ],

    # Dell XPS
    "dell_xps_14": [
        "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/14-9440/media-gallery/notebook-xps-14-9440t-sl-gallery-9.psd?fmt=pjpg&pscan=auto&scl=1&wid=3676&hei=2314&qlt=100,1&resMode=sharp2&size=3676,2314&chrss=full&imwidth=5000",
    ],
}

def main():
    print("🎯 Custom Dataset Download Example")
    print("=" * 60)
    print()

    # Create dataset with your images
    stats = create_dataset(
        images_dict=images,
        base_dir="dataset",  # Output directory
        skip_existing=True   # Skip if folder exists
    )

    # Print results
    print_statistics(stats)

    print("\n💡 Tips:")
    print("  - Images are organized by product in separate folders")
    print("  - Each image is named img_01.jpg, img_02.jpg, etc.")
    print("  - Run again with skip_existing=False to re-download")
    print("  - Adjust TIMEOUT and RETRY_ATTEMPTS in download_dataset.py")

if __name__ == "__main__":
    main()
