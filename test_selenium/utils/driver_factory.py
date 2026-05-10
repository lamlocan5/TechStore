# utils/driver_factory.py — WebDriver factory
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def get_driver(headless: bool = False) -> webdriver.Chrome:
    """Create and return a configured Chrome WebDriver."""
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options,
    )
    # Disable implicit wait — use explicit waits everywhere
    driver.implicitly_wait(0)
    driver.maximize_window()
    return driver
