"""
=======================================================================
  TraceX Backend Pipeline
  Flask API for AI-Powered Video Surveillance & Tracking
=======================================================================
"""

import os
import sys
import cv2
import numpy as np
import json
import logging
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
import threading
import queue
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# =====================================================================
#  CONFIG
# =====================================================================

UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
OUTPUT_FOLDER = RESULTS_FOLDER
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'}
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'bmp'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# Create required folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# =====================================================================
#  IMPORT TRACEX COMPONENTS
# =====================================================================

# Add the TraceX module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from TraceX import (
        init_models, 
        cosine_sim, 
        get_blur_score,
        preprocess_frame,
        check_face_quality,
        TrackManager,
        Track,
        bbox_iou,
        draw_corner_brackets,
        draw_match_tag,
        REFERENCE_IMAGE_PATH,
        PROCESS_EVERY_N,
        DETECTION_DOWNSCALE,
        STRICT_MATCH_THRESH,
        SOFT_MATCH_THRESH,
        VOTE_BUFFER_SIZE,
        VOTE_CONFIRM_COUNT,
        OUTPUT_FPS,
        BODY_EXPAND_UP,
        BODY_EXPAND_DOWN,
        BODY_EXPAND_SIDE
    )
    logger.info("[INIT] TraceX components imported successfully")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import TraceX: {e}")
    logger.info("[WARN] Will run in demo mode without AI engine")

# =====================================================================
#  GLOBAL STATE
# =====================================================================

processing_state = {
    'is_processing': False,
    'current_progress': 0,
    'current_task': '',
    'error_message': '',
    'results': None
}

processing_lock = threading.Lock()
progress_queue = queue.Queue()

# =====================================================================
#  UTILITY FUNCTIONS
# =====================================================================

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_size_mb(filepath):
    return os.path.getsize(filepath) / (1024 * 1024)

def update_progress(progress, task_desc):
    """Thread-safe progress update"""
    with processing_lock:
        processing_state['current_progress'] = progress
        processing_state['current_task'] = task_desc
    progress_queue.put({'progress': progress, 'task': task_desc})

def set_error(message):
    """Set error state"""
    with processing_lock:
        processing_state['error_message'] = message
        processing_state['is_processing'] = False

def get_video_duration(video_path):
    """Get video duration in seconds"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    return frame_count / fps if fps > 0 else 0

def get_video_info(video_path):
    """Get video metadata"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    
    return {
        'fps': fps,
        'width': width,
        'height': height,
        'frame_count': frame_count,
        'duration': frame_count / fps if fps > 0 else 0
    }

# =====================================================================
#  HEALTH & STATUS ENDPOINTS
# =====================================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get processing status"""
    with processing_lock:
        return jsonify({
            'is_processing': processing_state['is_processing'],
            'progress': processing_state['current_progress'],
            'task': processing_state['current_task'],
            'error': processing_state['error_message']
        }), 200

# =====================================================================
#  FILE UPLOAD ENDPOINTS
# =====================================================================

@app.route('/api/upload/video', methods=['POST'])
def upload_video():
    """Upload video file"""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify({'error': 'Invalid video format. Allowed: ' + str(ALLOWED_VIDEO_EXTENSIONS)}), 400
    
    try:
        filename = secure_filename(f"video_{datetime.now().timestamp()}.mp4")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Validate video
        info = get_video_info(filepath)
        file_size_mb = get_file_size_mb(filepath)
        
        if file_size_mb > 500:
            os.remove(filepath)
            return jsonify({'error': 'File size exceeds 500MB limit'}), 413
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'size_mb': round(file_size_mb, 2),
            'info': info
        }), 200
    
    except Exception as e:
        logger.error(f"[ERROR] Video upload failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload/photo', methods=['POST'])
def upload_photo():
    """Upload reference photo"""
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'error': 'Invalid image format. Allowed: ' + str(ALLOWED_IMAGE_EXTENSIONS)}), 400
    
    try:
        filename = secure_filename(f"photo_{datetime.now().timestamp()}.jpg")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Validate image
        img = cv2.imread(filepath)
        if img is None:
            os.remove(filepath)
            return jsonify({'error': 'Invalid image file'}), 400
        
        file_size_mb = get_file_size_mb(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'size_mb': round(file_size_mb, 2),
            'dimensions': {'width': img.shape[1], 'height': img.shape[0]}
        }), 200
    
    except Exception as e:
        logger.error(f"[ERROR] Photo upload failed: {e}")
        return jsonify({'error': str(e)}), 500

