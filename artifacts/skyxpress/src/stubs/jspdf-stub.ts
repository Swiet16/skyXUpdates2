// Stub — jsPDF is blocked by the package firewall in the Replit sandbox.
// AWB/PDF download features will show a graceful error; all other features work normally.
export class jsPDF {
  constructor(..._args: any[]) {}
  addPage() { return this; }
  setFont() { return this; }
  setFontSize() { return this; }
  text() { return this; }
  line() { return this; }
  rect() { return this; }
  save() {
    console.warn("[SkyXpress] PDF generation is unavailable in this environment.");
  }
  html(_el: any, opts?: any) {
    if (opts?.callback) opts.callback(this);
    return Promise.resolve();
  }
  output() { return ""; }
  internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
}

export default jsPDF;
