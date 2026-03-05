"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        className:
          "!rounded-2xl !border !shadow-lg !font-sans !text-sm !py-3 !px-4 !gap-2",
      }}
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#333333",
          "--normal-border": "#E5E5E5",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      offset={16}
      gap={8}
      {...props}
    />
  )
}

export { Toaster }
