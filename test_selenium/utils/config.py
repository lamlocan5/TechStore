# utils/config.py — Central configuration

# ── URLs ──────────────────────────────────────────────────────────────────────
USER_BASE_URL         = "http://localhost:3000"
USER_LOGIN_URL        = "http://localhost:3000/login"
USER_REGISTER_URL     = "http://localhost:3000/register"
USER_DASHBOARD_URL    = "http://localhost:3000"   # redirect target after login
USER_PROFILE_URL      = "http://localhost:3000/profile"
USER_CHANGE_PW_URL    = "http://localhost:3000/profile/change-password"
USER_ADDRESS_URL      = "http://localhost:3000/profile/addresses"
USER_ADD_ADDRESS_URL  = "http://localhost:3000/profile/addresses"  # add via list page

ADMIN_BASE_URL      = "http://localhost:5500"
ADMIN_LOGIN_URL     = "http://localhost:5500/login.html"
ADMIN_DASHBOARD_URL = "http://localhost:5500/index.html"

# ── Test credentials ──────────────────────────────────────────────────────────
USER_USERNAME = "anv1"
USER_PASSWORD = "a123456"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

# ── Database ──────────────────────────────────────────────────────────────────
DB_HOST     = "localhost"
DB_PORT     = 3306
DB_USER     = "root"
DB_PASSWORD = "220104"
DB_NAME     = "profile_service"

# Table names (actual schema uses 'user', not 'users')
DB_USER_TABLE   = "user"
DB_ROLES_TABLE  = "user_roles"

# ── Timeouts (seconds) ────────────────────────────────────────────────────────
DEFAULT_WAIT = 10
SHORT_WAIT   = 3
LONG_WAIT    = 20
