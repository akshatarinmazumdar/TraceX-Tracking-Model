# TraceX Project Documentation

## 1. Overview

TraceX is an AI-powered surveillance and investigation system designed to detect and recognize a target person in CCTV or video footage using a reference image. The project combines computer vision, deep learning face embeddings, real-time video processing, and a web dashboard to help users upload surveillance footage, compare it against a reference photo, and review the strongest match frames with confidence scores and annotated evidence.

In simple terms, the project answers this question:

> “Given a CCTV video and a reference face image, can the system locate where that person appears, track them across frames, and produce reviewable evidence?”

The system is focused on practical surveillance use, especially in low-quality footage where detection and recognition are difficult.

---

## 2. Purpose and Aim

### Primary purpose
TraceX exists to automate the process of identifying a person in CCTV footage by comparing detected faces with a supplied reference image.

### Core aims
- Detect faces in video frames under realistic surveillance conditions
- Filter out poor-quality detections such as blurred, dark, tiny, or low-contrast faces
- Extract facial embeddings using advanced recognition models
- Compare those embeddings with a reference face image
- Track the same person across consecutive frames using temporal consistency
- Produce evidence such as annotated output video, best-match snapshots, and match summaries
- Expose the system through a browser-based interface and REST API

### Practical goal
The project is meant to act like an AI investigation assistant for security teams, law enforcement-style review workflows, or suspicious-person tracking scenarios.

---

## 3. What the project is about

This is not just a generic face-recognition demo. It is a surveillance analysis pipeline designed for noisy real-world conditions:

- low-light CCTV footage
- motion blur and compression artifacts
- varying face angles
- partial occlusion
- small face sizes in long-distance frames
- video streams that must be processed efficiently

The project tries to solve a difficult problem: find a person in a video without perfect image quality, while keeping the pipeline fast enough to be usable.

---

## 4. High-level system idea

The system works in four main stages:

1. User uploads a surveillance video and a target reference photo
2. The backend runs AI analysis against the video frames
3. The system detects faces, validates quality, compares embeddings, and tracks matches over time
4. It returns results: top matches, best frame, confidence, timestamps, and a processed output video

The project combines:
- React frontend for user interaction
- Flask backend for API and orchestration
- OpenCV for image and video handling
- DeepFace + RetinaFace + InsightFace for recognition and detection
- optimized tracking logic for speed and reduced false positives

---

## 5. Main architecture

The project is divided into clear modules:

### 5.1 Frontend
Location: [FrontEnd](FrontEnd)

Responsibilities:
- user upload flow for video and reference image
- workbench interface to trigger AI processing
- progress UI for analysis status
- result gallery and download links
- live dashboard and investigation-oriented screens

Main frontend pages:
- [FrontEnd/src/pages/Home.jsx](FrontEnd/src/pages/Home.jsx): landing and marketing page for the product
- [FrontEnd/src/pages/Dashboard.jsx](FrontEnd/src/pages/Dashboard.jsx): dashboard / monitoring style interface
- [FrontEnd/src/pages/Workbench.jsx](FrontEnd/src/pages/Workbench.jsx): main AI investigation workbench

Technology:
- React
- Vite
- Tailwind CSS
- React Router
- Lucide icons

### 5.2 Backend API
Location: [backend.py](backend.py)

Responsibilities:
- accept uploaded video and photo files
- validate file types and sizes
- call the AI engine for analysis
- track processing state and progress
- return match results and output data
- serve generated outputs and video stream

Key API endpoints in [BACKEND_API.md](BACKEND_API.md):
- GET /api/health
- POST /api/upload/video
- POST /api/upload/photo
- POST /api/process/trace
- GET /api/status
- GET /api/results
- POST /api/results/clear
- GET /video_feed

This backend is the orchestration layer between the browser and the AI logic.

### 5.3 Core AI engine
Location: [TraceX.py](TraceX.py)

This is the heart of the system. It contains:
- model initialization
- face detection and face quality checks
- embedding generation
- similarity comparison
- tracking logic
- temporal vote filtering
- output video generation
- best-match extraction

This file is the main implementation of the actual surveillance intelligence.

---

## 6. Key technology stack

### Computer vision
- OpenCV
- NumPy

### AI / recognition
- DeepFace
- ArcFace
- InsightFace
- RetinaFace
- ONNX Runtime

### Web / app layer
- Flask
- Flask-CORS
- React
- Vite

### Project configuration
- [launchpad/start.sh](launchpad/start.sh)
- [START_SYSTEM.sh](START_SYSTEM.sh)

---

## 7. How the AI pipeline works

### 7.1 Model strategy
The engine uses a dual-model recognition architecture:

1. ArcFace via DeepFace
   - High-quality face embedding model
   - Used as one matching branch

2. InsightFace ONNX model
   - Faster ONNX inference model
   - Used as the second branch for comparison

3. RetinaFace
   - Face detection model
   - Finds faces in each frame for further processing

This gives a more reliable score than a single model alone.

### 7.2 Face detection and frame filtering
The pipeline does not analyze every frame blindly. It is optimized for speed:

- it processes only every Nth frame through detection
- uses a downscaled detection pass to reduce computational cost
- skips highly blurry frames early
- discards very small or poor-quality faces

This is important because CCTV videos are large and expensive to process.

### 7.3 Face quality gating
Before comparing faces, the project validates them using quality checks:

- minimum face size threshold
- blur threshold using Laplacian variance
- brightness validation
- discard if image is too dark, too bright, or too blurry

This helps avoid false matches from broken or unusable crops.

### 7.4 Embedding comparison
Each valid face crop is converted into an embedding vector.

Then the system compares the face vector to the reference image embedding using cosine similarity:

