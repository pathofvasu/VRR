import { fetchAdminBookings } from "./admin-api.js";
import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";
import {
  acceptBookingQuote,
  confirmBookingAgreement,
  downloadAgreementPdf,
  fetchUserBookings,
} from "./booking-api.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";
import { fetchOrganizerAssignments } from "./organizer-api.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
  bookings: [],
};

const nodes = {
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  dashboardLink: document.querySelector("[data-dashboard-link]"),
  signOutButton: document.querySelector("[data-sign-out]"),
  refreshButton: document.querySelector("[data-refresh-estimates]"),
  list: document.querySelector("[data-estimate-list]"),
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const labelize = (value) =>
  String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown user";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
  nodes.dashboardLink.href = getDashboardUrlForRole(state.user?.role);
};

const getQuotedBookings = () => state.bookings.filter((booking) => booking.quotation);

const renderEstimates = () => {
  const quotedBookings = getQuotedBookings();

  if (quotedBookings.length === 0) {
    nodes.list.innerHTML = `
      <p class="estimate-empty">
        No generated estimates are available yet. Once an admin generates a quotation, it will appear here.
      </p>
    `;
    return;
  }

  nodes.list.innerHTML = quotedBookings
    .map((booking) => {
      const quotation = booking.quotation;

      return `
        <article class="estimate-card">
          <div class="estimate-card-header">
            <div>
              <p class="estimates-kicker">${escapeHtml(booking.bookingCode)}</p>
              <h3>${escapeHtml(booking.eventTitle)}</h3>
              <span class="estimate-meta">${labelize(booking.eventType)} | ${formatDate(booking.eventDate)}</span>
            </div>
            <div class="estimate-total">
              <span class="estimate-meta">${labelize(quotation.packageTier)} package</span>
              <strong>${formatCurrency(quotation.total, quotation.currency)}</strong>
              <span class="estimate-meta">Valid until ${formatDate(quotation.validUntil)}</span>
            </div>
          </div>

          <div class="estimate-grid">
            <div class="estimate-box">
              <strong>Subtotal</strong>
              ${formatCurrency(quotation.subtotal, quotation.currency)}
            </div>
            <div class="estimate-box">
              <strong>Service Fee</strong>
              ${formatCurrency(quotation.serviceFee, quotation.currency)}
            </div>
            <div class="estimate-box">
              <strong>Tax</strong>
              ${formatCurrency(quotation.tax, quotation.currency)}
            </div>
            <div class="estimate-box">
              <strong>Discount</strong>
              ${formatCurrency(quotation.discount, quotation.currency)}
            </div>
          </div>

          <p class="proposal-note">${escapeHtml(quotation.proposalNotes)}</p>

          <div class="line-items">
            ${(quotation.lineItems || [])
              .map(
                (item) => `
                  <div class="line-item">
                    <div>
                      <strong>${escapeHtml(item.label)}</strong>
                      <span>${escapeHtml(item.description || "Estimate line item")}</span>
                    </div>
                    <span>${formatCurrency(item.total, quotation.currency)}</span>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="estimate-actions">
            ${
              booking.workflowState === "QUOTE_GENERATED"
                ? `<button class="primary-button" type="button" data-accept-quote="${escapeHtml(booking.id)}">Accept Quote</button>`
                : ""
            }
            ${
              booking.agreement
                ? `<button class="secondary-button" type="button" data-download-agreement="${escapeHtml(booking.id)}">Download Agreement PDF</button>`
                : ""
            }
            ${
              booking.workflowState === "AGREEMENT_GENERATED"
                ? `<button class="primary-button" type="button" data-confirm-agreement="${escapeHtml(booking.id)}">Confirm Agreement</button>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
};

const verifySession = async () => {
  if (!state.token) {
    window.location.href = "./login.html";
    return false;
  }

  try {
    const response = await fetchCurrentUser(state.token);
    state.user = response.data.user;
    saveAuthSession({ token: state.token, user: state.user });
    renderUser();
    return true;
  } catch (error) {
    clearAuthSession();
    setStatusBanner(error.message || "Your session could not be verified.");
    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
    return false;
  }
};

const loadBookings = async ({ showSuccess = false } = {}) => {
  try {
    nodes.list.innerHTML = '<p class="estimate-empty">Loading estimates...</p>';

    if (state.user.role === "admin") {
      const response = await fetchAdminBookings({
        token: state.token,
        filters: {
          limit: 100,
        },
      });
      state.bookings = response.data.bookings;
    } else if (state.user.role === "organizer") {
      const response = await fetchOrganizerAssignments(state.token);
      state.bookings = response.data.bookings;
    } else {
      const response = await fetchUserBookings(state.token);
      state.bookings = response.data.bookings;
    }

    renderEstimates();

    if (showSuccess) {
      setStatusBanner("Budget estimates refreshed.", "success");
    }
  } catch (error) {
    setStatusBanner(error.message || "Unable to load budget estimates.");
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });

  nodes.refreshButton.addEventListener("click", () => loadBookings({ showSuccess: true }));
  nodes.list.addEventListener("click", async (event) => {
    const acceptButton = event.target.closest("[data-accept-quote]");
    const confirmButton = event.target.closest("[data-confirm-agreement]");
    const downloadButton = event.target.closest("[data-download-agreement]");
    const bookingId =
      acceptButton?.dataset.acceptQuote ||
      confirmButton?.dataset.confirmAgreement ||
      downloadButton?.dataset.downloadAgreement;

    if (!bookingId) {
      return;
    }

    const clickedButton = acceptButton || confirmButton || downloadButton;
    clickedButton.disabled = true;

    try {
      if (acceptButton) {
        await acceptBookingQuote({
          token: state.token,
          bookingId,
        });
        setStatusBanner("Quotation accepted. An admin can now generate the agreement PDF.", "success");
      }

      if (confirmButton) {
        await confirmBookingAgreement({
          token: state.token,
          bookingId,
        });
        setStatusBanner("Agreement confirmed. The event is now scheduled.", "success");
      }

      if (downloadButton) {
        const agreementBlob = await downloadAgreementPdf({
          token: state.token,
          bookingId,
        });
        const downloadUrl = URL.createObjectURL(agreementBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = downloadUrl;
        downloadLink.download = "vrr-events-agreement.pdf";
        downloadLink.click();
        URL.revokeObjectURL(downloadUrl);
        setStatusBanner("Agreement PDF download started.", "success");
      }

      await loadBookings();
    } catch (error) {
      setStatusBanner(error.message || "Unable to update agreement workflow.");
    } finally {
      clickedButton.disabled = false;
    }
  });
};

const init = async () => {
  renderUser();
  attachEvents();

  const isVerified = await verifySession();

  if (!isVerified) {
    return;
  }

  await loadBookings();
};

init();