# =====================================================================
#  PROCESSING ENDPOINTS
# =====================================================================

@app.route('/api/process/trace', methods=['POST'])
def process_trace():
    """Start AI trace processing"""
    data = request.get_json()
    
    if not data or 'video_filepath' not in data or 'photo_filepath' not in data:
        return jsonify({'error': 'Missing video_filepath or photo_filepath'}), 400
    
    video_path = data['video_filepath']
    photo_path = data['photo_filepath']
    
    if not os.path.exists(video_path):
        return jsonify({'error': f'Video not found: {video_path}'}), 404
    
    if not os.path.exists(photo_path):
        return jsonify({'error': f'Photo not found: {photo_path}'}), 404
    
    # Start processing in background thread
    threading.Thread(
        target=run_trace_processing,
        args=(video_path, photo_path),
        daemon=True
    ).start()
    
    return jsonify({
        'success': True,
        'message': 'Processing started',
        'status_url': '/api/status'
    }), 202

def run_trace_processing(video_path, photo_path):
    """Background processing function"""
    with processing_lock:
        processing_state['is_processing'] = True
        processing_state['current_progress'] = 0
        processing_state['error_message'] = ''
    
    try:
        update_progress(5, 'Initializing AI models...')
        emb_ref_arc, emb_ref_ins, rec_model = init_models()
        
        if emb_ref_arc is None:
            raise ValueError("Failed to extract reference embeddings")
        
        update_progress(10, 'Loading video...')
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        output_filename = secure_filename(f"output_{Path(video_path).stem}_{int(datetime.now().timestamp())}.mp4")
        output_filepath = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_filepath, fourcc, fps if fps > 0 else 24.0, (width, height))
        
        update_progress(15, 'Analyzing video frames...')
        
        # Initialize tracker with vote history
        tracker = TrackManager()
        matches_found = []
        frame_idx = 0
        
        # Per-track vote buffers for temporal consistency
        track_vote_buffers = {}
        
        from deepface import DeepFace
        
        # Process video frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Update progress
            progress = 15 + int((frame_idx / max(frame_count, 1)) * 65)
            update_progress(progress, f'Processing frame {frame_idx}/{frame_count}')
            
            proc_frame = frame.copy()
            
            # === BLUR GATE: Skip blurry frames entirely ===
            from TraceX import get_blur_score, preprocess_frame, BLUR_THRESHOLD_FRAME
            frame_blur = get_blur_score(frame)
            
            if frame_idx % PROCESS_EVERY_N == 0 and frame_blur >= BLUR_THRESHOLD_FRAME:
                # Preprocess for better detection accuracy
                enhanced = preprocess_frame(frame)
                
                # === SPEED: Downscale for RetinaFace ===
                small_w = int(width * DETECTION_DOWNSCALE)
                small_h = int(height * DETECTION_DOWNSCALE)
                small_frame = cv2.resize(enhanced, (small_w, small_h))
                
                try:
                    faces = DeepFace.extract_faces(
                        img_path=small_frame,
                        detector_backend="retinaface",
                        enforce_detection=False,
                        anti_spoofing=False
                    )
                except Exception:
                    faces = []
                
                temp_candidates_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'temp_candidates')
                os.makedirs(temp_candidates_dir, exist_ok=True)
                
                detections = []
                for face_data in faces:
                    conf = face_data.get('confidence', 0.0)
                    if conf < 0.5:
                        continue
                    area = face_data['facial_area']
                    sx, sy, sw, sh = area['x'], area['y'], area['w'], area['h']
                    
                    # Skip full-frame fallbacks
                    if sw >= small_w - 5 and sh >= small_h - 5:
                        continue
                    
                    # Upscale coords back to original resolution
                    x = int(sx / DETECTION_DOWNSCALE)
                    y = int(sy / DETECTION_DOWNSCALE)
                    x2 = int((sx + sw) / DETECTION_DOWNSCALE)
                    y2 = int((sy + sh) / DETECTION_DOWNSCALE)
                    
                    # Face quality gate
                    face_crop = frame[max(0,y):min(height,y2), max(0,x):min(width,x2)]
                    if face_crop.size == 0:
                        continue
                    is_valid, reason, face_blur = check_face_quality(face_crop)
                    if not is_valid:
                        continue
                    
                    detections.append([x, y, x2, y2])
                    
                    # Full-body capture
                    fh = y2 - y
                    fw = x2 - x
                    body_y1 = max(0, int(y - fh * BODY_EXPAND_UP))
                    body_y2 = min(height, int(y2 + fh * BODY_EXPAND_DOWN))
                    body_x1 = max(0, int(x - fw * BODY_EXPAND_SIDE))
                    body_x2 = min(width, int(x2 + fw * BODY_EXPAND_SIDE))
                    body_crop = frame[body_y1:body_y2, body_x1:body_x2]
                    if body_crop.size > 0:
                        cand_id = f"cand_{frame_idx}_{x}_{y}.jpg"
                        cv2.imwrite(os.path.join(temp_candidates_dir, cand_id), body_crop)
                    
                    # === DUAL-MODEL FUSION (ArcFace 50% + InsightFace 50%) ===
                    crp_rsz = cv2.resize(face_crop, (112, 112))
                    arc_sim = 0.0
                    ins_sim = 0.0
                    
                    try:
                        reps = DeepFace.represent(
                            img_path=crp_rsz,
                            model_name="ArcFace",
                            detector_backend="skip",
                            enforce_detection=False
                        )
                        arc_emb = np.array(reps[0]["embedding"], dtype=np.float32)
                        arc_sim = cosine_sim(arc_emb, emb_ref_arc)
                    except Exception:
                        pass
                    
                    if rec_model is not None:
                        try:
                            ins_emb = rec_model.get_feat(crp_rsz).flatten()
                            ins_sim = cosine_sim(ins_emb, emb_ref_ins)
                        except Exception:
                            pass
                    
                    fusion_score = (0.5 * arc_sim) + (0.5 * ins_sim)
                    
                    # === DYNAMIC BLUR THRESHOLD ADJUSTMENT ===
                    dynamic_strict = STRICT_MATCH_THRESH
                    if face_blur < 50:
                        dynamic_strict -= 0.15
                    elif face_blur < 100:
                        dynamic_strict -= 0.08
                    
                    # === TEMPORAL VOTE BUFFER per track ===
                    tracks = tracker.update(detections)
                    for trk in tracks:
                        if trk.bbox == [x, y, x2, y2]:
                            tid = trk.id
                            if tid not in track_vote_buffers:
                                track_vote_buffers[tid] = []
                            track_vote_buffers[tid].append(fusion_score >= dynamic_strict)
                            if len(track_vote_buffers[tid]) > VOTE_BUFFER_SIZE:
                                track_vote_buffers[tid].pop(0)
                            
                            votes = sum(track_vote_buffers[tid])
                            is_confirmed = votes >= VOTE_CONFIRM_COUNT
                            
                            if is_confirmed and fusion_score > SOFT_MATCH_THRESH:
                                matches_found.append({
                                    'frame': frame_idx,
                                    'score': float(fusion_score),
                                    'bbox': [x, y, x2-x, y2-y],
                                    'timestamp': frame_idx / fps
                                })
                                cv2.rectangle(proc_frame, (x, y), (x2, y2), (0, 255, 0), 2)
                                label = f"MATCH {int(fusion_score*100)}%"
                                cv2.putText(proc_frame, label, (x, max(y - 10, 15)),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
                            elif fusion_score > SOFT_MATCH_THRESH:
                                cv2.rectangle(proc_frame, (x, y), (x2, y2), (0, 165, 255), 1)
                                label = f"POSSIBLE {int(fusion_score*100)}%"
                                cv2.putText(proc_frame, label, (x, max(y - 10, 15)),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 165, 255), 1, cv2.LINE_AA)
                            else:
                                cv2.rectangle(proc_frame, (x, y), (x2, y2), (128, 128, 128), 1)
                    
                    # Update detections if not yet updated above
                    if not tracks:
                        tracker.update(detections)
            
            writer.write(proc_frame)
            frame_idx += 1
        
        cap.release()
        writer.release()
        
        # Stage 2: Secondary Validation Pass
        update_progress(80, 'Stage 2: Secondary Validation Pass...')
        temp_candidates_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'temp_candidates')
        
        best_candidate = None
        best_score_overall = -1.0
        candidate_scores = {}
        
        if os.path.exists(temp_candidates_dir):
            candidates = os.listdir(temp_candidates_dir)
            total_cands = len(candidates)
            
            for i, cand_file in enumerate(candidates):
                if i % 5 == 0:
                    update_progress(80 + int((i/total_cands)*10), f'Validating candidate {i}/{total_cands}')
                    
                cand_path = os.path.join(temp_candidates_dir, cand_file)
                cand_img = cv2.imread(cand_path)
                if cand_img is None: continue
                
                try:
                    # Re-extract faces from full body
                    cand_faces = DeepFace.extract_faces(
                        img_path=cand_img,
                        detector_backend="retinaface",
                        enforce_detection=False,
                        anti_spoofing=False
                    )
                    if not cand_faces: continue
                    # take largest face
                    cand_faces.sort(key=lambda x: x['facial_area']['w'] * x['facial_area']['h'], reverse=True)
                    c_area = cand_faces[0]['facial_area']
                    cx, cy, cw, ch = c_area['x'], c_area['y'], c_area['w'], c_area['h']
                    face_crop = cand_img[cy:cy+ch, cx:cx+cw]
                    
                    is_valid, reason, blur = check_face_quality(face_crop)
                    if not is_valid: continue
                    
                    crp_rsz = cv2.resize(face_crop, (112, 112))
                    
                    arc_sim = 0.0
                    ins_sim = 0.0
                    
                    try:
                        reps = DeepFace.represent(img_path=crp_rsz, model_name="ArcFace", detector_backend="skip", enforce_detection=False)
                        arc_emb = np.array(reps[0]["embedding"], dtype=np.float32)
                        arc_sim = cosine_sim(arc_emb, emb_ref_arc)
                    except Exception: pass
                    
                    if rec_model:
                        try:
                            ins_emb = rec_model.get_feat(crp_rsz).flatten()
                            ins_sim = cosine_sim(ins_emb, emb_ref_ins)
                        except Exception: pass
                    
                    fusion_score = (0.5 * arc_sim) + (0.5 * ins_sim)
                    candidate_scores[cand_file] = fusion_score
                    
                    if fusion_score > best_score_overall:
                        best_score_overall = fusion_score
                        best_candidate = cand_file
                except Exception as e:
                    logger.debug(f"Error processing candidate {cand_file}: {e}")

        # Stage 3: Dynamic Directory Triage
        update_progress(92, 'Stage 3: Dynamic Directory Triage...')
        best_match_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'best_match_on_website')
        others_dir = os.path.join(app.config['OUTPUT_FOLDER'], 'number_of_faces')
        
        os.makedirs(best_match_dir, exist_ok=True)
        os.makedirs(others_dir, exist_ok=True)
        
        import shutil
        best_match_url = None
        if os.path.exists(temp_candidates_dir):
            for cand_file in os.listdir(temp_candidates_dir):
                src_path = os.path.join(temp_candidates_dir, cand_file)
                if cand_file == best_candidate:
                    dst_path = os.path.join(best_match_dir, cand_file)
                    best_match_url = f"/api/download/best_match_on_website/{cand_file}"
                else:
                    dst_path = os.path.join(others_dir, cand_file)
                shutil.move(src_path, dst_path)
            try:
                os.rmdir(temp_candidates_dir)
            except OSError:
                pass
        
        update_progress(90, 'Converting video for browser compatibility...')
        import subprocess
        try:
            temp_output = output_filepath.replace('.mp4', '_temp.mp4')
            os.rename(output_filepath, temp_output)
            subprocess.run(['ffmpeg', '-y', '-i', temp_output, '-vcodec', 'libx264', '-acodec', 'aac', output_filepath], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(temp_output):
                os.remove(temp_output)
        except Exception as e:
            logger.warning(f"Video conversion failed (will use original): {e}")
            if os.path.exists(temp_output):
                os.rename(temp_output, output_filepath)
        
        update_progress(95, 'Generating report...')
        # Produce thumbnails for top matches
        thumbnails = []
        try:
            cap_thumb = cv2.VideoCapture(video_path)
            for i, m in enumerate(matches_found[:5]):
                frame_no = int(m.get('frame', 0))
                cap_thumb.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
                ret2, frame_img = cap_thumb.read()
                if not ret2:
                    continue
                # crop to bbox if available
                bbox = m.get('bbox')
                try:
                    if bbox and len(bbox) >= 4:
                        x, y, w, h = bbox[0], bbox[1], bbox[2], bbox[3]
                        x1, y1, x2, y2 = int(x), int(y), int(x + w), int(y + h)
                        crop_img = frame_img[max(0, y1):max(0, y2), max(0, x1):max(0, x2)]
                        thumb_img = crop_img if crop_img.size > 0 else frame_img
                    else:
                        thumb_img = frame_img
                except Exception:
                    thumb_img = frame_img

                thumb_name = secure_filename(f"thumb_{Path(video_path).stem}_{i}_{int(datetime.now().timestamp())}.jpg")
                thumb_path = os.path.join(app.config['OUTPUT_FOLDER'], thumb_name)
                try:
                    cv2.imwrite(thumb_path, thumb_img)
                    thumbnails.append({'filename': thumb_name, 'url': f"/api/download/{thumb_name}"})
                except Exception as e:
                    logger.warning(f"Failed to write thumbnail: {e}")
            cap_thumb.release()
        except Exception as e:
            logger.warning(f"Thumbnail generation skipped: {e}")

        # Generate results
        results = {
            'total_frames': frame_count,
            'duration_sec': frame_count / fps if fps > 0 else 0,
            'matches_found': len(matches_found),
            'matches': matches_found[:20],  # Top 20 matches
            'confidence_avg': np.mean([m['score'] for m in matches_found]) if matches_found else 0,
            'output_video_filename': output_filename,
            'output_video_url': f"/api/download/{output_filename}",
            'best_match_url': best_match_url,
            'best_match_score': best_score_overall,
            'thumbnails': thumbnails,
            'processed_at': datetime.now().isoformat()
        }
        
        update_progress(100, 'Complete!')
        
        with processing_lock:
            processing_state['results'] = results
            processing_state['is_processing'] = False
        
        logger.info(f"[SUCCESS] Trace processing completed. Found {len(matches_found)} matches")
    
    except Exception as e:
        logger.error(f"[ERROR] Processing failed: {e}")
        set_error(str(e))

# =====================================================================
#  RESULTS ENDPOINTS
# =====================================================================

@app.route('/api/results', methods=['GET'])
def get_results():
    """Get processing results"""
    with processing_lock:
        if processing_state['results'] is None:
            return jsonify({'error': 'No results available'}), 404
        return jsonify(processing_state['results']), 200

@app.route('/api/results/clear', methods=['POST'])
def clear_results():
    """Clear results"""
    with processing_lock:
        processing_state['results'] = None
        processing_state['error_message'] = ''
    return jsonify({'success': True}), 200

@app.route('/api/download/<path:filename>', methods=['GET'])
def download_output_video(filename):
    """Download or stream the processed output video."""
    import posixpath
    normpath = posixpath.normpath(filename)
    if normpath.startswith('..') or normpath.startswith('/'):
        return jsonify({'error': 'Invalid path'}), 400
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], normpath)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    is_download = request.args.get('download', '0') == '1'
    mime = 'video/mp4' if filename.endswith('.mp4') else 'image/jpeg'
    return send_file(filepath, as_attachment=is_download, download_name=os.path.basename(filename), mimetype=mime)

