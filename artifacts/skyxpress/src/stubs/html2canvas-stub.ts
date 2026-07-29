// Stub — html2canvas is blocked in the Replit sandbox.
const html2canvas = (_el: HTMLElement, _opts?: any): Promise<HTMLCanvasElement> =>
  Promise.resolve(document.createElement("canvas"));

export default html2canvas;
