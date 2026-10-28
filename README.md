# CubeSolve — AI-Powered Rubik’s Cube Photo Solver

CubeSolve is a full-stack web application that solves any physical 3×3 Rubik’s Cube from six uploaded photographs or live camera captures. It features an OpenCV computer vision pipeline, perceptual CIELAB relative color calibration, physical parity validation, Kociemba two-phase solving, mathematical solution verification, and an interactive 3D Rubik's Cube with step-by-step 3D animations.

---

## 1. Key Features

- **Real OpenCV Image Processing**:
  - Image quality checks (resolution, brightness, contrast, and Laplacian blur variance).
  - Multi-scale contour and convex quadrilateral detection for cube face extraction.
  - Homography perspective correction warping tilted faces to flat $300 \times 300$ square grids.
  - Central 50% sticker sampling avoiding plastic borders, bevels, and specular highlights.
- **Perceptual CIELAB & HSV Relative Calibration**:
  - Relative color calibration using the 6 center stickers as ground-truth ambient lighting references.
  - CIELAB $\Delta E$ Euclidean color distance combined with HSV hue angular distance.
  - Confidence scoring ($0.0 - 1.0$) with automated flagging of uncertain stickers for manual review.
- **Physical Reachability & Mathematical Parity Validation**:
  - 54-sticker validation (exactly 9 of each canonical color: White, Yellow, Green, Blue, Red, Orange).
  - Center sticker uniqueness.
  - Corner piece orientation: sum of 8 corner twists must satisfy $\sum \text{twist} \equiv 0 \pmod 3$.
  - Edge piece orientation: sum of 12 edge flips must satisfy $\sum \text{flip} \equiv 0 \pmod 2$.
  - Permutation parity: corner permutation parity must equal edge permutation parity.
- **Kociemba Two-Phase Algorithm**:
  - Proven optimal/sub-optimal solving algorithm guaranteeing solutions under 24 moves.
  - Mathematical simulation verification: applies the move sequence to a virtual cube model to prove all 54 stickers reach the solved state before returning to the user.
- **Interactive 3D Rubik's Cube**:
  - Rendered with Three.js, React Three Fiber, and `@react-three/drei`.
  - OrbitControls: smooth 3D rotation, zooming, and inspection.
  - Step-by-step solution player: Previous, Next, Play, Pause, Restart, speed controls (0.5x, 1x, 2x).
  - Keyboard shortcuts: Arrow keys (Left/Right) for previous/next move, Spacebar for play/pause, R for restart.
  - Confetti celebration upon reaching the solved state.
- **Demo Mode**:
  - Instant demonstration with a mathematically valid scramble and verified solution generated on-the-fly by the real solver engine.

---

## 2. Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **Icons**: Lucide React
- **Animations**: `canvas-confetti`

### Backend
- **Framework**: FastAPI (Python 3.11+) + Uvicorn
- **Computer Vision**: OpenCV (`opencv-python-headless`), NumPy, Pillow
- **Solver Engine**: Kociemba Two-Phase Algorithm (`app.solver.pykociemba`)
- **Validation & Models**: Pydantic v2
- **Testing**: pytest

---

## 3. Standard Western Orientation Convention

To ensure all six independently photographed faces map into a single coherent 3D cube model, follow this documented holding convention:

1. **Front (Green Center)**: Hold the cube with **Green** facing the camera and **White** on top.
2. **Right (Red Center)**: From Front, rotate the cube 90° horizontally to the right. **Red** faces the camera; **White** remains on top.
3. **Back (Blue Center)**: Rotate 90° horizontally to the right again. **Blue** faces the camera; **White** remains on top.
4. **Left (Orange Center)**: Rotate 90° horizontally to the right again. **Orange** faces the camera; **White** remains on top.
5. **Up (White Center)**: From original Front (Green), tilt the cube downward 90°. **White** faces the camera; **Blue** is on top.
6. **Down (Yellow Center)**: From original Front (Green), tilt the cube upward 90°. **Yellow** faces the camera; **Green** is on top.

### 2D Net Arrangement
The cube review screen displays the unfolded cube net in the standard format:
```
      [ U ]
[ L ] [ F ] [ R ] [ B ]
      [ D ]
```

---

## 4. Getting Started

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm

### Local Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### Local Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running with Docker Compose
```bash
docker compose up --build
```
Access the application at `http://localhost:3000`.

---

## 5. Automated Tests

CubeSolve includes comprehensive unit test suites covering computer vision, image quality checks, color classification, cube state representation, turn simulation, mathematical validation, and API endpoints:

```bash
cd backend
python -m pytest tests -v
```

