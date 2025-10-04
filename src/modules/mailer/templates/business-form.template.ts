export function businessApprovedTemplate(storeName: string) {
  return `
    <h2>Business Approved</h2>
    <p>Your business <b>${storeName}</b> has been approved!</p>
    <p>You can now access all features for your business account.</p>
  `;
}

export function businessRejectedTemplate(storeName: string, note: string) {
  return `
    <h2>Business Rejected</h2>
    <p>Your business <b>${storeName}</b> was rejected.</p>
    <p>Reason: <b>${note}</b></p>
    <p>If you have questions, please contact support.</p>
  `;
}
