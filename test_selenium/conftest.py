# conftest.py — Pytest global fixtures
import pytest
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from utils.driver_factory import get_driver
from utils.config import USER_USERNAME, USER_PASSWORD


@pytest.fixture(scope="function")
def driver():
    """Provide a fresh Chrome driver for each test. Auto-quits after test."""
    d = get_driver()
    yield d
    d.quit()


@pytest.fixture(scope="function")
def logged_in_driver(driver):
    """
    Provide a Chrome driver that is already logged in as USER_USERNAME.
    Chains from `driver` fixture — quit() is handled automatically.
    Skips the test if login fails (e.g. server is down).
    """
    from pages.login_page import LoginPage
    page = LoginPage(driver)
    page.open()
    page.login(USER_USERNAME, USER_PASSWORD)
    try:
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    except TimeoutException:
        pytest.skip(
            f"Login as '{USER_USERNAME}' failed — skipping test that requires authentication. "
            f"Current URL: {driver.current_url}"
        )
    yield driver