### Test Coverage Highlights
- `test_solved_cube`: Verifies solved state detection and zero-move solution.
- `test_known_scramble`: Validates Kociemba solution on benchmark scrambles.
- `test_random_scramble_solve`: Generates pseudo-random scrambles and verifies end-to-end solving.
- `test_invalid_color_counts`: Detects non-9 color counts and rejects solving.
- `test_corner_twist_error`: Tests corner twist parity rejection ($\sum \text{twist} \not\equiv 0 \pmod 3$).
- `test_duplicate_centers`: Detects invalid center configurations.
- `test_quality_check_sharp_vs_blurry`: Tests blur detection using Laplacian variance.
- `test_quality_check_brightness`: Tests overexposure and underexposure detection.
- `test_color_classifier_canonical_colors`: Verifies CIELAB/HSV classification across all 6 colors.
- `test_single_face_detection_and_classification`: Tests contour detection, homography, and grid sampling.
- `test_six_face_pipeline_solved_cube`: Tests full 6-face calibration and reconstruction on synthetic images.
- `test_api_*`: Tests FastAPI `/api/health`, `/api/demo`, `/api/validate`, `/api/solve`, and `/api/scan/base64`.

---

## 6. API Endpoints

- `GET /api/health` — Operational status and component readiness.
- `POST /api/scan` — Multipart form upload for 6 face photos (`face_U`, `face_R`, `face_F`, `face_D`, `face_L`, `face_B`).
- `POST /api/scan/base64` — JSON payload with base64 encoded photos (ideal for canvas snapshots).
- `POST /api/scan/single` — Processes a single face photo with confidence scores.
- `POST /api/validate` — Validates physical reachability and parity of a 54-sticker state.
- `POST /api/solve` — Calculates optimal Kociemba two-phase solution and verifies that simulated moves reach the solved state.
- `POST /api/demo` — Returns a random valid scramble and verified solution.

---

## 7. Project Structure

```
cubesolve/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entry point & CORS
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints.py            # API route handlers
│   │   ├── vision/
│   │   │   ├── __init__.py
│   │   │   ├── quality.py              # Blur, brightness, resolution checks
│   │   │   ├── detector.py             # Contour, homography & grid sampling
│   │   │   ├── color_classifier.py     # CIELAB & HSV relative calibration
│   │   │   └── pipeline.py             # 6-face vision orchestration
│   │   ├── cube/
│   │   │   ├── __init__.py
│   │   │   ├── constants.py            # Colors, hex codes, move definitions
│   │   │   ├── state.py                # 54-sticker representation & mapping
│   │   │   └── simulator.py            # Move simulation & verification
│   │   ├── solver/
│   │   │   ├── __init__.py
│   │   │   ├── kociemba_solver.py      # Two-phase algorithm wrapper
│   │   │   └── pykociemba/             # Pure-Python two-phase solver
│   │   ├── validation/
│   │   │   ├── __init__.py
│   │   │   └── validator.py            # Parity, twist, flip & reachability
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py              # Pydantic request & response models
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_cube.py
│   │   ├── test_solver.py
│   │   ├── test_vision.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   ├── ReviewPage.tsx
│   │   │   └── SolutionPage.tsx
│   │   ├── services/
│   │   │   └── api.ts                  # REST API client
│   │   ├── hooks/
│   │   │   └── useKeyboardControls.ts  # Keyboard shortcuts for 3D player
│   │   ├── utils/
│   │   │   └── cubeEngine.ts           # Client-side turn simulation
│   │   ├── three/
│   │   │   └── RubiksCube3D.tsx        # Three.js 3D Rubik's cube & OrbitControls
│   │   ├── constants/
│   │   │   └── cubeConstants.ts        # Face info & Western color scheme
│   │   ├── types/
│   │   │   └── cube.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 8. Implemented Features & Current Limitations

### Implemented
1. **Classical OpenCV Computer Vision**: Edge detection, convex quadrilateral filtering, homography perspective transform, central sticker sampling, and quality metrics (Laplacian blur variance, luminance, contrast).
2. **Relative Color Calibration**: Center stickers serve as dynamic references for ambient lighting variations; classification operates in perceptual CIELAB space with HSV hue discrimination.
3. **Interactive 2D Net Review**: Displays the unfolded cube net, highlights uncertain stickers with warning rings, provides a live color count tracker ($9/9$), and allows instant paint-brush correction.
4. **Rigorous Parity Validation**: Rejects invalid color counts, duplicate centers, corner twist errors ($\text{sum} \not\equiv 0 \pmod 3$), edge flip errors ($\text{sum} \not\equiv 0 \pmod 2$), and permutation parity mismatches.
5. **Kociemba Two-Phase Solver**: Calculates minimal-step solutions (sub-24 moves) using precomputed pruning tables.
6. **Solution Verification**: Automatically simulates the generated move sequence on a virtual cube model and verifies that all 54 facelets match their solved centers.
7. **Interactive 3D Visualizer**: Real-time Three.js / React Three Fiber 3D cube with OrbitControls, move timeline scrubber, playback controls, step explanations, and confetti celebration.
8. **Live Demo Mode**: Instant access to a valid scrambled cube with verified solution.

### Current Limitations & Future Work
- **Extreme Lighting Variations**: Very harsh directional colored lighting (e.g. strong red or blue neon room lighting) can shift sticker hue significantly; users should photograph under standard diffuse indoor light or use the 2D Net review screen to adjust uncertain stickers.
- **Stickerless Cubes with Non-Standard Plastic**: Cubes with pastel or neon fluorescent plastic (e.g., pink instead of red, or cyan instead of blue) can be mapped using manual color correction on the Review screen.
