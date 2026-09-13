"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#10151a] group-[.toaster]:text-slate-300 group-[.toaster]:border-slate-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-400",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-black",
          cancelButton: "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400",
        },
      }}
      closeButton
      mobileOffset="calc(80px + env(safe-area-inset-bottom))"
      {...props}
    />
  )
}

export { Toaster }
