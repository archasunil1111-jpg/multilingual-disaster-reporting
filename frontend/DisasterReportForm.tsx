import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle,
  MapPin,
  Mic,
  Send,
} from "lucide-react";

// Validation schema
const disasterReportSchema = z.object({
  disasterType: z
    .string()
    .min(1, "Please select a disaster type"),

  severityLevel: z
    .number()
    .min(1)
    .max(5),

  description: z
    .string()
    .min(5, "Please provide emergency details"),

  language: z
    .string()
    .default("auto"),

  affectedPeopleCount: z
    .number()
    .min(0),

  location: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    district: z.string().optional(),
    landmark: z.string().optional(),
  }),
});

type DisasterReportFormValues =
  z.infer<typeof disasterReportSchema>;

export default function DisasterReportForm() {
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);
  const [videoFile, setVideoFile] =
    useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DisasterReportFormValues>({
    resolver: zodResolver(disasterReportSchema),

    defaultValues: {
      severityLevel: 3,
      affectedPeopleCount: 1,
      language: "auto",

      location: {
        latitude: null,
        longitude: null,
      },
    },
  });

  const severity = watch("severityLevel");

  // Get user's GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue(
          "location.latitude",
          position.coords.latitude
        );

        setValue(
          "location.longitude",
          position.coords.longitude
        );

        setIsLocating(false);
      },

      (error) => {
        console.error(
          "Error fetching location:",
          error
        );

        setIsLocating(false);
      },

      {
        enableHighAccuracy: true,
      }
    );
  };

  // Handle photo upload
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Photo size must be less than 5MB");
        return;
      }

      setPhotoPreview(
        URL.createObjectURL(file)
      );
    }
  };

  // Handle video upload
  const handleVideoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("Video size must be less than 20MB");
        return;
      }

      setVideoFile(file);
    }
  };

  // Submit emergency report
  const onSubmit = async (
    data: DisasterReportFormValues
  ) => {
    const formData = new FormData();

    formData.append(
      "reportData",
      JSON.stringify(data)
    );

    if (videoFile) {
      formData.append(
        "video",
        videoFile
      );
    }

    try {
      const response = await fetch(
        "/api/disaster/report",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        alert(
          "Emergency alert submitted successfully!"
        );
      } else {
        alert(
          "Failed to submit report. Please try again."
        );
      }
    } catch (err) {
      console.error(
        "Submission error:",
        err
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 text-white p-6 rounded-xl shadow-2xl">

      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-gray-800 pb-4 mb-6">

        <AlertTriangle className="text-red-500 w-8 h-8" />

        <h1 className="text-2xl font-bold">
          Multilingual Disaster Reporting System
        </h1>

      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >

        {/* Disaster Type */}
        <div>

          <label className="block text-sm font-medium text-gray-300 mb-2">
            Disaster Category
          </label>

          <select
            {...register("disasterType")}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
          >

            <option value="">
              Select Category...
            </option>

            <option value="flood">
              Flood
            </option>

            <option value="earthquake">
              Earthquake
            </option>

            <option value="fire">
              Fire
            </option>

            <option value="landslide">
              Landslide
            </option>

            <option value="medical">
              Medical Emergency
            </option>

          </select>

          {errors.disasterType && (
            <p className="text-red-400 text-sm mt-1">
              {errors.disasterType.message}
            </p>
          )}

        </div>

        {/* Severity */}
        <div>

          <label className="block text-sm font-medium text-gray-300 mb-1">

            Severity Level:

            <span className="font-bold text-red-400">
              {" "}
              {severity} / 5
            </span>

          </label>

          <input
            type="range"
            min="1"
            max="5"
            {...register(
              "severityLevel",
              {
                valueAsNumber: true,
              }
            )}
            className="w-full accent-red-500 cursor-pointer"
          />

        </div>

        {/* Emergency Description */}
        <div>

          <div className="flex justify-between items-center mb-2">

            <label className="text-sm font-medium text-gray-300">
              Emergency Details
              (Native Text or Voice)
            </label>

            <button
              type="button"
              onClick={() =>
                setIsRecording(!isRecording)
              }
              className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-full ${
                isRecording
                  ? "bg-red-600 animate-pulse"
                  : "bg-gray-700"
              }`}
            >

              <Mic className="w-3 h-3" />

              <span>
                {isRecording
                  ? "Listening..."
                  : "Voice Input"}
              </span>

            </button>

          </div>

          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the situation in your native language..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
          />

          {errors.description && (
            <p className="text-red-400 text-sm mt-1">
              {errors.description.message}
            </p>
          )}

        </div>

        {/* Location */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">

          <div className="flex justify-between items-center">

            <span className="text-sm font-medium text-gray-300">
              Location Identification
            </span>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center space-x-2 bg-blue-600 px-3 py-1.5 rounded-md text-xs font-semibold"
            >

              <MapPin className="w-4 h-4" />

              <span>
                {isLocating
                  ? "Locating..."
                  : "Get GPS Coordinates"}
              </span>

            </button>

          </div>

          <input
            type="text"
            {...register(
              "location.landmark"
            )}
            placeholder="Nearby landmark or address..."
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-white"
          />

        </div>

        {/* Media Attachments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Photo */}
          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              Attach Photo (Max 5MB)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-xs text-gray-400"
            />

            {photoPreview && (
              <img
                src={photoPreview}
                alt="Emergency preview"
                className="mt-2 h-20 w-full object-cover rounded-md"
              />
            )}

          </div>

          {/* Video */}
          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              Attach Video (Max 20MB)
            </label>

            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="block w-full text-xs text-gray-400"
            />

          </div>

        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2"
        >

          <Send className="w-5 h-5" />

          <span>
            {isSubmitting
              ? "Broadcasting Alert..."
              : "Send Emergency Alert"}
          </span>

        </button>

      </form>

    </div>
  );
}
