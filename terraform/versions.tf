terraform {
  required_version = ">= 1.6.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.3"      # official provider :contentReference[oaicite:0]{index=0}
    }
    render = {
      source  = "render-oss/render"
      version = "~> 1.4"      # community provider :contentReference[oaicite:1]{index=1}
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.8"      # official Neon provider :contentReference[oaicite:2]{index=2}
    }
  }
}
