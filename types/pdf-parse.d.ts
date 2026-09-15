declare module "pdf-parse" {
  type Result = { text: string; numpages: number; info: Record<string, unknown>; metadata?: Record<string, unknown> };
  export default function pdf(dataBuffer: Buffer): Promise<Result>;
}