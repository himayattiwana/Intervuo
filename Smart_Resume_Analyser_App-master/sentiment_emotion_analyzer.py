"""
Sentiment and Emotion Analysis Module
Analyzes text sentiment and facial expressions for interview assessment
"""

import re
import numpy as np
from typing import Dict, List, Tuple, Optional
import base64
import cv2
from io import BytesIO
from pathlib import Path
import urllib.request
import shutil
from PIL import Image

# Try to import sentiment analysis libraries
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("⚠️ TextBlob not available. Install with: pip install textblob")

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False
    print("⚠️ VADER not available. Install with: pip install vaderSentiment")

# Try to import onnxruntime for FER+ model inference
try:
    import onnxruntime as ort
    ONNXRUNTIME_AVAILABLE = True
except ImportError:
    ONNXRUNTIME_AVAILABLE = False
    print("⚠️ onnxruntime not available. Install with: pip install onnxruntime")

# OpenCV is always available (we use opencv-python-headless)
OPENCV_AVAILABLE = True
print("✅ OpenCV available for emotion detection")

FER_MODEL_URLS = [
    "https://raw.githubusercontent.com/onnx/models/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx",
    # Fallback mirrors (in case the main raw URL is rate-limited)
    "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx?download=1",
]
FER_MODEL_FILENAME = "emotion-ferplus-8.onnx"
FERPLUS_LABELS = [
    'neutral', 'happiness', 'surprise', 'sadness',
    'anger', 'disgust', 'fear', 'contempt'
]
FERPLUS_TO_APP_LABEL = {
    'neutral': 'neutral',
    'happiness': 'happy',
    'surprise': 'surprise',
    'sadness': 'sad',
    'anger': 'angry',
    'disgust': 'disgust',
    'fear': 'fear',
    'contempt': 'disgust'  # closest available category
}
MODELS_DIR = Path(__file__).resolve().parent / "models"


