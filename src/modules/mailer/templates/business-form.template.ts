export function businessApprovedTemplate(
  storeName: string,
  email: string,
  password: string,
  trialStart: Date,
  trialEnd: Date,
) {
  return `
    <h2>Business Approved</h2>
    <p>Your business <b>${storeName}</b> has been approved!</p>
    <p>You can now access all features for your business account.</p>
    <hr />
    <p><b>Account Information:</b></p>
    <ul>
      <li>Email: <b>${email}</b></li>
      <li>Password: <b>${password}</b></li>
      <li>Trial Start: <b>${trialStart.toLocaleString()}</b></li>
      <li>Trial End: <b>${trialEnd.toLocaleString()}</b></li>
    </ul>
    <p>Please change your password after first login.</p>
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
