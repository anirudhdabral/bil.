"use client";

import { useMutation } from "@apollo/client/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PhotoView } from "react-photo-view";
import {
  FiCamera,
  FiCheck,
  FiRotateCcw,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import { CREATE_BILL } from "../../lib/graphql/operations";
import type { BillCategory } from "../../lib/graphql/types";
import { useAppDispatch } from "../../lib/redux/hooks";
import {
  setGlobalError,
  setGlobalLoading,
} from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type AddBillFormProps = {
  homeId: string;
  categories: BillCategory[];
  onSuccess: () => Promise<void> | void;
};

function toJpgFilename(name: string) {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

async function normalizeSelectedImage(file: File): Promise<File> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/images/normalize", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Failed to process selected image.";

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Keep the default fallback message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  return new File([blob], toJpgFilename(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function AddBillForm({
  homeId,
  categories,
  onSuccess,
}: AddBillFormProps) {
  const dispatch = useAppDispatch();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const fileInputId = useId();

  const [date, setDate] = useState(today);
  const [remarks, setRemarks] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(
    null,
  );
  const [preparingImage, setPreparingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    const nextUrl = URL.createObjectURL(image);
    setImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [image]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (capturedPreviewUrl && capturedPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  const [createBill, { loading, error }] = useMutation(CREATE_BILL, {
    refetchQueries: "active",
    awaitRefetchQueries: true,
  });

  async function handleImageSelection(file: File | null) {
    setFormError(null);

    if (!file) {
      setImage(null);
      return;
    }

    setPreparingImage(true);

    try {
      const normalizedFile = await normalizeSelectedImage(file);
      setImage(normalizedFile);
    } catch (selectionError) {
      setImage(null);
      setFormError(
        selectionError instanceof Error
          ? selectionError.message
          : "Failed to process selected image.",
      );
    } finally {
      setPreparingImage(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    dispatch(setGlobalError(null));

    if (!date || !categoryId) {
      setFormError("Date and category are required.");
      return;
    }

    if (remarks.length > 255) {
      setFormError("Remarks must be 255 characters or less.");
      return;
    }

    if (preparingImage) {
      setFormError("Please wait for the image to finish processing.");
      return;
    }

    if (image && image.size > 2 * 1024 * 1024) {
      setFormError("Image must be 2MB or smaller after conversion.");
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await createBill({
        variables: {
          date: new Date(date).toISOString(),
          remarks: remarks.trim() || null,
          categoryId,
          homeId,
          image,
        },
      });

      setDate(today);
      setRemarks("");
      setImage(null);
      setCapturedFile(null);
      setCapturedPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      await onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error
            ? mutationError.message
            : "Failed to create bill",
        ),
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  function stopCameraStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function openCamera() {
    setCameraError(null);
    setCapturedFile(null);
    setCapturedPreviewUrl((current) => {
      if (current && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        // Fallback for desktops/laptops which may reject facingMode entirely
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError(
        "Unable to access camera. Please check camera permissions.",
      );
    }
  }

  function cancelCamera() {
    stopCameraStream();
    setCameraOpen(false);
    setCapturedFile(null);
    setCapturedPreviewUrl((current) => {
      if (current && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }

  function capturePhoto() {
    if (!videoRef.current) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Failed to process captured image.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture image.");
          return;
        }

        const file = new File([blob], `captured-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setCapturedFile(file);
        const url = URL.createObjectURL(file);
        setCapturedPreviewUrl((current) => {
          if (current && current.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }
          return url;
        });
      },
      "image/jpeg",
      0.9,
    );
  }

  function confirmCapturedPhoto() {
    if (!capturedFile) {
      return;
    }

    setImage(capturedFile);
    stopCameraStream();
    setCameraOpen(false);
    setCapturedFile(null);
    setCapturedPreviewUrl((current) => {
      if (current && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }

  function renderPreview(src: string, alt: string, className: string) {
    return (
      <PhotoView src={src}>
        <button
          type="button"
          className="block w-full overflow-hidden rounded-xl border border-[#e8d8c0] bg-[#fef9f2] p-2 text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className={className} />
        </button>
      </PhotoView>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
          Date
        </span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
          Remarks
        </span>
        <textarea
          value={remarks}
          maxLength={255}
          onChange={(event) => setRemarks(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          rows={3}
          placeholder="Optional remarks..."
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
          Category
        </span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
          Image (optional)
        </p>
        <input
          id={fileInputId}
          type="file"
          accept="image/*,.heic,.heif,.avif"
          onChange={(event) => {
            void handleImageSelection(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
          className="hidden"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={fileInputId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8d8c0] bg-[#fef9f2] px-3 py-2 text-sm font-semibold text-[#44382a] transition hover:border-amber-200 hover:bg-amber-50"
          >
            <FiUploadCloud className="h-4 w-4 text-amber-600" />
            {preparingImage ? "Processing..." : "Choose File"}
          </label>
          <button
            type="button"
            onClick={() => void openCamera()}
            disabled={preparingImage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
          >
            <FiCamera className="h-4 w-4" />
            Camera
          </button>
          {image ? (
            <button
              type="button"
              onClick={() => setImage(null)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          ) : null}
        </div>
        {image ? (
          <p className="truncate text-xs font-medium text-[#78604a]">
            {image.name}
          </p>
        ) : (
          <p className="text-xs text-[#b8926a]">
            Modern phone images are converted to JPG automatically, max 2MB
            after conversion.
          </p>
        )}
        {imagePreviewUrl
          ? renderPreview(
              imagePreviewUrl,
              "Selected preview",
              "max-h-40 w-full rounded-lg object-contain",
            )
          : null}
        {cameraError ? (
          <p className="text-xs text-red-600">{cameraError}</p>
        ) : null}
      </div>

      {cameraOpen ? (
        <div className="fixed inset-0 z-9999 flex flex-col bg-black">
          {/* Top Bar */}
          <div className="relative z-10 flex w-full items-center justify-between bg-linear-to-b from-black/60 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
            <button
              type="button"
              onClick={cancelCamera}
              className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <FiX className="h-6 w-6" />
            </button>
            <span className="text-sm font-medium tracking-widest uppercase text-white/90 drop-shadow-md">
              {capturedPreviewUrl ? "Preview" : "Capture"}
            </span>
            <div className="w-10" /> {/* Spacer to center the text */}
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-black pb-[env(safe-area-inset-bottom)]">
            {!capturedPreviewUrl ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-contain"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Capture button overlay */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center pb-[env(safe-area-inset-bottom)]">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="group relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-white bg-transparent transition active:scale-95"
                  >
                    <div className="absolute inset-1 rounded-full bg-white transition group-hover:bg-gray-200 group-active:bg-gray-300"></div>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedPreviewUrl}
                  alt="Captured preview"
                  className="h-full w-full object-contain"
                />
                {/* Review actions overlay */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent p-6 pb-[max(2rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedFile(null);
                      setCapturedPreviewUrl((current) => {
                        if (current && current.startsWith("blob:")) {
                          URL.revokeObjectURL(current);
                        }
                        return null;
                      });
                    }}
                    className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <FiRotateCcw className="h-5 w-5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#1a1208] shadow-lg shadow-amber-400/20 transition hover:bg-amber-500 active:scale-95"
                  >
                    <FiCheck className="h-5 w-5" />
                    Use Photo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {formError ? <ErrorMessage message={formError} /> : null}
      {error?.message ? <ErrorMessage message={error.message} /> : null}

      <button
        type="submit"
        disabled={loading || preparingImage || categories.length === 0}
        className="w-full rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm shadow-amber-200 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-60"
      >
        {preparingImage
          ? "Processing image..."
          : loading
            ? "Saving..."
            : "Save Bill"}
      </button>
      {categories.length === 0 ? (
        <p className="text-xs font-medium text-amber-700">
          Add a category before creating a bill.
        </p>
      ) : null}
    </form>
  );
}
