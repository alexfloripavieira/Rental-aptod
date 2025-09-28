from .production import *  # noqa
from .utils import env_list

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    ["localhost", "127.0.0.1", "0.0.0.0", "aptos-backend"],
)
