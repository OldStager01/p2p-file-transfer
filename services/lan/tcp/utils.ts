import { Buffer } from "buffer";

export const wrapChunk = (chunk: Buffer, index: number): Buffer => {
  const header = Buffer.from(JSON.stringify({ index }));
  return Buffer.concat([header, Buffer.from("\n"), chunk]);
};

export const unwrapChunk = (
  data: Buffer
): { index: number; payload: Buffer } => {
  const [header, ...rest] = data.toString().split("\n");
  const metadata = JSON.parse(header);
  const payload = Buffer.from(rest.join("\n"), "binary");
  return {
    index: metadata.index,
    payload,
  };
};
