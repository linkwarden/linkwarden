export default function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO === "true";
}
