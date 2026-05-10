# utils/waits.py — Explicit wait helpers
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.config import DEFAULT_WAIT, SHORT_WAIT


def wait_for_element(driver, locator, timeout=DEFAULT_WAIT):
    """Wait until element is present in DOM."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located(locator)
    )


def wait_for_visible(driver, locator, timeout=DEFAULT_WAIT):
    """Wait until element is visible."""
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located(locator)
    )


def wait_for_clickable(driver, locator, timeout=DEFAULT_WAIT):
    """Wait until element is clickable."""
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable(locator)
    )


def wait_for_url_contains(driver, fragment, timeout=DEFAULT_WAIT) -> bool:
    """Wait until URL contains given fragment. Returns True/False."""
    try:
        WebDriverWait(driver, timeout).until(EC.url_contains(fragment))
        return True
    except TimeoutException:
        return False


def wait_for_url_changes(driver, old_url, timeout=DEFAULT_WAIT) -> bool:
    """Wait until URL is different from old_url."""
    try:
        WebDriverWait(driver, timeout).until(EC.url_changes(old_url))
        return True
    except TimeoutException:
        return False


def wait_for_text_in_element(driver, locator, text, timeout=DEFAULT_WAIT) -> bool:
    """Wait until element contains given text."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.text_to_be_present_in_element(locator, text)
        )
        return True
    except TimeoutException:
        return False


def element_exists(driver, locator, timeout=SHORT_WAIT) -> bool:
    """Check if element exists without raising exception."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located(locator)
        )
        return True
    except TimeoutException:
        return False