- similarity value is measured between the target face and the reference photo
- two branches contribute to a fused score
- final score is a weighted combination of ArcFace and InsightFace results

This is called dual-model fusion.

### 7.5 Temporal tracking
A key improvement in the project is that it does not trust a single-frame match instantly. It uses tracking and vote buffering:

- track face bounding boxes between frames
- maintain a vote history for each tracked target
- require consistent positive matches over multiple frames before confirming a match
- use IoU-based association between face boxes to keep the same person tracked

This reduces false positives and “ghost matches” caused by momentary similarity spikes.

### 7.6 Best-match extraction
The project does more than just list matching frames. It tries to identify the strongest evidence frame over the entire video:

- track the maximum confidence score seen in the full analysis
- save the best frame separately into a best-match folder
- annotate the image with border/tracking markings and confidence labels

This is useful for evidence reporting and quick review.

---

## 8. Processing workflow in practice

A typical workflow is:

1. User uploads CCTV footage
2. User uploads a reference photo of the person to search
3. Backend validates both files
4. The AI engine loads models and caches the reference embedding
5. The video is read frame by frame
6. Every few frames, face detection is run
7. Valid face crops are evaluated
8. Embeddings are generated and compared
9. Temporal trackers decide whether the match is real or transient
10. Annotated output frames are written to video output
11. Results are returned to the frontend
12. The system highlights the strongest match frames and the best overall frame

---

## 9. What outputs it produces

The system produces several forms of output:

### 9.1 Match results JSON
Example fields include:
- frame number
- timestamp
- confidence score
- bounding box coordinates
- match status

### 9.2 Annotated output video
The processed video is saved with rectangles and labels overlaying possible/confirmed matches.

### 9.3 Best-match images
The system stores the strongest candidate frame(s) in output folders such as:
- Target_Capture/
- Target_Capture/Best_Match/
- results/

### 9.4 Frontend gallery
The UI shows top matches and downloadable thumbnails, making it usable for investigative review.

---

## 10. Why the project is important

This project solves a real-world surveillance challenge:

- CCTV footage is often noisy
- target faces may be partially visible or low quality
- manual review is time-consuming and error-prone
- AI can accelerate identification and evidence gathering

By automating the process, TraceX reduces the manual burden on investigators and makes it easier to surface suspicious match candidates in large videos.

---

## 11. Optimization ideas implemented in the project

The project is more than a demo because it includes engineering decisions meant to make it operationally viable.

### Speed optimizations
- process every third frame instead of every frame
- downscale detection frames
- track boxes with IoU rather than re-running full detection for all frames
- warm-load models before processing
- use ONNX runtime for InsightFace

### Accuracy optimizations
- quality gating for face selection
- dual-model score fusion
- temporal consistency voting
- confidence threshold tuning
- best-match fallback when the strict threshold is not reached

### Production-style behaviors
- REST API with background processing
- progress tracking
- results cache
- file validation and cleanup
- explicit error handling

This shows the project was built for practical use, not only for showing a proof-of-concept.

---

## 12. Key project files and meaning

### [TraceX.py](TraceX.py)
Core intelligence engine, recognition, tracker, and output generation.

### [backend.py](backend.py)
Flask service that orchestrates the pipeline and exposes API endpoints.

### [BACKEND_API.md](BACKEND_API.md)
API reference and request/response details.

### [SYSTEM_SETUP.md](SYSTEM_SETUP.md)
Deployment and architecture overview.

### [TraceX_Project_Report.md](TraceX_Project_Report.md)
Performance and optimization notes.

### [README_COMPLETE.md](README_COMPLETE.md)
High-level summary and starter guide.

### [FrontEnd/src/pages/Workbench.jsx](FrontEnd/src/pages/Workbench.jsx)
Main investigation interface where users upload files and start processing.

### [FrontEnd/src/pages/Home.jsx](FrontEnd/src/pages/Home.jsx)
Landing page / product introduction.

### [launchpad/start.sh](launchpad/start.sh)
Script to launch both backend and frontend in one setup.

---

## 13. What this project is not

This is not:
- a general-purpose object detector for all classes
- a fully autonomous surveillance network
- a polished commercial security platform with production-grade user management
- a real-time multi-camera city-scale system out of the box

It is a focused person-identification system for video evidence analysis with a strong computer-vision pipeline.

---

## 14. Limitations and real-world constraints

Despite being strong, the project has limitations:

- recognition quality depends heavily on input footage quality
- performance can be hardware-dependent
- reference image quality matters a lot
- large videos can take significant processing time
- false positives can still happen in extremely noisy or ambiguous footage
- it is specialized for face recognition rather than full person re-identification in all conditions

These are normal constraints for AI-based surveillance systems operating under real-world conditions.

---

## 15. Use cases

The project is best suited for:
- suspect identification from CCTV footage
- person tracking across a single video clip
- investigation support for security teams
- evidence extraction from surveillance videos
- comparing a known person image against recorded footage

---

## 16. Final conclusion

TraceX is an AI-assisted surveillance investigation project built to search CCTV footage for a target person using a reference image. It combines best-in-class face detection and recognition techniques, performance optimization for real-world video processing, and a browser-based interface for review.

The core idea is straightforward but powerful:

- input CCTV footage + reference face image
- detect and validate faces
- compare embeddings with dual-model fusion
- filter false positives with tracking and vote logic
- output evidence-backed match results

This makes TraceX a strong example of a practical computer-vision project focused on real-world security and investigation workflows.

---

## 17. Suggested short mission statement

TraceX is an AI-powered CCTV investigation system that helps identify and track suspects or persons-of-interest by comparing detected faces in surveillance footage against a supplied reference image and generating evidence-grade match outputs.