# =====================================================================
#  LIVE VIDEO FEED (for Dashboard)
# =====================================================================

def generate_video_feed():
    """Generate live video feed from webcam"""
    try:
        cap = cv2.VideoCapture(0)  # Webcam
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize for streaming
            frame = cv2.resize(frame, (640, 480))
            
            # Encode
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n'
                   b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n'
                   + frame_bytes + b'\r\n')
            
            # Small delay to prevent CPU overload
            import time
            time.sleep(0.03)
        
        cap.release()
    except Exception as e:
        logger.error(f"[ERROR] Video feed error: {e}")

@app.route('/video_feed')
def video_feed():
    """Stream video feed"""
    return Response(
        generate_video_feed(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# =====================================================================
#  ERROR HANDLERS
# =====================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"[ERROR] Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# =====================================================================
#  MAIN
# =====================================================================

if __name__ == '__main__':
    logger.info("[INIT] Starting TraceX Backend Pipeline...")
    logger.info("[INFO] Server running on http://localhost:5000")
    logger.info("[INFO] API Documentation:")
    logger.info("       POST   /api/upload/video     - Upload video")
    logger.info("       POST   /api/upload/photo     - Upload reference photo")
    logger.info("       POST   /api/process/trace    - Start processing")
    logger.info("       GET    /api/status           - Get processing status")
    logger.info("       GET    /api/results          - Get results")
    logger.info("       GET    /api/download/<filename> - Download processed video")
    logger.info("       GET    /video_feed           - Stream video feed")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True
    )
