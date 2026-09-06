import QRCode from "qrcode";

// A student's QR always encodes their bare login code — a scan is simply
// "type this in faster." No URL wrapper: if opened by a generic camera app
// by accident, it's inert text, not a broken link. Isomorphic — this runs
// both server-side (student profile pages) and client-side (right after a
// successful registration, before any page navigation), since the `qrcode`
// package supports both environments.
export async function generateQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, { width: 256, margin: 2 });
}
