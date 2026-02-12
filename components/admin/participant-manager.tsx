"use client";

import { useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { Participant, DistanceDetail } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertModal } from "@/components/ui/alert-modal";

interface ParticipantManagerProps {
  eventId: string;
  participants: Participant[];
  distances: DistanceDetail[];
  onParticipantsChange: () => void;
}

export function ParticipantManager({
  eventId,
  participants,
  distances,
  onParticipantsChange,
}: ParticipantManagerProps) {
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    distance: "",
  });
  const { alertModal, showConfirm, showError } = useAlertModal();

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          name: newParticipant.name,
          distance: newParticipant.distance,
        }),
      });

      if (res.ok) {
        setNewParticipant({ name: "", distance: "" });
        onParticipantsChange();
      } else {
        showError("Gagal menambahkan peserta");
      }
    } catch {
      showError("Terjadi kesalahan saat menambahkan peserta");
    }
  };

  const confirmDeleteParticipant = (participantId: string) => {
    showConfirm(
      "Hapus peserta ini?",
      () => handleDeleteParticipant(participantId),
      { title: "Hapus Peserta" },
    );
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
      const res = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onParticipantsChange();
      }
    } catch {
      showError("Gagal menghapus peserta");
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle>Peserta</CardTitle>
            <Badge variant="secondary" className="rounded-full">
              {participants.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-6">
          {/* Add Participant Form */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Tambah Peserta</h3>
            <form
              onSubmit={handleAddParticipant}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Nama"
                    value={newParticipant.name}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        name: e.target.value,
                      })
                    }
                    className="bg-background pr-10"
                    required
                  />
                  {newParticipant.name && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setNewParticipant({ ...newParticipant, name: "" })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-32 relative">
                <Select
                  value={newParticipant.distance}
                  onValueChange={(value) =>
                    setNewParticipant({
                      ...newParticipant,
                      distance: value,
                    })
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Jarak" />
                  </SelectTrigger>
                  <SelectContent>
                    {distances.map((d, i) => (
                      <SelectItem key={i} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newParticipant.distance && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-6 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setNewParticipant({
                        ...newParticipant,
                        distance: "",
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Button type="submit" size="icon" className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Participants List */}
          <div className="flex-1 overflow-auto border rounded-md max-h-[500px]">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p className="text-sm">Belum ada peserta.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Jarak</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-medium">
                        {p.distance || "-"}
                      </TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteParticipant(p.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      {alertModal}
    </>
  );
}
