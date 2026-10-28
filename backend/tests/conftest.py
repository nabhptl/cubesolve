import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vendor_dir = os.path.join(backend_dir, "vendor")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if os.path.isdir(vendor_dir) and vendor_dir not in sys.path:
    sys.path.insert(0, vendor_dir)
