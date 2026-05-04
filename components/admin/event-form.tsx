"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";
import { DistanceDetail } from "@/types";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClearableInput } from "@/components/ui/clearable-input";
import { DatePickerField } from "@/components/admin/date-picker-field";
import { DistanceFieldset } from "@/components/admin/distance-fieldset";

export interface EventFormData {
  title: string;
  slug: string;
  event_date: string;
  end_date: string;
  location: string;
  distances: DistanceDetail[];
  description: string;
}

interface EventFormProps {
  initialData?: EventFormData;
  onSubmit: (data: EventFormData) => Promise<void>;
  submitLabel: string;
  loadingLabel: string;
  compact?: boolean;
}

const defaultFormData: EventFormData = {
  title: "",
  slug: "",
  event_date: "",
  end_date: "",
  location: "",
  distances: [],
  description: "",
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EventForm({
  initialData,
  onSubmit,
  submitLabel,
  loadingLabel,
  compact,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(
    initialData ?? defaultFormData,
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "title") {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleDateSelect = (
    field: "event_date" | "end_date",
    date: Date | undefined,
  ) => {
    if (!date) return;
    setFormData((prev) => ({
      ...prev,
      [field]: format(date, "yyyy-MM-dd"),
    }));
  };

  const handleDateClear = (field: "event_date" | "end_date") => {
    setFormData((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleAddDistance = () => {
    setFormData((prev) => ({
      ...prev,
      distances: [
        ...prev.distances,
        {
          name: "",
          date: prev.event_date || "",
          start_time: "",
          cot: "",
        },
      ],
    }));
  };

  const handleRemoveDistance = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      distances: prev.distances.filter((_, i) => i !== index),
    }));
  };

  const handleDistanceChange = (
    index: number,
    field: keyof DistanceDetail,
    value: string,
  ) => {
    setFormData((prev) => {
      const newDistances = [...prev.distances];
      newDistances[index] = { ...newDistances[index], [field]: value };
      return { ...prev, distances: newDistances };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const spacing = compact ? "space-y-4" : "space-y-6";

  return (
    <form onSubmit={handleSubmit} className={spacing}>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Judul Event</Label>
        <ClearableInput
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleChange}
          onClear={() => setFormData((prev) => ({ ...prev, title: "", slug: "" }))}
          placeholder="Contoh: Jakarta Marathon 2026"
        />
      </div>

      {/* Date */}
      <div className="space-y-2 flex flex-col">
        <Label>Tanggal</Label>
        <DatePickerField
          value={formData.event_date}
          onChange={(date) => handleDateSelect("event_date", date)}
          onClear={() => handleDateClear("event_date")}
        />
      </div>

      {/* End Date */}
      <div className="space-y-2 flex flex-col">
        <Label>Tanggal Selesai (Opsional)</Label>
        <DatePickerField
          value={formData.end_date}
          onChange={(date) => handleDateSelect("end_date", date)}
          onClear={() => handleDateClear("end_date")}
          placeholder="Pilih tanggal selesai"
          defaultMonth={
            formData.end_date
              ? new Date(formData.end_date)
              : formData.event_date
                ? new Date(formData.event_date)
                : undefined
          }
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <ClearableInput
          type="text"
          name="location"
          id="location"
          required
          value={formData.location}
          onChange={handleChange}
          onClear={() => setFormData((prev) => ({ ...prev, location: "" }))}
          placeholder="Contoh: GBK, Jakarta"
        />
      </div>

      {/* Distances */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Kategori Jarak</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDistance}
          >
            <Plus className={`${compact ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
            Tambah
          </Button>
        </div>

        <div className="space-y-3">
          {formData.distances.map((dist, idx) => (
            <DistanceFieldset
              key={idx}
              distance={dist}
              index={idx}
              eventDate={formData.event_date}
              onChange={handleDistanceChange}
              onRemove={handleRemoveDistance}
              compact={compact}
            />
          ))}
          {formData.distances.length === 0 && (
            <div className={`text-center ${compact ? "p-4" : "p-6"} border border-dashed rounded-lg text-${compact ? "xs" : "sm"} text-muted-foreground`}>
              Belum ada kategori jarak{compact ? "" : " ditambahkan"}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <div className="relative">
          <Textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Ceritakan tentang lomba ini..."
            className="resize-none pr-10"
          />
          {formData.description && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() =>
                setFormData((prev) => ({ ...prev, description: "" }))
              }
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className={`flex justify-end ${compact ? "pt-4" : "pt-2"}`}>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
