"use client";

import { useState } from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import type { TournamentMatch } from "@/domain/matches/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface MatchActionMenuProps {
  readonly match: TournamentMatch;
  readonly isDeletingMatch: boolean;
  readonly onDelete: (match: TournamentMatch) => void;
  readonly triggerClassName?: string;
}

export function MatchActionMenu({
  match,
  isDeletingMatch,
  onDelete,
  triggerClassName,
}: MatchActionMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const displayName = match.name ?? `Match ${match.matchNumber}`;

  return (
    <>
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            className={
              triggerClassName ??
              "w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            }
            aria-label={`Match ${match.matchNumber} options`}
            disabled={isDeletingMatch}
            title="Match options"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <circle cx="5" cy="12" r="2" />
            </svg>
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-md animate-in fade-in-80"
          >
            <DropdownMenuPrimitive.Item
              className="relative flex cursor-pointer select-none items-center rounded px-2.5 py-1.5 text-xs font-medium text-red-600 outline-none hover:bg-red-50 focus:bg-red-50 focus:text-red-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onSelect={() => {
                setDialogOpen(true);
              }}
            >
              Delete Match
            </DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its saved result draft will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isDeletingMatch}
              onClick={() => {
                onDelete(match);
                setDialogOpen(false);
              }}
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
