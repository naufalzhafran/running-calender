"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AlertModalType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "confirm";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: AlertModalType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  confirm: AlertTriangle,
};

const iconColorMap = {
  success: "text-green-500",
  error: "text-destructive",
  warning: "text-yellow-500",
  info: "text-blue-500",
  confirm: "text-yellow-500",
};

const defaultTitles = {
  success: "Berhasil",
  error: "Error",
  warning: "Peringatan",
  info: "Informasi",
  confirm: "Konfirmasi",
};

export function AlertModal({
  open,
  onOpenChange,
  type = "info",
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: AlertModalProps) {
  const Icon = iconMap[type];
  const iconColor = iconColorMap[type];
  const displayTitle = title || defaultTitles[type];
  const isConfirm = type === "confirm";

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`shrink-0 ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <DialogTitle>{displayTitle}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {isConfirm ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                {cancelText || "Batal"}
              </Button>
              <Button onClick={handleConfirm} variant="destructive">
                {confirmText || "Ya, Hapus"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConfirm}>{confirmText || "OK"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
interface UseAlertModalReturn {
  alertModal: React.ReactNode;
  showAlert: (options: Omit<AlertModalProps, "open" | "onOpenChange">) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    options?: Partial<
      Pick<AlertModalProps, "title" | "confirmText" | "cancelText">
    >,
  ) => void;
  showSuccess: (message: string, onConfirm?: () => void) => void;
  showError: (message: string, onConfirm?: () => void) => void;
}

export function useAlertModal(): UseAlertModalReturn {
  const [modalState, setModalState] = React.useState<{
    open: boolean;
    props: Omit<AlertModalProps, "open" | "onOpenChange">;
  }>({
    open: false,
    props: { message: "" },
  });

  const showAlert = React.useCallback(
    (options: Omit<AlertModalProps, "open" | "onOpenChange">) => {
      setModalState({ open: true, props: options });
    },
    [],
  );

  const showConfirm = React.useCallback(
    (
      message: string,
      onConfirm: () => void,
      options?: Partial<
        Pick<AlertModalProps, "title" | "confirmText" | "cancelText">
      >,
    ) => {
      setModalState({
        open: true,
        props: {
          type: "confirm",
          message,
          onConfirm,
          ...options,
        },
      });
    },
    [],
  );

  const showSuccess = React.useCallback(
    (message: string, onConfirm?: () => void) => {
      setModalState({
        open: true,
        props: { type: "success", message, onConfirm },
      });
    },
    [],
  );

  const showError = React.useCallback(
    (message: string, onConfirm?: () => void) => {
      setModalState({
        open: true,
        props: { type: "error", message, onConfirm },
      });
    },
    [],
  );

  const alertModal = (
    <AlertModal
      open={modalState.open}
      onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
      {...modalState.props}
    />
  );

  return { alertModal, showAlert, showConfirm, showSuccess, showError };
}