class SentimentAnalyzer:
    """Analyzes sentiment and tone from text"""
    
    def __init__(self):
        self.vader_analyzer = SentimentIntensityAnalyzer() if VADER_AVAILABLE else None
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment and tone of text
        Returns: {
            'overall_sentiment': 'positive'/'neutral'/'negative',
            'confidence_score': 0-1,
            'nervousness_indicators': list of indicators,
            'hesitation_indicators': list of indicators,
            'clarity_score': 0-1,
            'tone_scores': {
                'positive': 0-1,
                'neutral': 0-1,
                'negative': 0-1
            },
            'emotional_state': 'confident'/'nervous'/'hesitant'/'calm'
        }
        """
        if not text or not text.strip():
            return self._default_sentiment()
        
        text_lower = text.lower()
        
        # Use VADER for sentiment analysis (better for social media/text)
        vader_scores = {}
        if self.vader_analyzer:
            vader_scores = self.vader_analyzer.polarity_scores(text)
        
        # Use TextBlob for additional analysis
        textblob_scores = {}
        if TEXTBLOB_AVAILABLE:
            blob = TextBlob(text)
            textblob_scores = {
                'polarity': blob.sentiment.polarity,  # -1 to 1
                'subjectivity': blob.sentiment.subjectivity  # 0 to 1
            }
        
        # Detect nervousness indicators
        nervousness_keywords = [
            'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
            'sorry', 'apologies', 'i think', 'maybe', 'perhaps',
            'i guess', 'kind of', 'sort of', 'a bit', 'a little'
        ]
        nervousness_count = sum(1 for word in nervousness_keywords if word in text_lower)
        nervousness_score = min(1.0, nervousness_count / max(len(text.split()) / 50, 1))
        
        # Detect negative emotional indicators (crying, distress, etc.)
        negative_emotion_keywords = [
            'crying', 'cry', 'tears', 'sad', 'upset', 'frustrated',
            'stressed', 'anxious', 'worried', 'nervous', 'scared',
            'afraid', 'difficult', 'hard', 'struggle', 'problem'
        ]
        negative_count = sum(1 for word in negative_emotion_keywords if word in text_lower)
        if negative_count > 0:
            # Boost nervousness score if negative emotions detected
            nervousness_score = min(1.0, nervousness_score + (negative_count * 0.2))
        
        # Detect hesitation indicators
        hesitation_patterns = [
            r'\b(um|uh|er|ah)\b',
            r'\b(like|you know|i mean)\b',
            r'\b(maybe|perhaps|i think|i guess)\b',
            r'\.\.\.',  # Ellipsis
            r'\?{2,}',  # Multiple question marks
        ]
        hesitation_count = sum(len(re.findall(pattern, text_lower)) for pattern in hesitation_patterns)
        hesitation_score = min(1.0, hesitation_count / max(len(text.split()) / 30, 1))
        
        # Calculate clarity (based on sentence structure and length)
        sentences = re.split(r'[.!?]+', text)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len([s for s in sentences if s.strip()]), 1)
        clarity_score = min(1.0, 1.0 - abs(avg_sentence_length - 15) / 15)  # Optimal around 15 words
        
        # Determine overall sentiment
        if vader_scores:
            compound = vader_scores.get('compound', 0)
            if compound >= 0.05:
                overall_sentiment = 'positive'
            elif compound <= -0.05:
                overall_sentiment = 'negative'
            else:
                overall_sentiment = 'neutral'
        elif textblob_scores:
            polarity = textblob_scores.get('polarity', 0)
            if polarity > 0.1:
                overall_sentiment = 'positive'
            elif polarity < -0.1:
                overall_sentiment = 'negative'
            else:
                overall_sentiment = 'neutral'
        else:
            overall_sentiment = 'neutral'
        
        # Calculate confidence score (inverse of nervousness + hesitation)
        # More aggressive penalty for negative indicators
        confidence_score = max(0, 1.0 - (nervousness_score * 0.6 + hesitation_score * 0.4))
        
        # Additional penalty for negative sentiment
        if overall_sentiment == 'negative':
            confidence_score *= 0.5  # Halve confidence if negative sentiment
        
        # Determine emotional state (improved sensitivity to negative emotions)
        # Check for negative sentiment indicators
        is_negative = False
        if vader_scores:
            compound = vader_scores.get('compound', 0)
            if compound < -0.1:  # Negative sentiment
                is_negative = True
        elif textblob_scores:
            polarity = textblob_scores.get('polarity', 0)
            if polarity < -0.1:  # Negative sentiment
                is_negative = True
        
        # If negative sentiment detected, prioritize nervous state
        if is_negative or nervousness_score >= 0.4 or hesitation_score >= 0.4:
            emotional_state = 'nervous'
        elif confidence_score >= 0.7 and nervousness_score < 0.3:
            emotional_state = 'confident'
        elif hesitation_score >= 0.3:
            emotional_state = 'hesitant'
        else:
            emotional_state = 'calm'
        
        # Tone scores
        if vader_scores:
            tone_scores = {
                'positive': vader_scores.get('pos', 0),
                'neutral': vader_scores.get('neu', 0),
                'negative': vader_scores.get('neg', 0)
            }
        else:
            tone_scores = {
                'positive': 0.5,
                'neutral': 0.5,
                'negative': 0.0
            }
        
        return {
            'overall_sentiment': overall_sentiment,
            'confidence_score': round(confidence_score, 2),
            'nervousness_score': round(nervousness_score, 2),
            'hesitation_score': round(hesitation_score, 2),
            'clarity_score': round(clarity_score, 2),
            'tone_scores': tone_scores,
            'emotional_state': emotional_state,
            'vader_compound': round(vader_scores.get('compound', 0), 2) if vader_scores else 0,
            'textblob_polarity': round(textblob_scores.get('polarity', 0), 2) if textblob_scores else 0
        }
    
    def _default_sentiment(self) -> Dict:
        """Return default sentiment when text is empty"""
        return {
            'overall_sentiment': 'neutral',
            'confidence_score': 0.5,
            'nervousness_score': 0.5,
            'hesitation_score': 0.5,
            'clarity_score': 0.5,
            'tone_scores': {'positive': 0.33, 'neutral': 0.34, 'negative': 0.33},
            'emotional_state': 'neutral',
            'vader_compound': 0,
            'textblob_polarity': 0
        }


class FacialExpressionAnalyzer:
    """Analyzes facial expressions from images/video frames using OpenCV"""
    
    def __init__(self):
        self.face_cascade = None
        self.emotion_model_session = None
        self.emotion_model_input = None
        self.emotion_model_path = MODELS_DIR / FER_MODEL_FILENAME
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        
        # Initialize OpenCV face detector
        try:
            # Try Haar Cascade first (built into OpenCV)
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                print("⚠️ Failed to load Haar Cascade, trying DNN face detector...")
                # Try DNN face detector (more accurate)
                self._init_dnn_face_detector()
            else:
                print("✅ OpenCV Haar Cascade face detector initialized")
        except Exception as e:
            print(f"⚠️ Face detector initialization failed: {e}")
            try:
                self._init_dnn_face_detector()
            except Exception as e2:
                print(f"⚠️ DNN face detector also failed: {e2}")
        
        # Initialize FER+ ONNX model if available, fallback to heuristics
        self._ensure_emotion_model()
    
    def _init_dnn_face_detector(self):
        """Initialize OpenCV DNN face detector (more accurate)"""
        try:
            # Download DNN model files if needed (we'll use a simple approach)
            # For now, we'll use Haar Cascade as fallback
            print("🔄 Using Haar Cascade as face detector")
        except Exception as e:
            print(f"⚠️ DNN face detector failed: {e}")
    
    def _ensure_emotion_model(self):
        """Load the FER+ ONNX model if onnxruntime is available"""
        if not ONNXRUNTIME_AVAILABLE:
            print("⚠️ onnxruntime not installed; falling back to rule-based emotions")
            return
        
        if self.emotion_model_session is not None:
            return
        
        try:
            MODELS_DIR.mkdir(parents=True, exist_ok=True)
            if self.emotion_model_path.exists() and self.emotion_model_path.stat().st_size < 1024:
                # Remove corrupt/partial downloads before re-fetching
                print("⚠️ Detected incomplete FER+ model download. Removing and retrying...")
                self.emotion_model_path.unlink()
            if not self.emotion_model_path.exists():
                self._download_emotion_model()
            self.emotion_model_session = ort.InferenceSession(
                str(self.emotion_model_path),
                providers=['CPUExecutionProvider']
            )
            self.emotion_model_input = self.emotion_model_session.get_inputs()[0].name
            print("✅ FER+ ONNX emotion model initialized")
        except Exception as e:
            self.emotion_model_session = None
            self.emotion_model_input = None
            print(f"⚠️ Could not initialize FER+ emotion model: {e}")
            print("   Falling back to OpenCV heuristic analyzer")
    
    def _download_emotion_model(self):
        """Download the FER+ ONNX model to the models directory"""
        tmp_path = self.emotion_model_path.with_suffix(".tmp")
        headers = {'User-Agent': 'Mozilla/5.0'}
        last_error = None
        for url in FER_MODEL_URLS:
            print(f"⬇️ Downloading FER+ emotion model from {url} ...")
            try:
                request = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(request) as response, open(tmp_path, "wb") as out_file:
                    shutil.copyfileobj(response, out_file)
                tmp_path.replace(self.emotion_model_path)
                print(f"✅ FER+ model downloaded successfully to {self.emotion_model_path}")
                return
            except Exception as e:
                last_error = e
                print(f"⚠️ Download attempt failed: {e}")
                try:
                    if tmp_path.exists():
                        tmp_path.unlink()
                except OSError:
                    pass
        raise RuntimeError(f"Failed to download FER+ model: {last_error}") from last_error
    
    def decode_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Verify image is valid
            if img_bgr.size == 0:
                print("❌ Decoded image is empty")
                return None
            
            return img_bgr
        except Exception as e:
            print(f"❌ Error decoding image: {e}")
            return None
    
    def _detect_face(self, img: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Detect face in image, returns (x, y, w, h) or None"""
        if self.face_cascade is None or self.face_cascade.empty():
            return None
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) > 0:
            # Return the largest face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            return tuple(largest_face)
        return None
    
    def _analyze_emotion_simple(self, face_roi: np.ndarray) -> Dict[str, float]:
        """
        Improved rule-based emotion detection using facial feature analysis
        Analyzes mouth curvature, eye regions, and facial symmetry
        """
        # Convert to grayscale
        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Resize for processing
        face_resized = cv2.resize(gray, (96, 96))
        h, w = face_resized.shape
        
        # Initialize emotion scores
        emotions = {
            'neutral': 0.25,
            'happy': 0.15,
            'sad': 0.15,
            'angry': 0.15,
            'fear': 0.1,
            'surprise': 0.1,
            'disgust': 0.1
        }
        
        # Analyze face regions
        # Top third: forehead/eyebrows
        # Middle third: eyes
        # Bottom third: nose/mouth
        top_third = face_resized[:h//3, :]
        middle_third = face_resized[h//3:2*h//3, :]
        bottom_third = face_resized[2*h//3:, :]
        
        top_mean = np.mean(top_third)
        middle_mean = np.mean(middle_third)
        bottom_mean = np.mean(bottom_third)
        
        # Calculate intensity variations (indicates expression)
        std_intensity = np.std(face_resized)
        mean_intensity = np.mean(face_resized)
        
        # Analyze mouth region (bottom center)
        mouth_region = bottom_third[h//6:, w//4:3*w//4]
        mouth_mean = np.mean(mouth_region)
        mouth_std = np.std(mouth_region)
        
        # Analyze eye regions (middle third, left and right)
        left_eye = middle_third[:, :w//2]
        right_eye = middle_third[:, w//2:]
        eye_mean = (np.mean(left_eye) + np.mean(right_eye)) / 2
        
        # Emotion detection heuristics
        
        # 1. Happy: Mouth area brighter (smile), eyes may be slightly closed
        mouth_brightness_ratio = mouth_mean / mean_intensity
        if mouth_brightness_ratio > 1.15:  # Bright mouth (smile)
            emotions['happy'] += 0.5
            emotions['neutral'] -= 0.2
            emotions['sad'] -= 0.15
        elif mouth_brightness_ratio < 0.85:  # Dark mouth (frown)
            emotions['sad'] += 0.4
            emotions['angry'] += 0.2
            emotions['neutral'] -= 0.3
        
        # 2. Surprise: High variation, eyes wide open
        if std_intensity > 30 and middle_mean > mean_intensity * 1.1:
            emotions['surprise'] += 0.4
            emotions['fear'] += 0.2
            emotions['neutral'] -= 0.3
        
        # 3. Fear: High variation, eyes wide, mouth area tense
        if std_intensity > 25 and middle_mean > mean_intensity * 1.05 and mouth_std < 15:
            emotions['fear'] += 0.3
            emotions['surprise'] += 0.2
            emotions['neutral'] -= 0.25
        
        # 4. Angry: Darker overall, especially in eye/forehead region
        if top_mean < mean_intensity * 0.9 and middle_mean < mean_intensity * 0.95:
            emotions['angry'] += 0.35
            emotions['sad'] += 0.15
            emotions['neutral'] -= 0.25
        
        # 5. Disgust: Similar to angry but with mouth region variation
        if top_mean < mean_intensity * 0.92 and mouth_std > 20:
            emotions['disgust'] += 0.3
            emotions['angry'] += 0.15
            emotions['neutral'] -= 0.2
        
        # 6. Sad: Overall darker, especially mouth, low variation
        if mean_intensity < 100 and mouth_mean < mean_intensity * 0.9 and std_intensity < 20:
            emotions['sad'] += 0.4
            emotions['neutral'] -= 0.2
            emotions['happy'] -= 0.15
        
        # Ensure all values are non-negative
        emotions = {k: max(0, v) for k, v in emotions.items()}
        
        # Normalize to sum to 1.0
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v / total for k, v in emotions.items()}
        else:
            emotions = {'neutral': 1.0}
        
        return emotions
    
    def _analyze_emotion_model(self, face_roi: np.ndarray) -> Optional[Dict[str, float]]:
        """
        Run the FER+ ONNX model on the detected face ROI.
        Returns normalized emotion probabilities or None if model unavailable.
        """
        if self.emotion_model_session is None or self.emotion_model_input is None:
            return None
        
        try:
            gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            resized = cv2.resize(gray, (64, 64))
            normalized = resized.astype(np.float32) / 255.0
            normalized = (normalized - 0.5) / 0.5  # scale to roughly -1..1
            tensor = normalized.reshape(1, 1, 64, 64)
            
            outputs = self.emotion_model_session.run(
                None,
                {self.emotion_model_input: tensor}
            )[0][0]
            
            probabilities = self._softmax(outputs)
            mapped = {label: 0.0 for label in self.emotion_labels}
            
            for fer_label, prob in zip(FERPLUS_LABELS, probabilities):
                target = FERPLUS_TO_APP_LABEL.get(fer_label, 'neutral')
                mapped[target] = mapped.get(target, 0.0) + float(prob)
            
            total = sum(mapped.values())
            if total > 0:
                mapped = {k: v / total for k, v in mapped.items()}
            return mapped
        except Exception as e:
            print(f"⚠️ FER+ model inference failed: {e}")
            return None
    
    @staticmethod
    def _softmax(logits: np.ndarray) -> np.ndarray:
        """Stable softmax computation."""
        logits = np.array(logits, dtype=np.float32)
        logits -= np.max(logits)
        exps = np.exp(logits)
        total = np.sum(exps)
        return exps / total if total > 0 else np.ones_like(exps) / len(exps)
    
    def analyze_facial_expressions(self, image_data: str) -> Dict:
        """
        Analyze facial expressions from base64 encoded image
        Returns: {
            'emotions': {emotion: confidence},
            'dominant_emotion': str,
            'confidence_level': 'high'/'medium'/'low',
            'interview_state': 'confident'/'nervous'/'hesitant'/'calm',
            'emotion_scores': {...}
        }
        """
        img_array = self.decode_image(image_data)
        if img_array is None:
            print("⚠️ Failed to decode image")
            return self._default_emotion()
        
        # Detect face
        face_rect = self._detect_face(img_array)
        if face_rect is None:
            print("⚠️ No face detected in image")
            return self._default_emotion()
        
        x, y, w, h = face_rect
        face_roi = img_array[y:y+h, x:x+w]
        
        # Analyze emotion using FER+ model when available, fallback to heuristics
        detection_method = 'OpenCV (heuristic)'
        emotions = self._analyze_emotion_model(face_roi)
        if emotions:
            detection_method = 'FER+ (ONNX)'
        else:
            emotions = self._analyze_emotion_simple(face_roi)
        
        # Find dominant emotion
        dominant_emotion = max(emotions, key=emotions.get)
        max_confidence = emotions[dominant_emotion]
        
        print(f"📊 {detection_method} detected: {dominant_emotion} ({max_confidence:.2%})")
        print(f"📊 All emotions: {emotions}")
        
        # Map emotions to interview states
        interview_state, metrics = self._map_emotion_to_state(dominant_emotion, emotions)
        
        # Calculate confidence level
        if max_confidence >= 0.6:
            confidence_level = 'high'
        elif max_confidence >= 0.4:
            confidence_level = 'medium'
        else:
            confidence_level = 'low'
        
        return {
            'emotions': emotions,
            'dominant_emotion': dominant_emotion,
            'confidence_level': confidence_level,
            'interview_state': interview_state,
            'max_confidence': round(max_confidence, 2),
            'emotion_scores': emotions,
            'emotion_metrics': metrics,
            'detection_method': detection_method
        }
    
    def _compute_emotion_metrics(self, emotions: Dict[str, float]) -> Dict[str, float]:
        """Derive useful aggregates from raw emotion probabilities"""
        negative_keys = ['sad', 'fear', 'angry', 'disgust']
        negative_scores = {k: float(emotions.get(k, 0.0)) for k in negative_keys}
        positive = float(emotions.get('happy', 0.0))
        neutral = float(emotions.get('neutral', 0.0))
        surprise = float(emotions.get('surprise', 0.0))
        negative_sum = sum(negative_scores.values())
        negative_peak = max(negative_scores.values()) if negative_scores else 0.0
        balance = positive - negative_sum
        calm_margin = neutral - negative_sum
        return {
            'negative_sum': round(negative_sum, 3),
            'negative_peak': round(negative_peak, 3),
            'positive': round(positive, 3),
            'neutral': round(neutral, 3),
            'surprise': round(surprise, 3),
            'sadness': round(negative_scores.get('sad', 0.0), 3),
            'fear': round(negative_scores.get('fear', 0.0), 3),
            'angry': round(negative_scores.get('angry', 0.0), 3),
            'disgust': round(negative_scores.get('disgust', 0.0), 3),
            'balance': round(balance, 3),
            'calm_margin': round(calm_margin, 3)
        }
    
    def _map_emotion_to_state(self, dominant_emotion: str, emotions: Dict[str, float]) -> Tuple[str, Dict[str, float]]:
        """Map detected emotions to interview states with richer heuristics"""
        metrics = self._compute_emotion_metrics(emotions)
        negative_sum = metrics['negative_sum']
        negative_peak = metrics['negative_peak']
        sadness = metrics['sadness']
        surprise = metrics['surprise']
        positive = metrics['positive']
        neutral = metrics['neutral']
        
        state = 'calm'
        
        # High sadness/negative intensity → nervous
        if sadness >= 0.2 or negative_peak >= 0.25 or negative_sum >= 0.45:
            state = 'nervous'
        # Moderate persistent negativity or surprise spikes → hesitant
        elif negative_sum >= 0.3 or surprise >= 0.25:
            state = 'hesitant'
        # Happy & low negatives → confident
        elif positive >= 0.28 and negative_sum < 0.2:
            state = 'confident'
        # Calm baseline
        elif neutral >= 0.65 and negative_sum < 0.2:
            state = 'calm'
        # Fall back to dominant emotion rules
        elif dominant_emotion in ['sad', 'fear', 'angry', 'disgust']:
            state = 'nervous'
        elif dominant_emotion == 'happy':
            state = 'confident'
        elif dominant_emotion == 'surprise':
            state = 'hesitant'
        else:
            state = 'calm'
        
        return state, metrics
    
    def _default_emotion(self) -> Dict:
        """Return default emotion when detection fails"""
        baseline_metrics = self._compute_emotion_metrics({'neutral': 1.0})
        return {
            'emotions': {'neutral': 1.0},
            'dominant_emotion': 'neutral',
            'confidence_level': 'low',
            'interview_state': 'neutral',
            'max_confidence': 1.0,
            'emotion_scores': {'neutral': 1.0},
            'emotion_metrics': baseline_metrics,
            'detection_method': 'default'
        }
    
    def analyze_video_frames(self, frames_data: List[str]) -> Dict:
        """
        Analyze multiple video frames and aggregate results
        """
        if not frames_data:
            return self._default_emotion()
        
        print(f"🔍 Analyzing {len(frames_data)} video frames...")
        
        all_emotions = []
        successful_frames = 0
        
        for i, frame_data in enumerate(frames_data):
            print(f"  Frame {i+1}/{len(frames_data)}...")
            try:
                result = self.analyze_facial_expressions(frame_data)
                if result and result.get('emotions'):
                    all_emotions.append(result['emotions'])
                    successful_frames += 1
            except Exception as e:
                print(f"  ⚠️ Frame {i+1} analysis failed: {e}")
                continue
        
        print(f"✅ Successfully analyzed {successful_frames}/{len(frames_data)} frames")
        
        if not all_emotions:
            print("⚠️ No frames analyzed successfully")
            return self._default_emotion()
        
        # Aggregate emotions across frames
        aggregated = {}
        for emotion in self.emotion_labels:
            aggregated[emotion] = np.mean([e.get(emotion, 0) for e in all_emotions])
        
        # Normalize
        total = sum(aggregated.values())
        if total > 0:
            aggregated = {k: float(v / total) for k, v in aggregated.items()}
        else:
            aggregated = {'neutral': 1.0}
        
        dominant_emotion = max(aggregated, key=aggregated.get)
        max_confidence = aggregated[dominant_emotion]
        
        print(f"📊 Aggregated emotions: {aggregated}")
        print(f"📊 Dominant: {dominant_emotion} ({max_confidence:.2%})")
        
        interview_state, metrics = self._map_emotion_to_state(dominant_emotion, aggregated)
        
        return {
            'emotions': aggregated,
            'dominant_emotion': dominant_emotion,
            'confidence_level': 'high' if max_confidence >= 0.6 else 'medium' if max_confidence >= 0.4 else 'low',
            'interview_state': interview_state,
            'max_confidence': round(max_confidence, 2),
            'emotion_scores': aggregated,
            'emotion_metrics': metrics,
            'detection_method': 'FER+ (ONNX)' if self.emotion_model_session else 'OpenCV (heuristic)',
            'frames_analyzed': successful_frames
        }


def calculate_combined_score(
    content_score: float,
    sentiment_data: Dict,
    emotion_data: Dict,
    weights: Dict[str, float] = None
) -> Dict:
    """
    Calculate combined interview score from content, sentiment, and emotion
    
    Args:
        content_score: Score from AI content analysis (1-10)
        sentiment_data: Sentiment analysis results
        emotion_data: Emotion analysis results
        weights: Custom weights (default: content=0.6, sentiment=0.25, emotion=0.15)
    
    Returns:
        Dictionary with final score and breakdown
    """
    if weights is None:
        weights = {
            'content': 0.6,
            'sentiment': 0.25,
            'emotion': 0.15
        }
    
    # Normalize content score to 0-1
    content_normalized = max(0, min(1, content_score / 10.0))
    
    # Calculate sentiment score
    emotional_state = sentiment_data.get('emotional_state', 'neutral')
    overall_sentiment = sentiment_data.get('overall_sentiment', 'neutral')
    confidence_score = sentiment_data.get('confidence_score', 0.5)
    nervousness_score = sentiment_data.get('nervousness_score', 0.5)
    
    # Base sentiment score - more forgiving baseline
    # Start with confidence score, but ensure minimum baseline
    sentiment_base = max(0.3, confidence_score)  # Minimum 3/10 baseline
    
    # Apply penalties based on state (less harsh)
    if emotional_state == 'nervous':
        sentiment_base *= 0.7  # Reduced penalty (was 0.4)
    elif emotional_state == 'hesitant':
        sentiment_base *= 0.8  # Reduced penalty (was 0.6)
    elif emotional_state == 'confident':
        sentiment_base = min(1.0, sentiment_base * 1.15)  # Better boost
    elif emotional_state == 'calm':
        sentiment_base = min(1.0, sentiment_base * 1.05)  # Small boost for calm
    
    # Sentiment-based adjustments (less harsh)
    if overall_sentiment == 'negative':
        sentiment_base *= 0.6  # Reduced penalty (was 0.3)
    elif overall_sentiment == 'positive':
        sentiment_base = min(1.0, sentiment_base * 1.1)  # Better boost
    # Neutral sentiment gets no penalty (stays at base)
    
    # Nervousness penalty (less harsh, only for very high nervousness)
    if nervousness_score > 0.7:  # Only penalize very high nervousness
        sentiment_base *= 0.85  # Reduced penalty (was 0.7)
    elif nervousness_score > 0.5:
        sentiment_base *= 0.9  # Light penalty
    
    sentiment_score = max(0.2, min(1, sentiment_base))  # Minimum 2/10 instead of 0
    
    print(f"📊 Sentiment scoring: base={confidence_score:.2f}, state={emotional_state}, sentiment={overall_sentiment}, final={sentiment_score:.2f}")
    
    # Calculate emotion score
    emotions = emotion_data.get('emotions', {})
    interview_state = emotion_data.get('interview_state', 'neutral')
    emotion_metrics = emotion_data.get('emotion_metrics', {})
    
    # Extract emotion values
    sad_score = emotions.get('sad', 0)
    fear_score = emotions.get('fear', 0)
    angry_score = emotions.get('angry', 0)
    happy_score = emotions.get('happy', 0)
    neutral_score = emotions.get('neutral', 0)
    surprise_score = emotions.get('surprise', 0)
    disgust_score = emotions.get('disgust', 0)
    
    # Override with metrics when available for better accuracy
    negative_sum_metric = emotion_metrics.get('negative_sum')
    max_negative_metric = emotion_metrics.get('negative_peak')
    sadness_metric = emotion_metrics.get('sadness', sad_score)
    happy_score = emotion_metrics.get('positive', happy_score)
    neutral_score = emotion_metrics.get('neutral', neutral_score)
    
    print(f"📊 Raw emotion scores: sad={sad_score:.2%}, fear={fear_score:.2%}, angry={angry_score:.2%}, happy={happy_score:.2%}, neutral={neutral_score:.2%}")
    
    # Calculate emotion score based on actual emotion distribution
    negative_emotions = negative_sum_metric if negative_sum_metric is not None else (sad_score + fear_score + angry_score + disgust_score)
    max_negative = max_negative_metric if max_negative_metric is not None else max(sad_score, fear_score, angry_score, disgust_score)
    
    # Base score calculation (more forgiving)
    if happy_score > 0.3:
        # Positive emotion dominant
        emotion_score = 0.6 + (happy_score * 0.4)  # 0.6 to 1.0 (was 0.5-1.0)
    elif negative_emotions > 0.25 or max_negative > 0.15:  # Higher thresholds (was 0.15/0.08)
        # Strong negative emotions detected
        emotion_score = max(0.15, 0.3 - (negative_emotions * 0.3))  # Less harsh (was 0.15-0.4)
        if max_negative > 0.15:  # Higher threshold
            emotion_score = max(0.15, emotion_score - (max_negative * 0.8))  # Less harsh (was 1.0)
    elif neutral_score > 0.6:  # Lower threshold (was 0.7)
        # Mostly neutral - give better baseline
        emotion_score = 0.5 + (neutral_score * 0.2)  # 0.5-0.7 range (was 0.35)
    else:
        # Mixed emotions - more balanced
        emotion_score = 0.5 + (happy_score * 0.4) - (negative_emotions * 0.3)  # Better baseline
        emotion_score = max(0.3, min(1.0, emotion_score))  # Minimum 3/10 (was 0.5/10)
    
    # Additional adjustments based on richer metrics
    if sadness_metric >= 0.2:
        emotion_score *= 0.55
    elif sadness_metric >= 0.15:
        emotion_score *= 0.75
    
    if happy_score >= 0.35 and negative_emotions < 0.2:
        emotion_score = min(1.0, emotion_score + 0.1)
    
    # Apply state-based modifiers (less harsh)
    if interview_state == 'nervous':
        emotion_score *= 0.75  # Reduced penalty (was 0.5)
    elif interview_state == 'hesitant':
        emotion_score *= 0.85  # Reduced penalty (was 0.7)
    elif interview_state == 'confident':
        emotion_score = min(1.0, emotion_score * 1.15)  # Better boost
    elif interview_state == 'calm':
        emotion_score = min(1.0, emotion_score * 1.05)  # Small boost for calm
    
    emotion_score = max(0, min(1, emotion_score))
    
    if neutral_score >= 0.9 and negative_emotions < 0.1 and happy_score < 0.1:
        print(f"⚪ Mixed/neutral emotions → emotion_score={emotion_score:.2f} ({emotion_score*10:.1f}/10)")
    else:
        print(f"📊 Emotion scoring: state={interview_state}, score={emotion_score:.2f} ({emotion_score*10:.1f}/10)")
    
    # Calculate weighted final score
    final_score = (
        content_normalized * weights['content'] +
        sentiment_score * weights['sentiment'] +
        emotion_score * weights['emotion']
    )
    
    # Convert back to 1-10 scale
    final_score_10 = max(1, min(10, final_score * 10))
    
    print(f"📊 Final Score: {final_score_10:.1f}/10 (Content: {content_score:.1f}, Sentiment: {sentiment_score*10:.1f}, Emotion: {emotion_score*10:.1f})")
    
    return {
        'final_score': round(final_score_10, 1),
        'content_score': round(content_score, 1),
        'sentiment_score': round(sentiment_score * 10, 1),
        'emotion_score': round(emotion_score * 10, 1),
        'sentiment_data': sentiment_data,
        'emotion_data': emotion_data,
        'weights': weights
    }
