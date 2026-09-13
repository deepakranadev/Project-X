"use client";

import { useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

interface TeamDeletionControlsProps {
  readonly isDeleting: boolean;
  readonly teamName: string;
  readonly onDelete: () => void;
}

export function TeamDeletionControls({
  isDeleting,
  teamName,
  onDelete,
}: TeamDeletionControlsProps) {
  const [open, setOpen] = useState(false);

  const prevIsDeleting = useRef(isDeleting);
  useEffect(() => {
    if (prevIsDeleting.current && !isDeleting) {
      setOpen(false);
    }
    prevIsDeleting.current = isDeleting;
  }, [isDeleting]);

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <AlertDialog
        open={open}
        onOpenChange={(val) => {
          if (!isDeleting) setOpen(val);
        }}
      >
        <AlertDialogTrigger asChild>
          <button
            className="min-h-11 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
            type="button"
          >
            Remove team
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {teamName} from this tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the locally saved team record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              type="button"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              {isDeleting ? "Removing…" : "Yes, remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
