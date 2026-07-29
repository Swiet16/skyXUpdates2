// Stub — bwip-js (barcode generator) is unavailable in this environment.
export const toCanvas = (_canvas: any, _opts: any, cb?: Function) => {
  if (cb) cb(new Error("bwip-js unavailable"));
};
export const toBuffer = (_opts: any, cb?: Function) => {
  if (cb) cb(new Error("bwip-js unavailable"), null);
};
export default { toCanvas, toBuffer };
