import {
  Bot,
  Camera,
  Image as ImageIcon,
  ImagePlus,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Loader from "../components/Loader.jsx";
import { getApiMessage } from "../utils/helpers.js";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_IMAGE_INPUT = "image/jpeg,image/png,image/webp";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [toolError, setToolError] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechBaseRef = useRef("");
  const imagePreviewRef = useRef("");
  const capturedPreviewRef = useRef("");

  useEffect(() => {
    api
      .get("/ai/history")
      .then(({ data }) => {
        setMessages(
          data.chats.flatMap((chat) => [
            { id: `${chat.id}-q`, role: "student", text: chat.question, imageAttached: Boolean(chat.image_attached) },
            { id: `${chat.id}-a`, role: "assistant", text: chat.answer }
          ])
        );
      })
      .catch((err) => setError(getApiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replying]);

  useEffect(() => {
    if (!cameraOpen || capturedPhoto) return undefined;
    let active = true;

    async function startCamera() {
      setCameraBusy(true);
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraBusy(false);
        setCameraError("Camera is not available in this browser. Please upload an image.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (active) setCameraError("Camera permission denied. Please allow camera access or upload an image.");
      } finally {
        if (active) setCameraBusy(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCameraStream();
    };
  }, [cameraOpen, capturedPhoto]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      stopListening();
      revokePreview(imagePreviewRef);
      revokePreview(capturedPreviewRef);
    };
  }, []);

  function revokePreview(ref) {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
      ref.current = "";
    }
  }

  function stopCameraStream() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function clearCapturedPhoto() {
    revokePreview(capturedPreviewRef);
    setCapturedPhoto(null);
  }

  function validateImage(file) {
    if (!file) return false;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setToolError("Unsupported file type. Please upload a JPEG, PNG, or WebP photo.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setToolError("Image is too large. Please upload a photo under 8 MB.");
      return false;
    }
    return true;
  }

  function attachImage(file) {
    if (!validateImage(file)) return;
    revokePreview(imagePreviewRef);
    const preview = URL.createObjectURL(file);
    imagePreviewRef.current = preview;
    setAttachedImage({ file, preview, name: file.name || "Captured image" });
    setToolError("");
  }

  function clearImage() {
    revokePreview(imagePreviewRef);
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    attachImage(file);
    event.target.value = "";
  }

  function openCamera() {
    setToolError("");
    setCameraError("");
    clearCapturedPhoto();
    setCameraOpen(true);
  }

  function closeCamera() {
    stopCameraStream();
    clearCapturedPhoto();
    setCameraBusy(false);
    setCameraError("");
    setCameraOpen(false);
  }

  function retakePhoto() {
    setCameraError("");
    clearCapturedPhoto();
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera preview is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not capture the photo. Please try again or upload an image.");
          return;
        }

        stopCameraStream();
        clearCapturedPhoto();
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        const preview = URL.createObjectURL(file);
        capturedPreviewRef.current = preview;
        setCapturedPhoto({ file, preview });
      },
      "image/jpeg",
      0.9
    );
  }

  function useCapturedPhoto() {
    if (!capturedPhoto) return;
    attachImage(capturedPhoto.file);
    closeCamera();
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Some browsers throw if recognition already ended.
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }

  function toggleListening() {
    setToolError("");
    if (listening) {
      stopListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToolError("Speech input is not supported in this browser. Please type your question.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    speechBaseRef.current = question.trim();

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const base = speechBaseRef.current;
      setQuestion([base, spoken].filter(Boolean).join(" ").trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setToolError("Microphone permission denied. Please allow microphone access or type your question.");
      } else {
        setToolError("Speech input stopped. Please try again or type your question.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setListening(false);
      setToolError("Speech input could not start. Please try again or type your question.");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) {
      setError("Type or speak a repair question before sending.");
      return;
    }

    const imageToSend = attachedImage;
    const imageAttached = Boolean(imageToSend);
    setQuestion("");
    setError("");
    setToolError("");
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "student", text, imageAttached }
    ]);
    setReplying(true);

    try {
      let response;
      if (imageToSend) {
        const formData = new FormData();
        formData.append("message", text);
        formData.append("image", imageToSend.file);
        clearImage();
        response = await api.post("/ai/chat", formData);
      } else {
        response = await api.post("/ai/chat", { question: text });
      }

      const { data } = response;
      setMessages((current) => [...current, { id: `${data.chat.id}-a`, role: "assistant", text: data.chat.answer }]);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="order-2 flex h-[calc(100vh-150px)] min-h-[70vh] flex-col p-0 lg:order-1">
        <div className="border-b border-white/10 p-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Bot className="text-electric-400" />
            AI Repair Assistant
          </h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? <Loader label="Loading chat" /> : null}
          {!loading && !messages.length ? (
            <div className="rounded-lg border border-dashed border-white/[0.15] p-6 text-center text-slate-300">
              Ask about charging, display, battery drain, network, camera, audio, flashing, schematics, or IC basics.
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "student" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? (
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-electric-500 text-white">
                  <Bot size={18} />
                </div>
              ) : null}
              <div
                className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 ${
                  message.role === "student" ? "bg-electric-500 text-white" : "bg-white/[0.08] text-slate-100"
                }`}
              >
                {message.imageAttached ? (
                  <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-black/20 px-2 py-1 text-xs font-semibold text-white">
                    <ImageIcon size={14} />
                    Image attached
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
              {message.role === "student" ? (
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-slate-200">
                  <UserRound size={18} />
                </div>
              ) : null}
            </div>
          ))}
          {replying ? (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="typing-dot" />
              Gemini is analyzing...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
          {error ? <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          {attachedImage ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-electric-400/30 bg-electric-500/10 px-3 py-2 text-sm text-slate-100">
              <span className="inline-flex items-center gap-2 font-semibold">
                <ImageIcon size={16} className="text-electric-400" />
                Image attached
              </span>
              <button type="button" onClick={clearImage} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-200 hover:text-white">
                <X size={14} />
                Remove
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Phone takes charging but battery percentage does not increase"
              className="min-h-12 flex-1 resize-none rounded-lg border border-white/10 bg-navy-900/80 px-3 py-3 text-sm text-slate-100 outline-none focus:border-electric-400 focus:ring-2 focus:ring-electric-500/25"
            />
            <Button type="submit" icon={Send} disabled={replying} aria-label="Send question">
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="order-1 space-y-4 self-start lg:order-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <ImagePlus className="text-electric-400" size={19} />
          Image & Voice Tools
        </h3>

        <div className="grid gap-2">
          <Button type="button" variant="secondary" icon={Camera} onClick={openCamera}>
            Camera
          </Button>
          <Button type="button" variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>
            Upload Image
          </Button>
          <Button type="button" variant={listening ? "danger" : "secondary"} icon={listening ? MicOff : Mic} onClick={toggleListening}>
            {listening ? "Stop Listening" : "Microphone"}
          </Button>
          <Button type="button" variant="ghost" icon={Trash2} onClick={clearImage} disabled={!attachedImage}>
            Clear Image
          </Button>
        </div>

        <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_INPUT} onChange={handleUpload} className="hidden" />

        <div className="overflow-hidden rounded-lg border border-dashed border-white/[0.15] bg-navy-900/70">
          {attachedImage ? (
            <img src={attachedImage.preview} alt="Attached repair reference" className="h-52 w-full object-contain" />
          ) : (
            <div className="grid h-52 place-items-center px-4 text-center text-sm text-slate-400">
              <div>
                <ImageIcon className="mx-auto mb-3 text-slate-500" size={34} />
                No image attached
              </div>
            </div>
          )}
        </div>

        <p className="text-xs leading-5 text-slate-400">Upload PCB, phone, connector, IC, display, charging section, or damage photos.</p>

        {listening ? (
          <div className="rounded-lg border border-electric-400/30 bg-electric-500/10 p-3 text-sm font-semibold text-electric-400">
            Listening...
          </div>
        ) : null}

        {toolError ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{toolError}</div> : null}
      </Card>

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-xl rounded-lg border border-white/10 bg-navy-900 p-4 shadow-glow">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Camera className="text-electric-400" size={19} />
                Camera
              </h3>
              <button type="button" onClick={closeCamera} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close camera">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
              {capturedPhoto ? (
                <img src={capturedPhoto.preview} alt="Captured repair reference" className="max-h-[60vh] w-full object-contain" />
              ) : (
                <div className="relative">
                  <video ref={videoRef} playsInline muted className="max-h-[60vh] min-h-64 w-full bg-black object-contain" />
                  {cameraBusy ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-slate-100">
                      Opening camera...
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {cameraError ? <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{cameraError}</div> : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {capturedPhoto ? (
                <>
                  <Button type="button" variant="secondary" icon={RotateCcw} onClick={retakePhoto}>
                    Retake
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeCamera}>
                    Cancel
                  </Button>
                  <Button type="button" icon={ImagePlus} onClick={useCapturedPhoto}>
                    Use Photo
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={closeCamera}>
                    Cancel
                  </Button>
                  <Button type="button" icon={Camera} onClick={capturePhoto} disabled={cameraBusy || Boolean(cameraError)}>
                    Capture
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
