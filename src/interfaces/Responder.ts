export interface Responder {
    sendOperationSuccess(): void;
    sendOperationError(error?: string, status?: number): void;
    sendOperationErrorJSON(error?: { error: string }, status?: number): void;
    sendObject(object: any): void;
}