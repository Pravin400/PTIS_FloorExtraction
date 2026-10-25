"use server";

import crypto from "crypto";

export async function generateGisSsoUrl(userId: string, name: string, propertyOwnerId: string, propertyKey?: string) {
  // Use a server-side environment variable (without NEXT_PUBLIC_)
  const secretKey = process.env.GIS_SSO_SECRET || "ThaneGisHmacSsoKey@2026#Secure";
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${userId.trim()}${name.trim()}${timestamp}`;
  
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(data);
  const signatureHex = hmac.digest("hex");
  
  const baseUrl = (process.env.NEXT_PUBLIC_GIS_BASE_URL || "https://gisthane.tabamc.in/").replace(/\/$/, "");
  let url = `${baseUrl}/en/gis?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}&timestamp=${timestamp}&signature=${encodeURIComponent(signatureHex)}`;

  if (propertyKey) {
    url += `&propertyKey=${encodeURIComponent(propertyKey)}&mode=single`;
  } else if (propertyOwnerId) {
    url += `&ownerId=${encodeURIComponent(propertyOwnerId)}`;
  }

  return url;
}
