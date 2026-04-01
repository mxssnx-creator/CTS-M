"use client"

import { Rocket } from "lucide-react"

interface DeployButtonProps {
  label?: string
  href?: string
  className?: string
}

export function DeployButton({ label = "Deploy", href, className = "" }: DeployButtonProps) {
  const handleClick = () => {
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`deploy-btn ${className}`}
    >
      <Rocket className="size-4" />
      {label}
    </button>
  )
}
