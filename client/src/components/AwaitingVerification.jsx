export default function AwaitingVerification({ status, name, onRefresh, onLogout }) {
  const rejected = status === "rejected";

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow text-center p-5" style={{ width: "520px" }}>
        {rejected ? (
          <>
            <div className="display-6 mb-2">&#128683;</div>
            <h4 className="mb-3">Application Rejected</h4>
            <p className="text-muted mb-4">
              Hi {name}, your doctor application was not approved at this time.
              You can review your details and apply again.
            </p>
          </>
        ) : (
          <>
            <div className="display-6 mb-2">&#128337;</div>
            <h4 className="mb-3">Awaiting Verification</h4>
            <p className="text-muted mb-4">
              Hi {name}, thanks for registering as a doctor. An admin is
              reviewing your credentials. You will be able to access the doctor
              dashboard once your application is approved.
            </p>
            <div
              className="alert alert-info d-flex align-items-center justify-content-center gap-2"
              role="status"
            >
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
              <span>Application status: {status}</span>
            </div>
          </>
        )}

        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary" onClick={onRefresh}>
            Check status
          </button>
          <button className="btn btn-primary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}