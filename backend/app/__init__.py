import os
import sys

# Ensure vendor directory is in sys.path for sandbox execution
vendor_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vendor")
if os.path.isdir(vendor_dir) and vendor_dir not in sys.path:
    sys.path.insert(0, vendor_dir)
