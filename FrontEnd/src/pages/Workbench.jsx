import { useState, useRef } from 'react';
import { Upload, ChevronRight, AlertCircle, CheckCircle, Loader, Share2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Workbench() {
  const [videoFile, setVideoFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [uploadedPaths, setUploadedPaths] = useState({ video: null, photo: null });

  const videoInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handleShareVideo = async (url, filename) => {
    try {
      const response = await fetch(`http://localhost:5000${url}?download=1`);
      const blob = await response.blob();
      const file = new File([blob], filename || 'tracex_output.mp4', { type: 'video/mp4' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'TraceX Surveillance Output',
          files: [file]
        });
      } else {
        alert("Your browser/device doesn't support direct file sharing. Please download the file instead.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert("Failed to share the video.");
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setError('');
      await uploadFile(file, 'video');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setError('');
      await uploadFile(file, 'photo');
    }
  };

  const uploadFile = async (file, type) => {
    try {
      const formData = new FormData();
      formData.append(type, file);
      
      const endpoint = type === 'video' ? '/upload/video' : '/upload/photo';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadedPaths(prev => ({
        ...prev,
        [type]: data.filepath
      }));
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }
  };

  const pollProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const data = await response.json();
      
      setProgress(data.progress);
      
      if (data.error) {
        setError(data.error);
        setIsProcessing(false);
      } else if (!data.is_processing) {
        // Processing complete, fetch results
        const resultResponse = await fetch(`${API_BASE}/results`);
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          setResults(resultData);
        }
        setIsProcessing(false);
      }
      return data;
    } catch (err) {
      console.error('Progress poll error:', err);
      return null;
    }
  };

  const handleStartTrace = async () => {
    if (!uploadedPaths.video || !uploadedPaths.photo) {
      setError('Please upload both video and photo');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/process/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_filepath: uploadedPaths.video,
          photo_filepath: uploadedPaths.photo
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      // Poll for progress
      const pollInterval = setInterval(async () => {
        const data = await pollProgress();
        if (data && !data.is_processing) {
          clearInterval(pollInterval);
        }
      }, 1000);

    } catch (err) {
      setError(`Processing error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setPhotoFile(null);
    setResults(null);
    setError('');
    setProgress(0);
    setUploadedPaths({ video: null, photo: null });
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <a href="/" className="text-2xl font-black tracking-tighter">
          Trace<span className="text-red-600">X</span>
          <span className="text-red-600 ml-1 text-xs align-top">●</span>
        </a>
        <div className="hidden md:flex space-x-8 text-xs font-bold tracking-widest text-gray-500 uppercase">
          <a href="/" className="hover:text-black transition">Home</a>
          <a href="/dashboard" className="hover:text-black transition">Dashboard</a>
          <a href="/workbench" className="hover:text-black transition text-black">Workbench</a>
          <a href="#" className="hover:text-black transition">Docs</a>
        </div>
        <a href="/">
          <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center">
            Home <ChevronRight size={16} className="ml-1" />
          </button>
        </a>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full pt-12 pb-12">
        <main className="flex-1 p-6 w-full">
          <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase mb-4">
                Investigation Tool
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-4">Trace Workbench</h1>
              <p className="text-gray-600 text-lg">
                Upload a video and a reference photo. TraceX AI will scan the footage for matching frames 
                and generate annotated evidence.
              </p>
            </div>

            {/* Results Display */}
            {results && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Analysis Complete!</h3>
                    <div className="text-green-800 space-y-1 text-sm">
                      <p>✓ Total Frames: {results.total_frames}</p>
                      <p>✓ Duration: {results.duration_sec.toFixed(2)}s</p>
                      <p>✓ Matches Found: {results.matches_found}</p>
                      <p>✓ Average Confidence: {(results.confidence_avg * 100).toFixed(1)}%</p>
                    </div>
                    {results.matches && results.matches.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-300">
                        <p className="font-semibold mb-2">Top Matches:</p>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                          {results.thumbnails && results.thumbnails.length > 0 ? (
                            results.thumbnails.map((t, i) => (
                              <div key={i} className="flex flex-col items-center text-center">
                                <a href={`http://localhost:5000${t.url}`} target="_blank" rel="noreferrer">
                                  <img src={`http://localhost:5000${t.url}`} className="w-36 h-24 object-cover rounded-md border" alt={`thumb-${i}`} />
                                </a>
                                <p className="text-xs mt-1">Match {i + 1}</p>
                                <a href={`http://localhost:5000${t.url}`} download className="text-xs text-blue-600 mt-1">Download</a>
                              </div>
                            ))
                          ) : (
                            results.matches.slice(0, 5).map((match, i) => (
                              <p key={i} className="text-xs">
                                Frame {match.frame} - Confidence: {(match.score * 100).toFixed(1)}%
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={resetForm}
                      className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Start New Trace
                    </button>
                    {results.output_video_url && (
                      <div className="mt-4 border-t border-green-200 pt-4">
                        <p className="text-sm font-semibold text-green-900 mb-2">Download Processed Video</p>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <a
                            href={`http://localhost:5000${results.output_video_url}?download=1`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-white border border-green-400 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition"
                          >
                            Download Output Video
                          </a>
                          <button
                            onClick={() => handleShareVideo(results.output_video_url, results.output_video_filename)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <Share2 size={16} /> Share Video
                          </button>
                          <video
                            className="w-full md:w-96 rounded-xl border border-green-200 shadow-sm"
                            controls
                            src={`http://localhost:5000${results.output_video_url}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Section */}
            {!results && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">
                      Upload Video Feed
                    </label>
                    <div className="relative">
                      <input 
                        ref={videoInputRef}
                        type="file" 
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                        disabled={isProcessing}
                      />
                      <label 
                        htmlFor="video-upload"
                        className={`block p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
                          uploadedPaths.video 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-300 hover:border-red-600 hover:bg-red-50'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${uploadedPaths.video ? 'text-green-500' : 'text-gray-400'}`} />
                        <p className="font-semibold text-gray-900">
                          {videoFile ? videoFile.name : 'Drag or click to upload'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">MP4, WebM, or AVI up to 500MB</p>
                        {uploadedPaths.video && <p className="text-xs text-green-600 mt-2">✓ Uploaded</p>}
                      </label>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest">
                      Reference Photo
                    </label>
                    <div className="relative">
                      <input 
                        ref={photoInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        disabled={isProcessing}
                      />
                      <label 
                        htmlFor="photo-upload"
                        className={`block p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
                          uploadedPaths.photo 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-300 hover:border-red-600 hover:bg-red-50'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${uploadedPaths.photo ? 'text-green-500' : 'text-gray-400'}`} />
                        <p className="font-semibold text-gray-900">
                          {photoFile ? photoFile.name : 'Drag or click to upload'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG, or WebP up to 100MB</p>
                        {uploadedPaths.photo && <p className="text-xs text-green-600 mt-2">✓ Uploaded</p>}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex gap-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">How it works</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Our AI engine (ArcFace + InsightFace) will analyze every frame of your surveillance video,
                      compare faces with the reference photo, and generate a comprehensive report with timestamps,
                      confidence scores, and annotated evidence.
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <Loader className="w-5 h-5 text-red-600 animate-spin" />
                      <p className="font-semibold text-gray-900">Processing: {progress}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Start Button */}
                <div className="flex justify-center">
                  <button 
                    onClick={handleStartTrace}
                    disabled={!videoFile || !photoFile || isProcessing}
                    className={`px-12 py-4 rounded-full font-semibold text-white flex items-center gap-3 transition ${
                      (videoFile && photoFile && !isProcessing)
                        ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing ({progress}%)...
                      </>
                    ) : (
                      <>
                        <span>Start Trace</span>
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                {/* Status */}
                {(!videoFile || !photoFile) && (
                  <p className="text-center text-gray-500 text-sm mt-8">
                    Upload both a video and photo to begin
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white text-gray-900 border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center text-xs font-bold tracking-widest text-gray-500 uppercase">
          <div>TRACEX WORKBENCH // 2026_SEC_CORP</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black transition">Privacy</a>
            <a href="#" className="hover:text-black transition">Terms</a>
            <a href="#" className="hover:text-black transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
