import { NextResponse } from "next/server";
import { ClientResponseError } from "pocketbase";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export function invalidPayloadResponse(message = "Invalid event payload") {
  return jsonError(message, 400);
}

export function internalServerError(message = "Internal Server Error") {
  return jsonError(message, 500);
}

export function notFoundResponse(message = "Event not found") {
  return jsonError(message, 404);
}

export function isPocketBaseNotFound(error: unknown) {
  return error instanceof ClientResponseError && error.status === 404;
}

export function isPocketBaseSlugConflict(error: unknown) {
  return (
    error instanceof ClientResponseError &&
    error.status === 400 &&
    typeof error.response?.data?.slug?.message === "string"
  );
}
