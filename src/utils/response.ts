export function jsonResponse({
  status,
  message,
  data = null,
}: {
  status: "success" | "error" | "not_found" | "fail" | "unauthorized";
  message: string;
  data?: any;
}) {
  return { status, message, data };
}
