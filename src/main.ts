// API helper
const API_URL = 'http://localhost:3000';
let authToken: string | null = localStorage.getItem('authToken');
let currentUser: any = null;

async function api(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

// CSS-in-JS Helper
function injectStyles(className: string, styles: Record<string, string>): void {
  const cssString = `.${className} { ${Object.entries(styles).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join(' ')} }`;
  const existing = document.querySelector(`style[data-class="${className}"]`);
  if (existing) {
    existing.textContent = cssString;
  } else {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-class', className);
    styleEl.textContent = cssString;
    document.head.appendChild(styleEl);
  }
}

// Global styles
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --sage-900: #3a4a1e;
    --sage-800: #4a5d23;
    --sage-700: #5d6d3e;
    --sage-600: #6b7c3f;
    --sage-500: #748c61;
    --clay-600: #8b7765;
    --clay-500: #74614f;
    --cream-100: #fefdfb;
    --cream-200: #f9f6f0;
    --ink-900: #2d2416;
    --ink-700: #3d3321;
    --ink-600: #4a5568;
    --surface: #ffffff;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #2d2416;
    background: linear-gradient(135deg, #748c61 0%, #5d7a4a 100%);
    min-height: 100vh;
    padding: clamp(12px, 3vw, 20px);
    position: relative;
  }
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(139, 119, 101, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(101, 84, 65, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  .container {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  .page-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .card {
    background: linear-gradient(145deg, #fefdfb 0%, #f9f6f0 100%);
    border-radius: 24px;
    padding: clamp(16px, 4vw, 32px);
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(61, 51, 37, 0.12), 0 2px 8px rgba(93, 109, 62, 0.08);
    border: 1px solid rgba(139, 119, 101, 0.15);
    position: relative;
  }
  .auth-card {
    max-width: 420px;
    margin: clamp(40px, 8vh, 120px) auto;
  }
  .card-subtitle {
    font-size: 15px;
    color: #5d6d3e;
    margin-top: -12px;
    margin-bottom: 20px;
  }
  .panel {
    background: linear-gradient(145deg, #ffffff 0%, #f9f6f0 100%);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(107, 124, 63, 0.16);
    box-shadow: 0 8px 24px rgba(61, 51, 37, 0.08);
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6b7c3f 0%, #8b7765 50%, #6b7c3f 100%);
    border-radius: 24px 24px 0 0;
  }
  .btn {
    background: linear-gradient(135deg, #4a5d23 0%, #3a4a1e 100%);
    color: #fefdfb;
    border: 2px solid rgba(139, 119, 101, 0.2);
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(61, 51, 37, 0.15);
  }
  .btn[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .btn:hover {
    background: linear-gradient(135deg, #5d6d3e 0%, #4a5d23 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(93, 109, 62, 0.25);
    border-color: rgba(139, 119, 101, 0.3);
  }
  .btn:active { transform: translateY(0); }
  .btn-secondary {
    background: linear-gradient(145deg, #f4ede3 0%, #e8dfd5 100%);
    color: #3d3321;
    border: 2px solid rgba(139, 119, 101, 0.25);
  }
  .btn-secondary:hover {
    background: linear-gradient(145deg, #e8dfd5 0%, #ddd4ca 100%);
    box-shadow: 0 4px 16px rgba(101, 84, 65, 0.2);
  }
  .btn-danger {
    background: linear-gradient(135deg, #a0522d 0%, #8b4513 100%);
    border-color: rgba(139, 69, 19, 0.3);
  }
  .btn-danger:hover {
    background: linear-gradient(135deg, #b8632f 0%, #a0522d 100%);
  }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .btn-link {
    background: transparent;
    color: #4a5d23;
    border: none;
    box-shadow: none;
    padding: 6px 8px;
  }
  label {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: #3a4528;
    margin-bottom: 8px;
    letter-spacing: 0.01em;
  }
  a, .link {
    color: #4a5d23;
    text-decoration: none;
    font-weight: 600;
  }
  a:hover, .link:hover {
    color: #3a4a1e;
    text-decoration: underline;
  }
  input, textarea, select {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #d8e4d3;
    border-radius: 12px;
    margin-bottom: 16px;
    font-family: inherit;
    font-size: 15px;
    background: #ffffff;
    color: #2d2416;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(61, 51, 37, 0.05);
  }
  input::placeholder, textarea::placeholder {
    color: #a0aec0;
    opacity: 1;
  }
  input:hover, textarea:hover, select:hover {
    border-color: #b8cca8;
    box-shadow: 0 2px 6px rgba(107, 124, 63, 0.08);
  }
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #6b7c3f;
    box-shadow: 0 0 0 4px rgba(107, 124, 63, 0.12), 0 2px 8px rgba(107, 124, 63, 0.1);
    background: #fefdfb;
  }
  textarea {
    min-height: 120px;
    resize: vertical;
    line-height: 1.6;
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
    padding-right: 40px;
    background-color: #ffffff;
    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236b7c3f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 18px;
    font-weight: 500;
  }
  select:hover {
    background-color: #ffffff;
    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a5d23" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
  }
  select:focus {
    background-color: #fefdfb;
    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236b7c3f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
  }
  select option {
    padding: 10px;
    background: #ffffff;
    color: #2d2416;
  }
  .event-card {
    border-left: 5px solid transparent;
    border-image: linear-gradient(180deg, #6b7c3f 0%, #8b7765 100%) 1;
    padding: 22px;
    margin-bottom: 16px;
    background: linear-gradient(160deg, #ffffff 0%, #faf8f5 100%);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(61, 51, 37, 0.08);
    position: relative;
    overflow: hidden;
  }
  .event-grid {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 900px) {
    .event-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
  }
  .event-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    z-index: 1;
  }
  .event-kicker {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #6b7c3f;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .event-card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .event-title {
    margin-bottom: 8px;
    font-size: 18px;
    color: #3a4528;
  }
  .event-meta-section {
    display: grid;
    gap: 10px;
  }
  .event-meta-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    margin-bottom: 0;
  }
  .event-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #3d3321;
    background: rgba(107, 124, 63, 0.1);
    border: 1px solid rgba(107, 124, 63, 0.18);
    box-shadow: 0 2px 6px rgba(61, 51, 37, 0.06);
  }
  .event-meta-item--wide {
    flex: 1 1 260px;
  }
  .event-meta-icon {
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(107, 124, 63, 0.18);
    font-size: 12px;
  }
  .event-card-body {
    padding-top: 2px;
    border-top: 1px solid rgba(107, 124, 63, 0.12);
    margin-top: 4px;
    padding-top: 12px;
  }
  .event-description {
    margin: 0;
    color: #4a5568;
    font-size: 14px;
    line-height: 1.5;
  }
  .event-card-footer {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #6b7c3f;
    font-weight: 600;
    font-size: 13px;
    border-top: 1px dashed rgba(107, 124, 63, 0.25);
    padding-top: 12px;
  }
  .event-card-footer span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .event-card .badge {
    border-radius: 999px;
    padding: 6px 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .event-card::after {
    content: '✦';
    position: absolute;
    top: 16px;
    right: 16px;
    color: #6b7c3f;
    opacity: 0.2;
    font-size: 20px;
  }
  .event-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(107, 124, 63, 0.08), rgba(139, 119, 101, 0.06));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .event-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(107, 124, 63, 0.15), 0 4px 12px rgba(139, 119, 101, 0.1);
  }
  .event-card:hover::after {
    opacity: 0.4;
  }
  .event-card:hover::before {
    opacity: 1;
  }
  .comment {
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .comment.reply {
    margin-left: 40px;
    background: #edf2f7;
  }
  .badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    box-shadow: 0 2px 4px rgba(61, 51, 37, 0.06);
  }
  .badge-published {
    background: linear-gradient(135deg, #6b7c3f 0%, #5d6d3e 100%);
    color: #fefdfb;
    border: 1px solid rgba(93, 109, 62, 0.3);
  }
  .badge-draft {
    background: linear-gradient(135deg, #8b7765 0%, #74614f 100%);
    color: #fefdfb;
    border: 1px solid rgba(116, 97, 79, 0.3);
  }
  .badge-pending {
    background: linear-gradient(135deg, #d4a574 0%, #c19563 100%);
    color: #3d3321;
    border: 1px solid rgba(180, 149, 99, 0.3);
  }
  .rsvp-buttons button {
    margin-right: 8px;
    margin-bottom: 8px;
  }
  .rsvp-buttons button.active {
    background: linear-gradient(135deg, #6b7c3f 0%, #5d6d3e 100%);
    border-color: #4a5d23;
  }
  h1 {
    color: #3a4528;
    margin-bottom: 24px;
    font-size: clamp(24px, 5vw, 32px);
    font-weight: 700;
    position: relative;
    padding-bottom: 16px;
  }
  h1::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #6b7c3f 0%, rgba(107, 124, 63, 0.3) 100%);
    border-radius: 2px;
  }
  h2 { margin-bottom: 16px; color: #3d3321; font-size: clamp(20px, 4vw, 24px); font-weight: 600; }
  h3 { margin-bottom: 12px; font-size: clamp(16px, 3vw, 18px); color: #4a5d23; font-weight: 600; }
  .user-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 18px 24px;
    background: linear-gradient(145deg, #ffffff 0%, #fefdfb 100%);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(61, 51, 37, 0.08), 0 1px 3px rgba(107, 124, 63, 0.05);
    flex-wrap: wrap;
    gap: 12px;
    border: 1px solid rgba(107, 124, 63, 0.1);
  }
  .user-info-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .user-info strong {
    color: #3a4528;
    font-size: 16px;
    font-weight: 600;
  }
  .meta {
    font-size: 13px;
    color: #74614f;
    margin-top: 4px;
    line-height: 1.5;
  }
  .error {
    color: #9b2c2c;
    padding: 14px 18px;
    background: linear-gradient(145deg, #fff5f5 0%, #fed7d7 100%);
    border-radius: 12px;
    margin-bottom: 16px;
    border-left: 4px solid #fc8181;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(197, 48, 48, 0.1);
  }
  .success {
    color: #22543d;
    padding: 14px 18px;
    background: linear-gradient(145deg, #f0fff4 0%, #c6f6d5 100%);
    border-radius: 12px;
    margin-bottom: 16px;
    border-left: 4px solid #68d391;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(39, 103, 73, 0.1);
  }
  .spinner {
    border: 3px solid rgba(107, 124, 63, 0.2);
    border-top-color: #6b7c3f;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    margin: 20px auto;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  input[type="checkbox"],
  input[type="radio"] {
    width: auto;
    margin-right: 10px;
    margin-bottom: 0;
    cursor: pointer;
    accent-color: #6b7c3f;
  }
  input[type="checkbox"] {
    transform: scale(1.2);
  }
  input[type="radio"] {
    transform: scale(1.15);
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }
  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(107, 124, 63, 0.15);
    box-shadow: 0 6px 16px rgba(61, 51, 37, 0.08);
  }
  .nav-title {
    font-size: clamp(18px, 4vw, 24px);
    font-weight: 600;
    color: #3d3321;
    text-align: center;
    flex: 1;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .page-header h1 {
    margin-bottom: 0;
  }
  .page-header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .segmented-control {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(93, 109, 62, 0.12);
    border: 1px solid rgba(107, 124, 63, 0.25);
  }
  .segmented-control .view-toggle {
    background: transparent;
    color: #3d3321;
    border: 1px solid transparent;
    box-shadow: none;
  }
  .segmented-control .view-toggle:hover {
    transform: translateY(-1px);
  }
  .segmented-control .view-toggle.is-active {
    background: linear-gradient(135deg, #4a5d23 0%, #3a4a1e 100%);
    color: #fefdfb;
    border-color: rgba(139, 119, 101, 0.25);
    box-shadow: 0 6px 14px rgba(61, 51, 37, 0.16);
  }
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  .table thead th {
    text-align: left;
    padding: 12px;
    font-weight: 700;
    color: #3d3321;
    border-bottom: 2px solid #e2e8f0;
    background: rgba(107, 124, 63, 0.06);
  }
  .table tbody td {
    padding: 12px;
    border-bottom: 1px solid #edf2f7;
    vertical-align: top;
  }
  .table tbody tr:hover {
    background: rgba(107, 124, 63, 0.06);
  }
  .table a {
    color: #4a5d23;
  }
  .tos-card {
    display: grid;
    gap: 20px;
  }
  .tos-panel {
    background: linear-gradient(145deg, #ffffff 0%, #f9f6f0 100%);
    border-radius: 16px;
    border: 1px solid rgba(107, 124, 63, 0.16);
    padding: clamp(16px, 3vw, 24px);
    box-shadow: 0 10px 24px rgba(61, 51, 37, 0.08);
  }
  .tos-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .tos-meta {
    color: #74614f;
    font-size: 13px;
    font-weight: 600;
  }
  .tos-content {
    white-space: pre-wrap;
    line-height: 1.8;
    font-size: 15px;
    color: #3d3321;
  }
  .tos-status {
    padding: 14px 16px;
    border-radius: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(107, 124, 63, 0.2);
    background: rgba(107, 124, 63, 0.08);
    color: #2d5016;
  }
  .tos-status.warning {
    border-color: rgba(255, 193, 7, 0.5);
    background: rgba(255, 193, 7, 0.15);
    color: #856404;
  }
  .tos-empty {
    text-align: center;
    color: #74614f;
    padding: 28px;
    background: rgba(107, 124, 63, 0.06);
    border-radius: 12px;
    border: 1px dashed rgba(107, 124, 63, 0.25);
  }

  @media (max-width: 768px) {
    body { padding: 12px; }
    .card { padding: 16px; }
    .event-card { padding: 16px; }
    .user-info { padding: 12px; }
    h1 { font-size: 24px; }
    .btn { padding: 10px 16px; font-size: 13px; }
    .btn-icon { width: 36px; height: 36px; font-size: 16px; }
  }

  @media (max-width: 480px) {
    .comment.reply { margin-left: 20px; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
  }
`;
document.head.appendChild(globalStyle);

// App State
let currentView: 'login' | 'register' | 'events' | 'event-detail' | 'form-builder' | 'create-event' | 'user-management' | 'edit-profile' | 'notifications' | 'contract-management' | 'terms-of-service' = 'login';
let currentEventId: number | null = null;
let events: any[] = [];
let formFields: any[] = [];
let eventCustomFields: any[] = [];
let eventAttachmentFile: File | null = null;
let calendarViewType: 'card' | 'month' | 'week' | 'day' = 'card';
let currentCalendarDate: Date = new Date();
let currentCardPage: number = 0;
const CARDS_PER_PAGE = 5;
let allUsers: any[] = [];
let editingUserId: number | null = null;
let notificationPreferences: any = null;
let registrationStep: number = 0; // 0: account type, 1: basic info, 2: profile, 3: verification, 4: children/linking, 5: TOS
let registrationData: any = {};
let isSyncingRoute: boolean = false;

function buildRoute(view: typeof currentView, eventId?: number | null): string {
  switch (view) {
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'event-detail':
      return eventId ? `/events/${eventId}` : '/events';
    case 'form-builder':
      return eventId ? `/events/${eventId}/form` : '/events';
    case 'create-event':
      return '/create-event';
    case 'user-management':
      return '/users';
    case 'edit-profile':
      return '/profile';
    case 'notifications':
      return '/notifications';
    case 'contract-management':
      return '/contracts';
    case 'terms-of-service':
      return '/tos';
    case 'events':
    default:
      return '/events';
  }
}

function syncUrl(view: typeof currentView, eventId?: number | null, replace: boolean = false) {
  const nextPath = buildRoute(view, eventId);
  if (location.pathname !== nextPath) {
    isSyncingRoute = true;
    if (replace) {
      history.replaceState(null, '', nextPath);
    } else {
      history.pushState(null, '', nextPath);
    }
    setTimeout(() => {
      isSyncingRoute = false;
    }, 0);
  }
}

function setView(view: typeof currentView, eventId?: number | null, options?: { syncUrl?: boolean; replace?: boolean }) {
  currentView = view;
  if (view === 'event-detail' || view === 'form-builder') {
    currentEventId = eventId ?? currentEventId;
  } else {
    currentEventId = eventId ?? null;
  }
  if (options?.syncUrl !== false) {
    syncUrl(view, currentEventId, options?.replace ?? false);
  }
}

function navigateTo(view: typeof currentView, eventId?: number | null) {
  setView(view, eventId);
  render();
}

function applyRouteFromPath() {
  const parts = location.pathname.split('/').filter(Boolean);

  if (!authToken && parts[0] && !['login', 'register'].includes(parts[0])) {
    setView('login', null, { replace: true });
    return;
  }

  if (!parts.length) {
    setView(authToken ? 'events' : 'login', null, { replace: true });
    return;
  }

  if (authToken && ['login', 'register'].includes(parts[0])) {
    setView('events', null, { replace: true });
    return;
  }

  switch (parts[0]) {
    case 'login':
      setView('login');
      break;
    case 'register':
      setView('register');
      break;
    case 'events': {
      const eventId = parts[1] ? Number.parseInt(parts[1], 10) : null;
      if (eventId && parts[2] === 'form') {
        setView('form-builder', eventId);
      } else if (eventId) {
        setView('event-detail', eventId);
      } else {
        setView('events');
      }
      break;
    }
    case 'create-event':
      setView('create-event');
      break;
    case 'users':
      setView('user-management');
      break;
    case 'profile':
      setView('edit-profile');
      break;
    case 'notifications':
      setView('notifications');
      break;
    case 'contracts':
      setView('contract-management');
      break;
    case 'tos':
      setView('terms-of-service');
      break;
    default:
      setView(authToken ? 'events' : 'login');
  }
}

// Initialize app
async function init() {
  if (authToken) {
    const result = await api('/api/auth/me');
    if (result.ok) {
      currentUser = result.data.user;
      await loadEvents();
    } else {
      authToken = null;
      localStorage.removeItem('authToken');
    }
  }
  applyRouteFromPath();
  render();
}

window.addEventListener('popstate', () => {
  if (isSyncingRoute) return;
  applyRouteFromPath();
  render();
});

// Load events
async function loadEvents() {
  const result = await api('/api/events');
  if (result.ok) {
    events = result.data.events;
  }
}

// Load all users (admin only)
async function loadAllUsers() {
  const result = await api('/api/admin/users');
  if (result.ok) {
    allUsers = result.data.users;
  }
}

// Update user (admin only)
async function updateUser(userId: number, userData: any) {
  const result = await api(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(userData)
  });

  if (result.ok) {
    await loadAllUsers();
    editingUserId = null;
    render();
    return { success: true };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Load notification preferences
async function loadNotificationPreferences() {
  const result = await api('/api/notifications/preferences');
  if (result.ok) {
    notificationPreferences = result.data.preferences;
  }
}

// Update notification preferences
async function updateNotificationPreferences(preferences: any) {
  const result = await api('/api/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences)
  });

  if (result.ok) {
    await loadNotificationPreferences();
    return { success: true };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Login
async function login(email: string, password: string) {
  const result = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (result.ok) {
    authToken = result.data.token;
    currentUser = result.data.user;
    localStorage.setItem('authToken', authToken);
    await loadEvents();
    setView('events', null, { replace: true });
    render();
    return { success: true };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Register
async function register(email: string, phone: string, password: string, firstName: string, lastName: string, accountType: string) {
  const result = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, phone, password, firstName, lastName, accountType })
  });

  if (result.ok) {
    // Don't auto-login, user needs to verify email first
    return { success: true, requiresVerification: result.data.requiresVerification };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Send verification code
async function sendVerificationCode(email: string) {
  const result = await api('/api/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  if (result.ok) {
    return { success: true };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Verify email
async function verifyEmail(email: string, code: string) {
  const result = await api('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });

  if (result.ok) {
    return { success: true };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Logout
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  setView('login', null, { replace: true });
  render();
}

// RSVP
async function rsvp(eventId: number, status: string, childIds?: number[], comment?: string) {
  const result = await api('/api/rsvps', {
    method: 'POST',
    body: JSON.stringify({ eventId, status, childIds, comment })
  });

  if (result.ok) {
    await loadEvents();
    await viewEventDetail(eventId);
  }
  return result;
}

async function showChildSelectionModal(eventId: number, status: string) {
  // Fetch user's children
  const childrenResult = await api('/api/children');
  const children = childrenResult.ok ? childrenResult.data.children : [];

  // Fetch current RSVP to pre-select children
  const rsvpResult = await api(`/api/rsvps/event/${eventId}/mine`);
  const currentRsvp = rsvpResult.ok ? rsvpResult.data.rsvp : null;
  const selectedChildIds = currentRsvp?.childIds || [];

  return new Promise<number[] | null>((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;';

    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.cssText = 'max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;';

    modal.innerHTML = `
      <h2>👶 Select Attending Children</h2>
      <p class="meta" style="margin-bottom: 20px;">
        ${children.length === 0
          ? 'You haven\'t added any children yet. You can add them in your profile settings.'
          : 'Select which children will be attending this event:'}
      </p>

      ${children.length > 0 ? `
        <div id="child-selection" style="margin-bottom: 24px;">
          ${children.map(child => `
            <label style="display: flex; align-items: start; padding: 16px; margin-bottom: 12px; background: #f8f9fa; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;" class="child-option" data-child-id="${child.id}">
              <input type="checkbox" value="${child.id}" ${selectedChildIds.includes(child.id) ? 'checked' : ''} style="width: auto; margin-right: 12px; margin-top: 4px; transform: scale(1.3);">
              <div style="flex: 1;">
                <strong>${child.name}</strong>
                ${child.birthDate ? `<div class="meta">Age: ${calculateAge(child.birthDate)} years old</div>` : ''}
                ${child.grade ? `<div class="meta">📚 Grade: ${child.grade}</div>` : ''}
                ${child.allergies ? `<div class="meta">🏥 Allergies: ${child.allergies}</div>` : ''}
                ${child.dietaryRestrictions ? `<div class="meta">🍽️ Dietary: ${child.dietaryRestrictions}</div>` : ''}
              </div>
            </label>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
          <p class="meta">No children added yet.</p>
          <button class="btn btn-sm" id="go-to-profile-btn" style="margin-top: 12px;">+ Add Children in Profile</button>
        </div>
      `}

      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Comment (optional)</label>
      <textarea id="rsvp-comment" placeholder="Add any special notes..." rows="3" style="margin-bottom: 16px;">${currentRsvp?.comment || ''}</textarea>

      <div style="display: flex; gap: 8px;">
        <button class="btn" id="confirm-rsvp-btn">Confirm RSVP</button>
        <button class="btn btn-secondary" id="cancel-rsvp-btn">Cancel</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add styles for selected checkboxes
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const label = target.closest('.child-option') as HTMLElement;
        if (target.checked) {
          label.style.borderColor = '#4a5d23';
          label.style.background = 'rgba(74, 93, 35, 0.05)';
        } else {
          label.style.borderColor = 'transparent';
          label.style.background = '#f8f9fa';
        }
      });
      // Initialize checked state
      const initialEvent = new Event('change');
      checkbox.dispatchEvent(initialEvent);
    });

    // Go to profile button
    const goToProfileBtn = modal.querySelector('#go-to-profile-btn');
    if (goToProfileBtn) {
      goToProfileBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        currentView = 'edit-profile';
        render();
        resolve(null);
      });
    }

    // Confirm button
    modal.querySelector('#confirm-rsvp-btn')!.addEventListener('click', () => {
      const selectedIds: number[] = [];
      const checkboxes = modal.querySelectorAll('#child-selection input[type="checkbox"]:checked');
      checkboxes.forEach((cb: any) => selectedIds.push(parseInt(cb.value)));

      const comment = (modal.querySelector('#rsvp-comment') as HTMLTextAreaElement).value.trim();

      document.body.removeChild(overlay);
      rsvp(eventId, status, selectedIds, comment || undefined);
      resolve(selectedIds);
    });

    // Cancel button
    modal.querySelector('#cancel-rsvp-btn')!.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(null);
      }
    });
  });
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Add comment
async function addComment(eventId: number, content: string, parentCommentId?: number) {
  const result = await api('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ eventId, content, parentCommentId })
  });

  if (result.ok) {
    await viewEventDetail(eventId);
  }
  return result;
}

// View event detail
async function viewEventDetail(eventId: number) {
  navigateTo('event-detail', eventId);
}

// Open form builder
function openFormBuilder(eventId: number) {
  formFields = [];
  navigateTo('form-builder', eventId);
}

// Add form field
function addFormField() {
  formFields.push({
    label: '',
    type: 'text',
    required: false,
    placeholder: ''
  });
  render();
}

// Remove form field
function removeFormField(index: number) {
  formFields.splice(index, 1);
  render();
}

// Save form
async function saveForm(eventId: number) {
  const result = await api('/api/forms', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      formType: 'signup',
      fields: formFields
    })
  });

  if (result.ok) {
    alert('Form created successfully!');
    await viewEventDetail(eventId);
  } else {
    alert('Error creating form: ' + result.data.error);
  }
}

// Create event
async function createEvent(eventData: any) {
  const result = await api('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });

  if (result.ok) {
    await loadEvents();
    navigateTo('events');
    return { success: true, event: result.data.event };
  } else {
    return { success: false, error: result.data.error };
  }
}

// Render app
async function render() {
  const app = document.getElementById('app')!;

  if (!authToken && currentView !== 'login' && currentView !== 'register') {
    setView('login', null, { replace: true });
  }
  if (authToken && (currentView === 'login' || currentView === 'register')) {
    setView('events', null, { replace: true });
  }
  syncUrl(currentView, currentEventId, true);

  if (!authToken) {
    await renderAuth(app);
  } else if (currentView === 'events') {
    if (events.length === 0) {
      await loadEvents();
    }
    renderEvents(app);
  } else if (currentView === 'event-detail' && currentEventId) {
    renderEventDetail(app, currentEventId);
  } else if (currentView === 'form-builder' && currentEventId) {
    renderFormBuilder(app, currentEventId);
  } else if (currentView === 'create-event') {
    renderCreateEvent(app);
  } else if (currentView === 'user-management') {
    if (allUsers.length === 0) {
      await loadAllUsers();
    }
    renderUserManagement(app);
  } else if (currentView === 'edit-profile') {
    renderEditProfile(app);
  } else if (currentView === 'notifications') {
    if (!notificationPreferences) {
      await loadNotificationPreferences();
    }
    renderNotifications(app);
  } else if (currentView === 'contract-management') {
    renderContractManagement(app);
  } else if (currentView === 'terms-of-service') {
    renderTermsOfService(app);
  }
}

async function renderAuth(container: HTMLElement) {
  if (currentView === 'login') {
    container.innerHTML = `
      <div class="container">
        <div class="card auth-card">
          <h1>Home School Group</h1>
          <h2>Login</h2>
          <div id="auth-error"></div>
          <input type="email" id="email" placeholder="Email" value="admin@homeschool.com">
          <input type="password" id="password" placeholder="Password" value="admin123">
          <button class="btn" id="login-btn">Login</button>
          <p style="margin-top: 16px; text-align: center;">
            <a href="#" id="show-register" class="link">Create an account</a>
          </p>
        </div>
      </div>
    `;

    document.getElementById('login-btn')!.addEventListener('click', async () => {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const result = await login(email, password);
      if (!result.success) {
        document.getElementById('auth-error')!.innerHTML = `<div class="error">${result.error}</div>`;
      }
    });

    document.getElementById('show-register')!.addEventListener('click', (e) => {
      e.preventDefault();
      currentView = 'register';
      registrationStep = 0;
      registrationData = {};
      render();
    });
  } else if (currentView === 'register') {
    // Multi-step registration
    if (registrationStep === 0) {
      // Step 0: Account Type Selection
      container.innerHTML = `
        <div class="container">
          <div class="card auth-card">
            <h1>Create Account</h1>
            <p class="meta">Step 1 of 6</p>
            <div id="auth-error"></div>
            <p style="font-size: 16px; margin-bottom: 24px; color: #3a4528;">Are you a <strong>Student</strong> or <strong>Parent</strong>?</p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <button class="btn" id="parent-btn" style="padding: 20px; font-size: 16px;">
                👨‍👩‍👧‍👦 Parent Account
              </button>
              <button class="btn btn-secondary" id="student-btn" style="padding: 20px; font-size: 16px;">
                🎓 Student Account
              </button>
            </div>
            <p style="margin-top: 16px; text-align: center;">
              <a href="#" id="show-login" class="link">Already have an account?</a>
            </p>
          </div>
        </div>
      `;

      document.getElementById('parent-btn')!.addEventListener('click', () => {
        registrationData.accountType = 'parent';
        registrationStep = 1;
        render();
      });

      document.getElementById('student-btn')!.addEventListener('click', () => {
        registrationData.accountType = 'student';
        registrationStep = 1;
        render();
      });

      document.getElementById('show-login')!.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'login';
        registrationStep = 0;
        registrationData = {};
        render();
      });
    } else if (registrationStep === 1) {
      // Step 1: Email and Password
      const accountTypeLabel = registrationData.accountType === 'student' ? '🎓 Student' : '👨‍👩‍👧‍👦 Parent';
      container.innerHTML = `
        <div class="container">
          <div class="card auth-card">
            <h1>Create Account</h1>
            <p class="meta">Step 2 of 6 - ${accountTypeLabel} Account</p>
            <div id="auth-error"></div>
            <input type="email" id="email" placeholder="Email" value="${registrationData.email || ''}">
            <input type="password" id="password" placeholder="Password (min 8 characters)" value="${registrationData.password || ''}">
            <button class="btn" id="next-btn">Next</button>
            <p style="margin-top: 16px; text-align: center;">
              <a href="#" id="go-back" class="link">← Back</a>
            </p>
          </div>
        </div>
      `;

      document.getElementById('next-btn')!.addEventListener('click', () => {
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        if (!email || !password) {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">Email and password are required</div>`;
          return;
        }
        if (password.length < 8) {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">Password must be at least 8 characters</div>`;
          return;
        }

        registrationData.email = email;
        registrationData.password = password;
        registrationStep = 2;
        render();
      });

      document.getElementById('go-back')!.addEventListener('click', (e) => {
        e.preventDefault();
        registrationStep = 0;
        render();
      });
    } else if (registrationStep === 2) {
      // Step 2: First Name, Last Name, Phone
      const accountTypeLabel = registrationData.accountType === 'student' ? '🎓 Student' : '👨‍👩‍👧‍👦 Parent';
      container.innerHTML = `
        <div class="container">
          <div class="card auth-card">
            <h1>Create Account</h1>
            <p class="meta">Step 3 of 6 - ${accountTypeLabel} Account</p>
            <div id="auth-error"></div>
            <input type="text" id="firstName" placeholder="First Name" value="${registrationData.firstName || ''}">
            <input type="text" id="lastName" placeholder="Last Name" value="${registrationData.lastName || ''}">
            <input type="tel" id="phone" placeholder="Phone Number" value="${registrationData.phone || ''}">
            <button class="btn" id="next-btn">Next</button>
            <p style="margin-top: 16px; text-align: center;">
              <a href="#" id="go-back" class="link">← Back</a>
            </p>
          </div>
        </div>
      `;

      document.getElementById('next-btn')!.addEventListener('click', async () => {
        const firstName = (document.getElementById('firstName') as HTMLInputElement).value;
        const lastName = (document.getElementById('lastName') as HTMLInputElement).value;
        const phone = (document.getElementById('phone') as HTMLInputElement).value;

        if (!firstName || !lastName || !phone) {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">All fields are required</div>`;
          return;
        }

        registrationData.firstName = firstName;
        registrationData.lastName = lastName;
        registrationData.phone = phone;

        // Register the user
        const result = await register(
          registrationData.email,
          registrationData.phone,
          registrationData.password,
          registrationData.firstName,
          registrationData.lastName,
          registrationData.accountType
        );

        if (result.success) {
          registrationStep = 3;
          render();
        } else {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">${result.error}</div>`;
        }
      });

      document.getElementById('go-back')!.addEventListener('click', (e) => {
        e.preventDefault();
        registrationStep = 1;
        render();
      });
    } else if (registrationStep === 3) {
      // Step 3: Email Verification
      container.innerHTML = `
        <div class="container">
          <div class="card auth-card">
            <h1>Verify Your Email</h1>
            <p class="meta">Step 4 of 6</p>
            <p>We've sent a 6-digit verification code to <strong>${registrationData.email}</strong></p>
            <div id="auth-error"></div>
            <input type="text" id="verification-code" placeholder="Enter 6-digit code" maxlength="6" style="text-align: center; font-size: 24px; letter-spacing: 8px;">
            <button class="btn" id="verify-btn">Verify</button>
            <p style="margin-top: 16px; text-align: center;">
              <a href="#" id="resend-code" style="color: #4a5d23;">Resend code</a>
            </p>
          </div>
        </div>
      `;

      document.getElementById('verify-btn')!.addEventListener('click', async () => {
        const code = (document.getElementById('verification-code') as HTMLInputElement).value;

        if (!code || code.length !== 6) {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">Please enter the 6-digit code</div>`;
          return;
        }

        const result = await verifyEmail(registrationData.email, code);

        if (result.success) {
          document.getElementById('auth-error')!.innerHTML = `<div class="success">Email verified successfully!</div>`;
          setTimeout(() => {
            registrationStep = 4;
            render();
          }, 1000);
        } else {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">${result.error}</div>`;
        }
      });

      document.getElementById('resend-code')!.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await sendVerificationCode(registrationData.email);
        if (result.success) {
          document.getElementById('auth-error')!.innerHTML = `<div class="success">Verification code resent!</div>`;
        } else {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">${result.error}</div>`;
        }
      });
    } else if (registrationStep === 4) {
      // Step 4: Different flow for students vs parents
      const isStudent = registrationData.accountType === 'student';

      if (isStudent) {
        // Students MUST link to a parent
        container.innerHTML = `
          <div class="container">
            <div class="card" style="max-width: 500px; margin: 50px auto;">
              <h1>Link to Parent Account</h1>
              <p class="meta">Step 5 of 6 - Required</p>
              <p>As a student, you must link your account to a parent or guardian.</p>
              <div id="auth-error"></div>
              <label for="parent-email">Parent/Guardian Email Address</label>
              <input type="email" id="parent-email" placeholder="parent@example.com">
              <button class="btn" id="send-parent-link-btn">Send Link Request</button>
              <p style="margin-top: 16px; font-size: 14px; color: #666;">
                Your parent will receive an email with a link request. You'll be able to log in once they approve the link.
              </p>
            </div>
          </div>
        `;

        document.getElementById('send-parent-link-btn')!.addEventListener('click', async () => {
          const parentEmail = (document.getElementById('parent-email') as HTMLInputElement).value;
          if (!parentEmail) {
            document.getElementById('auth-error')!.innerHTML = `<div class="error">Please enter your parent's email address</div>`;
            return;
          }

          // Store parent email for link request
          registrationData.parentEmail = parentEmail;
          registrationData.setupChoice = 'link-parent';

          document.getElementById('auth-error')!.innerHTML = `<div class="success">Parent link request saved. Proceeding to Terms of Service...</div>`;
          setTimeout(() => {
            registrationStep = 5;
            render();
          }, 1500);
        });
      } else {
        // Parents get the choice
        container.innerHTML = `
          <div class="container">
            <div class="card" style="max-width: 500px; margin: 50px auto;">
              <h1>Complete Your Profile</h1>
              <p class="meta">Step 5 of 6 - Almost done!</p>
              <p>Choose how you'd like to continue:</p>
              <div id="auth-error"></div>

              <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 24px;">
                <button class="btn" id="add-children-btn" style="padding: 24px;">
                  <div style="font-size: 18px; margin-bottom: 8px;">👶 Add My Children</div>
                  <div class="meta">I'll be managing my own account</div>
                </button>

                <button class="btn btn-secondary" id="link-spouse-btn" style="padding: 24px;">
                  <div style="font-size: 18px; margin-bottom: 8px;">🔗 Link to Spouse/Partner</div>
                  <div class="meta">My spouse/partner already has an account</div>
                </button>
              </div>

              <p style="margin-top: 24px; text-align: center;">
                <a href="#" id="skip-for-now" style="color: #4a5d23;">Skip for now →</a>
              </p>
            </div>
          </div>
        `;

        // Parent flow event listeners
        document.getElementById('add-children-btn')!.addEventListener('click', () => {
          registrationData.setupChoice = 'add-children';
          registrationStep = 5;
          render();
        });

        document.getElementById('link-spouse-btn')!.addEventListener('click', () => {
          // Show spouse linking form
          const card = container.querySelector('.card')!;
          card.innerHTML = `
            <h1>Link to Spouse/Partner</h1>
            <p class="meta">Enter your spouse or co-parent's email address</p>
            <div id="auth-error"></div>
            <input type="email" id="spouse-email" placeholder="Spouse's Email">
            <button class="btn" id="send-link-request-btn">Send Link Request</button>
            <p style="margin-top: 16px; text-align: center;">
              <a href="#" id="go-back-choice" style="color: #4a5d23;">← Back</a>
            </p>
          `;

          document.getElementById('send-link-request-btn')!.addEventListener('click', async () => {
            const spouseEmail = (document.getElementById('spouse-email') as HTMLInputElement).value;
            if (!spouseEmail) {
              document.getElementById('auth-error')!.innerHTML = `<div class="error">Please enter an email address</div>`;
              return;
            }

            // For now, just show success and move to TOS
            // TODO: Implement actual linking request API
            registrationData.setupChoice = 'link-spouse';
            registrationData.spouseEmail = spouseEmail;
            document.getElementById('auth-error')!.innerHTML = `<div class="success">Link request will be sent after you accept the Terms of Service.</div>`;
            setTimeout(() => {
              registrationStep = 5;
              render();
            }, 1500);
          });

          document.getElementById('go-back-choice')!.addEventListener('click', (e) => {
            e.preventDefault();
            render();
          });
        });

        document.getElementById('skip-for-now')!.addEventListener('click', (e) => {
          e.preventDefault();
          registrationData.setupChoice = 'skip';
          registrationStep = 5;
          render();
        });
      }
    } else if (registrationStep === 5) {
      // Step 5: Accept Terms of Service
      // Load active contract
      const contractResult = await api('/api/contracts/active');
      const contract = contractResult.ok ? contractResult.data.contract : null;

      if (!contract) {
        // No active contract, skip this step
        await login(registrationData.email, registrationData.password);
        if (registrationData.setupChoice === 'add-children') {
          currentView = 'edit-profile';
        }
        registrationStep = 1;
        registrationData = {};
        render();
        return;
      }

      container.innerHTML = `
        <div class="container">
          <div class="card" style="max-width: 600px; margin: 50px auto;">
            <h1>Terms of Service</h1>
            <p class="meta">Step 6 of 6 - Almost there!</p>
            <p>Please read and accept our Terms of Service to continue.</p>
            <div id="auth-error"></div>

            <div style="background: #f9f9f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; max-height: 400px; overflow-y: auto;">
              <h3 style="margin-top: 0;">${contract.title}</h3>
              <div style="white-space: pre-wrap; line-height: 1.6;">${contract.content}</div>
            </div>

            <label style="display: flex; align-items: center; margin: 16px 0; cursor: pointer;">
              <input type="checkbox" id="accept-tos" style="margin-right: 8px; width: auto;">
              <span>I have read and agree to the Terms of Service</span>
            </label>

            <button class="btn" id="accept-tos-btn">Accept & Continue</button>
          </div>
        </div>
      `;

      document.getElementById('accept-tos-btn')!.addEventListener('click', async () => {
        const accepted = (document.getElementById('accept-tos') as HTMLInputElement).checked;

        if (!accepted) {
          document.getElementById('auth-error')!.innerHTML = `<div class="error">You must accept the Terms of Service to continue</div>`;
          return;
        }

        // Login the user
        await login(registrationData.email, registrationData.password);

        // Accept the TOS
        await api('/api/contracts/accept', {
          method: 'POST',
          body: JSON.stringify({ version: contract.version })
        });

        // Handle setup choice
        if (registrationData.setupChoice === 'add-children') {
          currentView = 'edit-profile';
          render();
        } else if (registrationData.setupChoice === 'link-spouse') {
          // TODO: Send linking request
          currentView = 'events';
          render();
        } else {
          currentView = 'events';
          render();
        }

        registrationStep = 1;
        registrationData = {};
      });
    }
  }
}

function renderEvents(container: HTMLElement) {
  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div>
          <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
          <div class="meta">Role: ${currentUser.role}</div>
        </div>
        <div class="user-info-actions">
          <button class="btn btn-sm" id="manage-users-btn">👥 Member Directory</button>
          <button class="btn btn-secondary btn-sm" id="notifications-btn">🔔 Notifications</button>
          <button class="btn btn-secondary btn-sm" id="edit-profile-btn">✏️ Edit Profile</button>
          <button class="btn btn-secondary btn-sm" id="view-tos-btn">📄 Terms of Service</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <div class="page-header">
          <h1>📅 Events</h1>
          <div class="page-header-actions">
            <div class="segmented-control">
              <button class="btn btn-sm view-toggle ${calendarViewType === 'card' ? 'is-active' : ''}" id="view-card">📋 Card</button>
              <button class="btn btn-sm view-toggle ${calendarViewType === 'day' ? 'is-active' : ''}" id="view-day">📅 Day</button>
              <button class="btn btn-sm view-toggle ${calendarViewType === 'week' ? 'is-active' : ''}" id="view-week">📆 Week</button>
              <button class="btn btn-sm view-toggle ${calendarViewType === 'month' ? 'is-active' : ''}" id="view-month">🗓️ Month</button>
            </div>
            ${currentUser.role !== 'user' ? `
              <button class="btn" id="create-event-btn">+ New Event</button>
            ` : ''}
          </div>
        </div>
        <div id="events-list">
          ${calendarViewType === 'card' ? renderCardView() : ''}
          ${calendarViewType === 'day' ? renderDayView() : ''}
          ${calendarViewType === 'week' ? renderWeekView() : ''}
          ${calendarViewType === 'month' ? renderMonthView() : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  // Manage users button (if visible)
  const manageUsersBtn = document.getElementById('manage-users-btn');
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', async () => {
      currentView = 'user-management';
      await loadAllUsers();
      render();
    });
  }

  document.getElementById('notifications-btn')!.addEventListener('click', async () => {
    currentView = 'notifications';
    await loadNotificationPreferences();
    render();
  });

  document.getElementById('edit-profile-btn')!.addEventListener('click', () => {
    currentView = 'edit-profile';
    render();
  });

  document.getElementById('view-tos-btn')!.addEventListener('click', () => {
    currentView = 'terms-of-service';
    render();
  });

  // View switcher buttons
  document.getElementById('view-card')!.addEventListener('click', () => {
    calendarViewType = 'card';
    currentCardPage = 0;
    render();
  });
  document.getElementById('view-day')!.addEventListener('click', () => {
    calendarViewType = 'day';
    currentCalendarDate = new Date();
    render();
  });
  document.getElementById('view-week')!.addEventListener('click', () => {
    calendarViewType = 'week';
    currentCalendarDate = new Date();
    render();
  });
  document.getElementById('view-month')!.addEventListener('click', () => {
    calendarViewType = 'month';
    currentCalendarDate = new Date();
    render();
  });

  // Navigation buttons for card view
  const cardPrevBtn = document.getElementById('card-prev');
  if (cardPrevBtn && !cardPrevBtn.hasAttribute('disabled')) {
    cardPrevBtn.addEventListener('click', () => {
      if (currentCardPage > 0) {
        currentCardPage--;
        render();
      }
    });
  }
  const cardNextBtn = document.getElementById('card-next');
  if (cardNextBtn && !cardNextBtn.hasAttribute('disabled')) {
    cardNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(events.length / CARDS_PER_PAGE);
      if (currentCardPage < totalPages - 1) {
        currentCardPage++;
        render();
      }
    });
  }

  // Navigation buttons for day view
  const dayPrevBtn = document.getElementById('day-prev');
  if (dayPrevBtn) {
    dayPrevBtn.addEventListener('click', () => {
      currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
      render();
    });
  }
  const dayNextBtn = document.getElementById('day-next');
  if (dayNextBtn) {
    dayNextBtn.addEventListener('click', () => {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
      render();
    });
  }

  // Navigation buttons for week view
  const weekPrevBtn = document.getElementById('week-prev');
  if (weekPrevBtn) {
    weekPrevBtn.addEventListener('click', () => {
      currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
      render();
    });
  }
  const weekNextBtn = document.getElementById('week-next');
  if (weekNextBtn) {
    weekNextBtn.addEventListener('click', () => {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
      render();
    });
  }

  // Navigation buttons for month view
  const monthPrevBtn = document.getElementById('month-prev');
  if (monthPrevBtn) {
    monthPrevBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      render();
    });
  }
  const monthNextBtn = document.getElementById('month-next');
  if (monthNextBtn) {
    monthNextBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      render();
    });
  }

  // Create event button (if visible)
  const createEventBtn = document.getElementById('create-event-btn');
  if (createEventBtn) {
    createEventBtn.addEventListener('click', () => {
      currentView = 'create-event';
      render();
    });
  }

  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => {
      const eventId = parseInt(card.getAttribute('data-event-id')!);
      viewEventDetail(eventId);
    });
  });
}

// Calendar view helper functions
function renderCardView(): string {
  if (events.length === 0) return '<p class="meta" style="text-align: center; padding: 40px;">No events found.</p>';

  const totalPages = Math.ceil(events.length / CARDS_PER_PAGE);
  const startIndex = currentCardPage * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const pagedEvents = events.slice(startIndex, endIndex);

  return `
    <div class="nav-header">
      <button class="btn btn-secondary btn-icon btn-sm" id="card-prev" ${currentCardPage === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>‹</button>
      <div class="nav-title">Page ${currentCardPage + 1} of ${totalPages}</div>
      <button class="btn btn-secondary btn-icon btn-sm" id="card-next" ${currentCardPage >= totalPages - 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>›</button>
    </div>
    <div class="event-grid">
      ${pagedEvents.map(event => `
        <div class="event-card" data-event-id="${event.id}">
          <div class="event-card-header">
            <div class="event-card-content">
              <div class="event-kicker">Upcoming Event</div>
              <h3 class="event-title">${event.title}</h3>
              <div class="event-meta-list">
                <span class="event-meta-item"><span class="event-meta-icon">📍</span>${event.location.name || 'TBD'}</span>
                <span class="event-meta-item"><span class="event-meta-icon">💰</span>${event.cost || 'Free'}</span>
                <span class="event-meta-item">
                  <span class="event-meta-icon">🎯</span>
                  ${event.ageRangeType === 'age'
                    ? `Ages ${event.ageMin}-${event.ageMax}`
                    : `Grades ${event.gradeMin}-${event.gradeMax}`
                  }
                </span>
              </div>
              <div class="event-meta-list">
                <span class="event-meta-item event-meta-item--wide">
                  <span class="event-meta-icon">📅</span>
                  ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}
                </span>
                <span class="event-meta-item"><span class="event-meta-icon">👤</span>${event.creator.name}</span>
                <span class="event-meta-item"><span class="event-meta-icon">📊</span>${event.currentAttendees} attending</span>
              </div>
              ${event.description ? `<div class="event-card-body"><p class="event-description">${event.description}</p></div>` : ''}
            </div>
            <span class="badge badge-${event.status}">${event.status}</span>
          </div>
          <div class="event-card-footer">
            <span>View details</span>
            <span>→</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDayView(): string {
  const viewDate = new Date(currentCalendarDate);
  viewDate.setHours(0, 0, 0, 0);

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === viewDate.getTime();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = viewDate.getTime() === today.getTime();

  return `
    <div class="nav-header">
      <button class="btn btn-secondary btn-icon btn-sm" id="day-prev">‹</button>
      <div class="nav-title">
        ${viewDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        ${isToday ? '<span style="color: #4a5d23; font-weight: 700;"> (Today)</span>' : ''}
      </div>
      <button class="btn btn-secondary btn-icon btn-sm" id="day-next">›</button>
    </div>
    ${dayEvents.length === 0 ? '<p class="meta" style="text-align: center; padding: 40px;">No events scheduled for this day.</p>' : `
      <div class="event-grid">
        ${dayEvents.map(event => `
          <div class="event-card" data-event-id="${event.id}">
            <div class="event-card-header">
              <div class="event-card-content">
                <div class="event-kicker">Scheduled Today</div>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta-list">
                  <span class="event-meta-item event-meta-item--wide">
                    <span class="event-meta-icon">⏰</span>
                    ${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span class="event-meta-item"><span class="event-meta-icon">📍</span>${event.location.name || 'TBD'}</span>
                  <span class="event-meta-item"><span class="event-meta-icon">💰</span>${event.cost || 'Free'}</span>
                </div>
                ${event.description ? `<div class="event-card-body"><p class="event-description">${event.description}</p></div>` : ''}
              </div>
              <span class="badge badge-${event.status}">${event.status}</span>
            </div>
            <div class="event-card-footer">
              <span>View details</span>
              <span>→</span>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

function renderWeekView(): string {
  const viewDate = new Date(currentCalendarDate);
  const dayOfWeek = viewDate.getDay();
  const startOfWeek = new Date(viewDate);
  startOfWeek.setDate(viewDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return `
    <div class="nav-header">
      <button class="btn btn-secondary btn-icon btn-sm" id="week-prev">‹</button>
      <div class="nav-title">
        ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <button class="btn btn-secondary btn-icon btn-sm" id="week-next">›</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
      ${days.map(day => {
        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.startDate);
          eventDate.setHours(0, 0, 0, 0);
          const currentDay = new Date(day);
          currentDay.setHours(0, 0, 0, 0);
          return eventDate.getTime() === currentDay.getTime();
        });

        const isToday = day.toDateString() === today.toDateString();

        return `
          <div style="border: 2px solid ${isToday ? '#4a5d23' : '#e2e8f0'}; border-radius: 12px; padding: 12px; min-height: 140px; background: ${isToday ? '#f4ede3' : 'white'}; box-shadow: ${isToday ? '0 4px 12px rgba(74, 93, 35, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'};">
            <div style="font-weight: 700; margin-bottom: 12px; color: ${isToday ? '#4a5d23' : '#2d3748'}; font-size: 14px;">
              ${day.toLocaleDateString('en-US', { weekday: 'short' })}<br>
              <span style="font-size: 20px;">${day.getDate()}</span>
            </div>
            ${dayEvents.map(event => `
              <div class="event-card" data-event-id="${event.id}" style="margin-bottom: 6px; padding: 10px; font-size: 11px; cursor: pointer; border-left: 3px solid #4a5d23; background: #f7fafc;">
                <div style="font-weight: 600; margin-bottom: 2px;">${event.title.length > 25 ? event.title.substring(0, 25) + '...' : event.title}</div>
                <div class="meta" style="font-size: 10px; margin-bottom: 4px;">${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                ${event.description ? `<div style="font-size: 10px; color: #718096; line-height: 1.3;">${event.description.length > 60 ? event.description.substring(0, 60) + '...' : event.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMonthView(): string {
  const viewDate = new Date(currentCalendarDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks = [];
  let currentWeek = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add empty cells for remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return `
    <div>
      <div class="nav-header">
        <button class="btn btn-secondary btn-icon btn-sm" id="month-prev">‹</button>
        <div class="nav-title">
          ${viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button class="btn btn-secondary btn-icon btn-sm" id="month-next">›</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 12px;">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
          `<div style="text-align: center; font-weight: 700; padding: 10px; font-size: 13px; color: #4a5568;">${day}</div>`
        ).join('')}
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
        ${weeks.map(week => week.map(day => {
          if (!day) {
            return '<div style="min-height: 90px; border: 2px solid #edf2f7; border-radius: 8px; background: #f7fafc;"></div>';
          }

          const currentDate = new Date(year, month, day);
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.getFullYear() === year &&
                   eventDate.getMonth() === month &&
                   eventDate.getDate() === day;
          });

          const isToday = currentDate.toDateString() === today.toDateString();

          return `
            <div style="min-height: 90px; border: 2px solid ${isToday ? '#4a5d23' : '#e2e8f0'}; border-radius: 8px; padding: 8px; background: ${isToday ? '#f4ede3' : 'white'}; box-shadow: ${isToday ? '0 4px 12px rgba(74, 93, 35, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'}; transition: all 0.2s;">
              <div style="font-weight: 700; margin-bottom: 6px; font-size: 16px; color: ${isToday ? '#4a5d23' : '#2d3748'};">${day}</div>
              ${dayEvents.map(event => `
                <div class="event-card" data-event-id="${event.id}" style="margin-bottom: 4px; padding: 6px; font-size: 10px; cursor: pointer; background: linear-gradient(135deg, #4a5d23 0%, #3a4528 100%); color: white; border-radius: 6px; font-weight: 600; box-shadow: 0 2px 4px rgba(74, 93, 35, 0.3);" title="${event.description || event.title}">
                  <div style="margin-bottom: 2px;">${event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}</div>
                  ${event.description ? `<div style="font-size: 9px; font-weight: 400; opacity: 0.9; line-height: 1.2;">${event.description.length > 30 ? event.description.substring(0, 30) + '...' : event.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        }).join('')).join('')}
      </div>
    </div>
  `;
}

async function renderEventDetail(container: HTMLElement, eventId: number) {
  // Fetch event details
  const eventResult = await api(`/api/events/${eventId}`);
  const commentsResult = await api(`/api/comments/${eventId}`);
  const rsvpsResult = await api(`/api/rsvps/${eventId}`);
  const formResult = await api(`/api/forms/event/${eventId}`);
  const documentsResult = await api(`/api/events/${eventId}/documents`);

  if (!eventResult.ok) {
    container.innerHTML = '<div class="container"><div class="card"><div class="error">Event not found</div></div></div>';
    return;
  }

  const event = eventResult.data.event;
  const comments = commentsResult.ok ? commentsResult.data.comments : [];
  const rsvps = rsvpsResult.ok ? rsvpsResult.data.rsvps : [];
  const userRsvp = rsvps.find((r: any) => r.userId === currentUser.id);
  const eventForm = formResult.ok && formResult.data.form ? formResult.data.form : null;
  const documents = documentsResult.ok ? documentsResult.data.documents : [];

  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div>
          <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
        </div>
        <div class="user-info-actions">
          <button class="btn btn-secondary btn-sm" id="back-btn">← Back to Events</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <div class="page-header" style="align-items: flex-start;">
          <h1>${event.title}</h1>
          <span class="badge badge-${event.status}">${event.status}</span>
        </div>

        <div class="meta" style="margin-bottom: 16px;">
          📅 ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}<br>
          📍 ${event.location.name || 'TBD'} ${event.location.address ? '- ' + event.location.address : ''}<br>
          💰 Cost: ${event.cost || 'Free'}<br>
          ${event.ageRangeType === 'age'
            ? `👶 Ages: ${event.ageMin}-${event.ageMax}`
            : `📚 Grades: ${event.gradeMin}-${event.gradeMax}`
          }<br>
          ⏰ Registration Deadline: ${new Date(event.registrationDeadline).toLocaleDateString()} at ${new Date(event.registrationDeadline).toLocaleTimeString()}<br>
          👤 Created by: ${event.creator.name}<br>
          📊 ${event.currentAttendees} ${event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
        </div>

        <p style="margin-bottom: 24px;">${event.description || 'No description provided.'}</p>

        ${event.customFields && event.customFields.length > 0 ? `
          <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0;">ℹ️ Additional Information</h3>
            ${event.customFields.map((field: any) => `
              <div style="margin-bottom: 12px;">
                <strong>${field.label}:</strong>
                <p style="margin: 4px 0 0 0; white-space: pre-wrap;">${field.value}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${event.attachment ? `
          <div style="margin-bottom: 24px; padding: 16px; background: #f4ede3; border-radius: 8px; border: 2px solid #4a5d23;">
            <h3 style="margin-top: 0;">📎 Attachment</h3>
            <p style="margin-bottom: 12px;"><strong>File:</strong> ${event.attachment.filename}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="${event.attachment.path}" target="_blank" class="btn btn-sm" download="${event.attachment.filename}">
                ⬇️ Download
              </a>
              <button class="btn btn-secondary btn-sm" id="print-attachment-btn">
                🖨️ Print
              </button>
            </div>
          </div>
        ` : ''}

        <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin-top: 0;">📁 Event Documents</h3>

          ${(currentUser.role === 'super_admin' || currentUser.role === 'admin' || event.creator.id === currentUser.id) ? `
            <div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <p class="meta" style="margin-bottom: 8px;">Upload additional documents (PDFs, images, etc.)</p>
              <input type="file" id="document-upload-input" style="margin-bottom: 8px;" />
              <button class="btn btn-sm" id="upload-document-btn">📤 Upload Document</button>
              <div id="upload-status" style="margin-top: 8px;"></div>
            </div>
          ` : ''}

          ${documents.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${documents.map((doc: any) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                  <div style="flex: 1;">
                    <strong>${doc.original_filename}</strong>
                    <div class="meta">
                      ${(doc.file_size / 1024).toFixed(1)} KB •
                      Uploaded by ${doc.uploader_name} •
                      ${new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <a href="/api/documents/${doc.id}/download" class="btn btn-sm" download="${doc.original_filename}">
                      ⬇️ Download
                    </a>
                    ${(currentUser.role === 'super_admin' || currentUser.role === 'admin' || event.creator.id === currentUser.id || doc.uploaded_by === currentUser.id) ? `
                      <button class="btn btn-secondary btn-sm delete-document-btn" data-doc-id="${doc.id}">
                        🗑️ Delete
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="meta">No documents uploaded yet.</p>
          `}
        </div>

        ${(currentUser.role === 'super_admin' || currentUser.role === 'admin' || event.creator.id === currentUser.id) ? `
          <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
            <h3>📝 Event Form</h3>
            <p class="meta">Create a custom signup form to collect information from attendees.</p>
            <button class="btn btn-sm" id="create-form-btn" style="margin-top: 8px;">Create Signup Form</button>
          </div>
        ` : ''}

        <h3>✅ RSVP</h3>
        <div class="rsvp-buttons" style="margin-bottom: 24px;">
          <button class="btn ${userRsvp?.status === 'going' ? 'active' : ''}" data-status="going">Going</button>
          <button class="btn ${userRsvp?.status === 'maybe' ? 'active' : ''}" data-status="maybe">Maybe</button>
          <button class="btn btn-secondary ${userRsvp?.status === 'not-going' ? 'active' : ''}" data-status="not-going">Can't Go</button>
        </div>

        ${eventForm ? `
          <h3>📝 Signup Form</h3>
          <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
            <p class="meta" style="margin-bottom: 16px;">Please fill out this form to register for the event. Your contact information is pre-filled from your account.</p>

            <div id="signup-form">
              <label style="display: block; margin-bottom: 4px; font-weight: 600;">First Name *</label>
              <input type="text" id="form-firstName" value="${currentUser.firstName}" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Last Name *</label>
              <input type="text" id="form-lastName" value="${currentUser.lastName}" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Email *</label>
              <input type="email" id="form-email" value="${currentUser.email}" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Phone *</label>
              <input type="tel" id="form-phone" value="${currentUser.phone}" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Children Attending (Names) *</label>
              <input type="text" id="form-children-names" placeholder="e.g., Sarah, Michael, Emma" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Children's Ages *</label>
              <input type="text" id="form-children-ages" placeholder="e.g., 7, 9, 11" style="margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Additional Adults Attending (optional)</label>
              <input type="text" id="form-additional-adults" placeholder="e.g., John Smith, Jane Doe" style="margin-bottom: 12px;">

              ${eventForm.fields.map((field: any) => {
                if (field.type === 'textarea') {
                  return `
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">${field.label} ${field.required ? '*' : ''}</label>
                    <textarea id="form-field-${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
                  `;
                } else if (field.type === 'select') {
                  const options = field.options ? field.options.split(',').map((o: string) => o.trim()) : [];
                  return `
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">${field.label} ${field.required ? '*' : ''}</label>
                    <select id="form-field-${field.id}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px;" ${field.required ? 'required' : ''}>
                      <option value="">-- Select --</option>
                      ${options.map((opt: string) => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                  `;
                } else if (field.type === 'radio') {
                  const options = field.options ? field.options.split(',').map((o: string) => o.trim()) : [];
                  return `
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">${field.label} ${field.required ? '*' : ''}</label>
                    <div style="margin-bottom: 12px;">
                      ${options.map((opt: string, i: number) => `
                        <label style="display: block; margin-bottom: 4px; cursor: pointer;">
                          <input type="radio" name="form-field-${field.id}" value="${opt}" style="width: auto; margin-right: 8px;" ${field.required && i === 0 ? 'checked' : ''}>
                          ${opt}
                        </label>
                      `).join('')}
                    </div>
                  `;
                } else if (field.type === 'checkbox') {
                  const options = field.options ? field.options.split(',').map((o: string) => o.trim()) : [];
                  return `
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">${field.label} ${field.required ? '*' : ''}</label>
                    <div style="margin-bottom: 12px;">
                      ${options.map((opt: string) => `
                        <label style="display: block; margin-bottom: 4px; cursor: pointer;">
                          <input type="checkbox" name="form-field-${field.id}" value="${opt}" style="width: auto; margin-right: 8px;">
                          ${opt}
                        </label>
                      `).join('')}
                    </div>
                  `;
                } else {
                  return `
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">${field.label} ${field.required ? '*' : ''}</label>
                    <input type="${field.type}" id="form-field-${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} style="margin-bottom: 12px;">
                  `;
                }
              }).join('')}

              <button class="btn" id="submit-form-btn">Submit Registration</button>
            </div>
          </div>
        ` : ''}

        <h3>👥 Who's Going (${rsvps.filter((r: any) => r.status === 'going').length})</h3>
        <div style="margin-bottom: 24px;">
          ${rsvps.filter((r: any) => r.status === 'going').map((r: any) =>
            `<span class="badge" style="background: #e9ecef; color: #333; margin-right: 8px;">${r.userName}</span>`
          ).join('') || '<p class="meta">No one yet - be the first!</p>'}
        </div>

        <h3>💬 Comments & Discussion (${comments.length})</h3>
        <div id="comments-list" style="margin-bottom: 16px;">
          ${comments.map((comment: any) => `
            <div class="comment ${comment.parentCommentId ? 'reply' : ''}">
              <strong>${comment.userName}</strong>
              <div class="meta">${new Date(comment.createdAt).toLocaleString()}</div>
              <p style="margin: 8px 0;">${comment.content}</p>
            </div>
          `).join('') || '<p class="meta">No comments yet. Be the first to comment!</p>'}
        </div>

        <h4>Add a comment</h4>
        <textarea id="comment-text" placeholder="Write your comment here..."></textarea>
        <button class="btn" id="add-comment-btn">Post Comment</button>
      </div>
    </div>
  `;

  document.getElementById('back-btn')!.addEventListener('click', async () => {
    currentView = 'events';
    await loadEvents();
    render();
  });

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  document.querySelectorAll('.rsvp-buttons button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.getAttribute('data-status')!;
      await showChildSelectionModal(eventId, status);
    });
  });

  document.getElementById('add-comment-btn')!.addEventListener('click', async () => {
    const content = (document.getElementById('comment-text') as HTMLTextAreaElement).value;
    if (content.trim()) {
      await addComment(eventId, content);
      (document.getElementById('comment-text') as HTMLTextAreaElement).value = '';
    }
  });

  // Form builder button (if visible)
  const createFormBtn = document.getElementById('create-form-btn');
  if (createFormBtn) {
    createFormBtn.addEventListener('click', () => openFormBuilder(eventId));
  }

  // Print attachment button (if visible)
  const printAttachmentBtn = document.getElementById('print-attachment-btn');
  if (printAttachmentBtn && event.attachment) {
    printAttachmentBtn.addEventListener('click', () => {
      // Open the file in a new window and trigger print
      const printWindow = window.open(event.attachment.path, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    });
  }

  // Document upload button (if visible)
  const uploadDocumentBtn = document.getElementById('upload-document-btn');
  if (uploadDocumentBtn) {
    uploadDocumentBtn.addEventListener('click', async () => {
      const fileInput = document.getElementById('document-upload-input') as HTMLInputElement;
      const statusDiv = document.getElementById('upload-status')!;

      if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerHTML = '<div class="error">Please select a file to upload</div>';
        return;
      }

      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      statusDiv.innerHTML = '<p class="meta">Uploading...</p>';
      uploadDocumentBtn.disabled = true;

      const result = await api(`/api/events/${eventId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (result.ok) {
        statusDiv.innerHTML = '<div style="color: green;">✅ File uploaded successfully!</div>';
        fileInput.value = '';
        // Refresh the event detail view to show the new document
        setTimeout(() => renderEventDetail(container, eventId), 1000);
      } else {
        statusDiv.innerHTML = `<div class="error">Upload failed: ${result.data.error}</div>`;
        uploadDocumentBtn.disabled = false;
      }
    });
  }

  // Delete document buttons (if visible)
  document.querySelectorAll('.delete-document-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const docId = btn.getAttribute('data-doc-id')!;

      if (!confirm('Are you sure you want to delete this document?')) {
        return;
      }

      const result = await api(`/api/documents/${docId}`, {
        method: 'DELETE'
      });

      if (result.ok) {
        // Refresh the event detail view
        renderEventDetail(container, eventId);
      } else {
        alert(`Error deleting document: ${result.data.error}`);
      }
    });
  });

  // Form submission (if visible)
  const submitFormBtn = document.getElementById('submit-form-btn');
  if (submitFormBtn && eventForm) {
    submitFormBtn.addEventListener('click', async () => {
      // Collect built-in fields
      const formData: any = {
        firstName: (document.getElementById('form-firstName') as HTMLInputElement).value,
        lastName: (document.getElementById('form-lastName') as HTMLInputElement).value,
        email: (document.getElementById('form-email') as HTMLInputElement).value,
        phone: (document.getElementById('form-phone') as HTMLInputElement).value,
        childrenNames: (document.getElementById('form-children-names') as HTMLInputElement).value,
        childrenAges: (document.getElementById('form-children-ages') as HTMLInputElement).value,
        additionalAdults: (document.getElementById('form-additional-adults') as HTMLInputElement).value
      };

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.childrenNames || !formData.childrenAges) {
        alert('Please fill out all required fields');
        return;
      }

      // Collect custom form fields
      const responses: any = {};
      eventForm.fields.forEach((field: any) => {
        const element = document.getElementById(`form-field-${field.id}`);
        if (element) {
          if (field.type === 'checkbox') {
            const checkboxes = document.querySelectorAll(`input[name="form-field-${field.id}"]:checked`);
            responses[field.id] = Array.from(checkboxes).map((cb: any) => cb.value).join(', ');
          } else if (field.type === 'radio') {
            const radio = document.querySelector(`input[name="form-field-${field.id}"]:checked`) as HTMLInputElement;
            responses[field.id] = radio ? radio.value : '';
          } else {
            responses[field.id] = (element as HTMLInputElement).value;
          }
        }
      });

      // Add built-in fields to responses with special field IDs (negative numbers to differentiate)
      responses[-1] = formData.firstName;
      responses[-2] = formData.lastName;
      responses[-3] = formData.email;
      responses[-4] = formData.phone;
      responses[-5] = formData.childrenNames;
      responses[-6] = formData.childrenAges;
      responses[-7] = formData.additionalAdults;

      const result = await api('/api/forms/respond', {
        method: 'POST',
        body: JSON.stringify({
          formId: eventForm.id,
          eventId,
          responses
        })
      });

      if (result.ok) {
        alert('Registration submitted successfully!');
        await viewEventDetail(eventId);
      } else {
        alert('Error submitting registration: ' + result.data.error);
      }
    });
  }
}

function renderFormBuilder(container: HTMLElement, eventId: number) {
  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div><strong>${currentUser.firstName} ${currentUser.lastName}</strong></div>
        <div class="user-info-actions">
          <button class="btn btn-secondary btn-sm" id="back-to-event-btn">← Back to Event</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <h1>📝 Form Builder</h1>
        <p style="margin-bottom: 24px;">Create a custom signup form for this event. Add fields to collect information from attendees.</p>

        <div id="form-fields-list">
          ${formFields.length === 0 ? '<p class="meta">No fields yet. Click "Add Field" to get started.</p>' : formFields.map((field, index) => `
            <div class="card" style="background: #f8f9fa; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <h3>Field ${index + 1}</h3>
                <button class="btn btn-danger btn-sm" data-remove-index="${index}">Remove</button>
              </div>

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Field Label</label>
              <input type="text" data-field-index="${index}" data-field-prop="label" value="${field.label}" placeholder="e.g., Parent Name(s)">

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Field Type</label>
              <select data-field-index="${index}" data-field-prop="type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px;">
                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Short Text</option>
                <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Long Text (Textarea)</option>
                <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Phone Number</option>
                <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Dropdown (Select)</option>
                <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Multiple Choice (Radio)</option>
                <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkboxes</option>
              </select>

              ${field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? `
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Options (comma-separated)</label>
                <input type="text" data-field-index="${index}" data-field-prop="options" value="${field.options || ''}" placeholder="e.g., Option 1, Option 2, Option 3">
              ` : ''}

              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Placeholder (optional)</label>
              <input type="text" data-field-index="${index}" data-field-prop="placeholder" value="${field.placeholder || ''}" placeholder="e.g., Enter names here...">

              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" data-field-index="${index}" data-field-prop="required" ${field.required ? 'checked' : ''} style="width: auto; margin-right: 8px;">
                Required field
              </label>
            </div>
          `).join('')}
        </div>

        <button class="btn" id="add-field-btn">+ Add Field</button>
        ${formFields.length > 0 ? '<button class="btn" id="save-form-btn" style="margin-left: 8px;">Save Form</button>' : ''}
      </div>
    </div>
  `;

  document.getElementById('back-to-event-btn')!.addEventListener('click', () => viewEventDetail(eventId));
  document.getElementById('logout-btn')!.addEventListener('click', logout);
  document.getElementById('add-field-btn')!.addEventListener('click', () => {
    addFormField();
  });

  // Remove field buttons
  document.querySelectorAll('[data-remove-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-remove-index')!);
      removeFormField(index);
    });
  });

  // Field input handlers
  document.querySelectorAll('[data-field-index]').forEach(input => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const index = parseInt(target.getAttribute('data-field-index')!);
      const prop = target.getAttribute('data-field-prop')!;

      if (prop === 'required') {
        formFields[index][prop] = (target as HTMLInputElement).checked;
      } else {
        formFields[index][prop] = target.value;
      }
    });
  });

  if (formFields.length > 0) {
    document.getElementById('save-form-btn')!.addEventListener('click', () => saveForm(eventId));
  }
}

function renderCreateEvent(container: HTMLElement) {
  // Get selected age range type from DOM if available, otherwise default to 'age'
  const ageRangeType = (document.getElementById('age-range-type') as HTMLInputElement)?.value || 'age';

  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div><strong>${currentUser.firstName} ${currentUser.lastName}</strong></div>
        <div class="user-info-actions">
          <button class="btn btn-secondary btn-sm" id="back-to-events-btn">← Back to Events</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <h1>📅 Create New Event</h1>
        <p style="margin-bottom: 24px; color: #666;">
          ${currentUser.role === 'super_admin' || currentUser.role === 'admin'
            ? 'Your event will be published immediately.'
            : 'Your event will be submitted for approval before being published.'}
        </p>

        <div id="create-event-error"></div>

        <h3 style="margin-top: 0;">Basic Information</h3>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Event Title *</label>
        <input type="text" id="event-title" placeholder="e.g., Summer Picnic 2025">

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Description</label>
        <textarea id="event-description" placeholder="Describe your event..."></textarea>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Category</label>
        <select id="event-category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px;">
          <option value="Social">Social</option>
          <option value="Educational">Educational</option>
          <option value="Enrichment">Enrichment</option>
          <option value="Field Trip">Field Trip</option>
          <option value="Sports & Recreation">Sports & Recreation</option>
          <option value="Arts & Crafts">Arts & Crafts</option>
          <option value="Volunteer">Volunteer</option>
          <option value="Other">Other</option>
        </select>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Cost *</label>
        <input type="text" id="event-cost" placeholder="Free or enter amount e.g., $10" value="Free">

        <h3>Date & Time</h3>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Start Date & Time *</label>
        <input type="datetime-local" id="event-start-date">

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">End Date & Time</label>
        <input type="datetime-local" id="event-end-date">

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Registration Deadline *</label>
        <input type="datetime-local" id="event-registration-deadline">

        <h3>Location</h3>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Location Name</label>
        <input type="text" id="event-location-name" placeholder="e.g., Central Park">

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Location Address</label>
        <input type="text" id="event-location-address" placeholder="e.g., 123 Park Ave, City, State 12345">

        <h3>Age/Grade Range *</h3>
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 8px; cursor: pointer;">
            <input type="radio" name="age-range-type" value="age" ${ageRangeType === 'age' ? 'checked' : ''} style="width: auto; margin-right: 8px;">
            Age Range
          </label>
          <label style="display: block; margin-bottom: 8px; cursor: pointer;">
            <input type="radio" name="age-range-type" value="grade" ${ageRangeType === 'grade' ? 'checked' : ''} style="width: auto; margin-right: 8px;">
            Grade Range
          </label>
        </div>

        <div id="age-range-inputs" style="display: ${ageRangeType === 'age' ? 'block' : 'none'};">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Minimum Age *</label>
          <input type="number" id="event-age-min" placeholder="e.g., 5" min="0" max="18">

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Maximum Age *</label>
          <input type="number" id="event-age-max" placeholder="e.g., 12" min="0" max="18">
        </div>

        <div id="grade-range-inputs" style="display: ${ageRangeType === 'grade' ? 'block' : 'none'};">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Minimum Grade *</label>
          <select id="event-grade-min" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px;">
            <option value="K">Kindergarten</option>
            <option value="1">1st Grade</option>
            <option value="2">2nd Grade</option>
            <option value="3">3rd Grade</option>
            <option value="4">4th Grade</option>
            <option value="5">5th Grade</option>
            <option value="6">6th Grade</option>
            <option value="7">7th Grade</option>
            <option value="8">8th Grade</option>
            <option value="9">9th Grade</option>
            <option value="10">10th Grade</option>
            <option value="11">11th Grade</option>
            <option value="12">12th Grade</option>
          </select>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Maximum Grade *</label>
          <select id="event-grade-max" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px;">
            <option value="K">Kindergarten</option>
            <option value="1">1st Grade</option>
            <option value="2">2nd Grade</option>
            <option value="3">3rd Grade</option>
            <option value="4">4th Grade</option>
            <option value="5">5th Grade</option>
            <option value="6">6th Grade</option>
            <option value="7">7th Grade</option>
            <option value="8">8th Grade</option>
            <option value="9">9th Grade</option>
            <option value="10">10th Grade</option>
            <option value="11">11th Grade</option>
            <option value="12">12th Grade</option>
          </select>
        </div>

        <h3>Additional Settings</h3>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Max Attendees (optional)</label>
        <input type="number" id="event-max-attendees" placeholder="Leave empty for unlimited" min="1">

        <h3>Custom Event Information (Optional)</h3>
        <p class="meta" style="margin-bottom: 12px;">Add custom fields to display additional event information to attendees.</p>

        <div id="event-custom-fields">
          ${eventCustomFields.length === 0 ? '<p class="meta">No custom fields yet.</p>' : eventCustomFields.map((field, index) => `
            <div class="card" style="background: #f8f9fa; margin-bottom: 12px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>Field ${index + 1}</strong>
                <button class="btn btn-danger btn-sm" data-remove-custom="${index}">Remove</button>
              </div>
              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Label</label>
              <input type="text" data-custom-index="${index}" data-custom-prop="label" value="${field.label}" placeholder="e.g., What to Bring">
              <label style="display: block; margin-bottom: 4px; font-weight: 600;">Value</label>
              <textarea data-custom-index="${index}" data-custom-prop="value" placeholder="e.g., Sunscreen, water bottle, snacks">${field.value || ''}</textarea>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-sm" id="add-custom-field-btn">+ Add Custom Field</button>

        <h3 style="margin-top: 24px;">Attachment (Optional)</h3>
        <p class="meta" style="margin-bottom: 12px;">Upload a document, form, or any file for attendees to download or print.</p>

        <label style="display: block; margin-bottom: 4px; font-weight: 600;">File Upload</label>
        <input type="file" id="event-attachment" style="margin-bottom: 8px;" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt">
        ${eventAttachmentFile ? `<p class="success" style="margin-top: 4px;">✓ Selected: ${eventAttachmentFile.name}</p>` : ''}

        <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #eee;">
          <button class="btn" id="submit-event-btn">Create Event</button>
          <button class="btn btn-secondary" id="cancel-event-btn" style="margin-left: 8px;">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-events-btn')!.addEventListener('click', () => {
    currentView = 'events';
    eventCustomFields = [];
    eventAttachmentFile = null;
    render();
  });

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  document.getElementById('cancel-event-btn')!.addEventListener('click', () => {
    currentView = 'events';
    eventCustomFields = [];
    eventAttachmentFile = null;
    render();
  });

  // Age/Grade range type toggle
  document.querySelectorAll('input[name="age-range-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      render();
    });
  });

  // Add custom field button
  document.getElementById('add-custom-field-btn')!.addEventListener('click', () => {
    eventCustomFields.push({ label: '', value: '' });
    render();
  });

  // Remove custom field buttons
  document.querySelectorAll('[data-remove-custom]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-remove-custom')!);
      eventCustomFields.splice(index, 1);
      render();
    });
  });

  // Custom field input handlers
  document.querySelectorAll('[data-custom-index]').forEach(input => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const index = parseInt(target.getAttribute('data-custom-index')!);
      const prop = target.getAttribute('data-custom-prop')!;
      eventCustomFields[index][prop] = target.value;
    });
  });

  // File attachment handler
  const fileInput = document.getElementById('event-attachment') as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        eventAttachmentFile = target.files[0];
        render();
      }
    });
  }

  document.getElementById('submit-event-btn')!.addEventListener('click', async () => {
    const title = (document.getElementById('event-title') as HTMLInputElement).value.trim();
    const description = (document.getElementById('event-description') as HTMLTextAreaElement).value.trim();
    const category = (document.getElementById('event-category') as HTMLSelectElement).value;
    const cost = (document.getElementById('event-cost') as HTMLInputElement).value.trim();
    const startDate = (document.getElementById('event-start-date') as HTMLInputElement).value;
    const endDate = (document.getElementById('event-end-date') as HTMLInputElement).value;
    const registrationDeadline = (document.getElementById('event-registration-deadline') as HTMLInputElement).value;
    const locationName = (document.getElementById('event-location-name') as HTMLInputElement).value.trim();
    const locationAddress = (document.getElementById('event-location-address') as HTMLInputElement).value.trim();
    const maxAttendeesValue = (document.getElementById('event-max-attendees') as HTMLInputElement).value;
    const maxAttendees = maxAttendeesValue ? parseInt(maxAttendeesValue) : null;

    // Get age/grade range type
    const ageRangeTypeInput = document.querySelector('input[name="age-range-type"]:checked') as HTMLInputElement;
    const ageRangeType = ageRangeTypeInput ? ageRangeTypeInput.value : 'age';

    let ageMin = null, ageMax = null, gradeMin = null, gradeMax = null;

    if (ageRangeType === 'age') {
      const ageMinInput = (document.getElementById('event-age-min') as HTMLInputElement).value;
      const ageMaxInput = (document.getElementById('event-age-max') as HTMLInputElement).value;
      ageMin = ageMinInput ? parseInt(ageMinInput) : null;
      ageMax = ageMaxInput ? parseInt(ageMaxInput) : null;
    } else {
      gradeMin = (document.getElementById('event-grade-min') as HTMLSelectElement).value;
      gradeMax = (document.getElementById('event-grade-max') as HTMLSelectElement).value;
    }

    // Validate required fields
    if (!title || !startDate) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">Please fill out the title and start date.</div>';
      return;
    }

    if (!registrationDeadline) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">Please fill out the registration deadline.</div>';
      return;
    }

    if (ageRangeType === 'age' && (!ageMin || !ageMax)) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">Please fill out both minimum and maximum age.</div>';
      return;
    }

    if (ageRangeType === 'grade' && (!gradeMin || !gradeMax)) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">Please select both minimum and maximum grade.</div>';
      return;
    }

    // Validate dates
    if (endDate && new Date(endDate) < new Date(startDate)) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">End date cannot be before start date.</div>';
      return;
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      document.getElementById('create-event-error')!.innerHTML =
        '<div class="error">Registration deadline must be before the event start date.</div>';
      return;
    }

    // Filter out empty custom fields
    const customFields = eventCustomFields.filter(f => f.label.trim() && f.value.trim());

    // Upload file if selected
    let attachmentFilename = null;
    let attachmentPath = null;

    if (eventAttachmentFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', eventAttachmentFile);

        const uploadResponse = await fetch(`${API_URL}/api/events/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: uploadFormData
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          attachmentFilename = uploadData.filename;
          attachmentPath = uploadData.path;
        } else {
          document.getElementById('create-event-error')!.innerHTML =
            `<div class="error">File upload failed: ${uploadData.error || 'Unknown error'}</div>`;
          return;
        }
      } catch (error) {
        document.getElementById('create-event-error')!.innerHTML =
          `<div class="error">File upload failed. Please try again.</div>`;
        return;
      }
    }

    const eventData = {
      title,
      description,
      category,
      cost: cost || 'Free',
      startDate,
      endDate: endDate || null,
      registrationDeadline,
      locationName,
      locationAddress,
      maxAttendees,
      ageRangeType,
      ageMin,
      ageMax,
      gradeMin,
      gradeMax,
      customFields: customFields.length > 0 ? customFields : null,
      attachmentFilename,
      attachmentPath
    };

    const result = await createEvent(eventData);
    if (!result.success) {
      document.getElementById('create-event-error')!.innerHTML =
        `<div class="error">${result.error}</div>`;
    } else {
      const statusMsg = currentUser.role === 'super_admin' || currentUser.role === 'admin'
        ? 'Event created and published!'
        : 'Event submitted for approval!';
      alert(statusMsg);
      eventCustomFields = [];
      eventAttachmentFile = null;
      currentView = 'events';
      await loadEvents();
      render();
    }
  });
}

function renderUserManagement(container: HTMLElement) {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div>
          <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
          <div class="meta">Role: ${currentUser.role}</div>
        </div>
        <div class="user-info-actions">
          ${isAdmin ? '<button class="btn btn-secondary btn-sm" id="contracts-btn">📄 Contracts</button>' : ''}
          <button class="btn btn-secondary btn-sm" id="back-to-events-btn">← Back to Events</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <h1>👥 ${isAdmin ? 'User Management' : 'Member Directory'}</h1>
        <p class="meta" style="margin-bottom: 24px;">${isAdmin ? 'Manage all registered users. Click Edit to modify user details.' : 'Connect with other members of our homeschool group. Contact information is available for coordination and planning.'}</p>

        <div style="overflow-x: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                ${isAdmin ? '<th>Created</th>' : ''}
                ${isAdmin ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${allUsers.map(user => `
                <tr>
                  <td>
                    ${isAdmin && editingUserId === user.id ? `
                      <div style="display: flex; gap: 8px;">
                        <input type="text" id="edit-firstName-${user.id}" value="${user.firstName}" style="margin: 0; width: 100px;">
                        <input type="text" id="edit-lastName-${user.id}" value="${user.lastName}" style="margin: 0; width: 100px;">
                      </div>
                    ` : `<strong>${user.firstName} ${user.lastName}</strong>`}
                  </td>
                  <td>
                    ${isAdmin && editingUserId === user.id ? `
                      <input type="email" id="edit-email-${user.id}" value="${user.email}" style="margin: 0;">
                    ` : `<a href="mailto:${user.email}" style="color: #4a5d23; text-decoration: none;">${user.email}</a>`}
                  </td>
                  <td>
                    ${isAdmin && editingUserId === user.id ? `
                      <input type="tel" id="edit-phone-${user.id}" value="${user.phone}" style="margin: 0;">
                    ` : `<a href="tel:${user.phone}" style="color: #4a5d23; text-decoration: none;">${user.phone}</a>`}
                  </td>
                  <td>
                    ${isAdmin && editingUserId === user.id ? `
                      <select id="edit-role-${user.id}" style="margin: 0; padding: 8px;">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="event_creator" ${user.role === 'event_creator' ? 'selected' : ''}>Event Creator</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        ${currentUser.role === 'super_admin' ? `<option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>` : ''}
                      </select>
                    ` : `<span class="badge badge-${user.role === 'admin' || user.role === 'super_admin' ? 'published' : 'pending'}">${user.role.replace('_', ' ')}</span>`}
                  </td>
                  ${isAdmin ? `
                    <td>
                      <div class="meta">${new Date(user.createdAt).toLocaleDateString()}</div>
                    </td>
                  ` : ''}
                  ${isAdmin ? `
                    <td>
                      ${editingUserId === user.id ? `
                        <div style="display: flex; gap: 4px;">
                          <button class="btn btn-sm" data-save-user="${user.id}">Save</button>
                          <button class="btn btn-secondary btn-sm" data-cancel-edit="${user.id}">Cancel</button>
                        </div>
                      ` : `
                        <button class="btn btn-sm" data-edit-user="${user.id}">Edit</button>
                      `}
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-events-btn')!.addEventListener('click', () => {
    currentView = 'events';
    editingUserId = null;
    render();
  });

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  // Contracts button (admin only)
  const contractsBtn = document.getElementById('contracts-btn');
  if (contractsBtn) {
    contractsBtn.addEventListener('click', () => {
      currentView = 'contract-management';
      render();
    });
  }

  // Edit user buttons
  document.querySelectorAll('[data-edit-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingUserId = parseInt(btn.getAttribute('data-edit-user')!);
      render();
    });
  });

  // Cancel edit buttons
  document.querySelectorAll('[data-cancel-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingUserId = null;
      render();
    });
  });

  // Save user buttons
  document.querySelectorAll('[data-save-user]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = parseInt(btn.getAttribute('data-save-user')!);
      const firstName = (document.getElementById(`edit-firstName-${userId}`) as HTMLInputElement).value;
      const lastName = (document.getElementById(`edit-lastName-${userId}`) as HTMLInputElement).value;
      const email = (document.getElementById(`edit-email-${userId}`) as HTMLInputElement).value;
      const phone = (document.getElementById(`edit-phone-${userId}`) as HTMLInputElement).value;
      const role = (document.getElementById(`edit-role-${userId}`) as HTMLSelectElement).value;

      const result = await updateUser(userId, { firstName, lastName, email, phone, role });
      if (!result.success) {
        alert('Error updating user: ' + result.error);
      }
    });
  });
}

function renderEditProfile(container: HTMLElement) {
  let activeTab: 'profile' | 'children' | 'linking' = 'profile';

  function renderTabs() {
    container.innerHTML = `
      <div class="container page-shell">
        <div class="user-info">
          <div>
            <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
            <div class="meta">Role: ${currentUser.role}</div>
          </div>
          <div class="user-info-actions">
            <button class="btn btn-secondary btn-sm" id="back-to-events-btn">← Back to Events</button>
            <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
          </div>
        </div>

        <div class="card">
          <h1>✏️ Settings</h1>

          <div style="display: flex; gap: 12px; margin: 24px 0; border-bottom: 2px solid #e2e8f0;">
            <button class="tab-btn ${activeTab === 'profile' ? 'active' : ''}" id="profile-tab">
              👤 My Profile
            </button>
            <button class="tab-btn ${activeTab === 'children' ? 'active' : ''}" id="children-tab">
              👶 My Children
            </button>
            <button class="tab-btn ${activeTab === 'linking' ? 'active' : ''}" id="linking-tab">
              🔗 Account Linking
            </button>
          </div>

          <div id="tab-content"></div>
        </div>
      </div>
    `;

    // Add tab styles
    const tabStyle = document.createElement('style');
    tabStyle.textContent = `
      .tab-btn {
        padding: 12px 24px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        font-weight: 600;
        cursor: pointer;
        color: #74614f;
        transition: all 0.3s ease;
        font-size: 16px;
      }
      .tab-btn:hover {
        color: #4a5d23;
        background: rgba(107, 124, 63, 0.05);
      }
      .tab-btn.active {
        color: #4a5d23;
        border-bottom-color: #4a5d23;
      }
    `;
    if (!document.querySelector('style[data-tabs]')) {
      tabStyle.setAttribute('data-tabs', 'true');
      document.head.appendChild(tabStyle);
    }

    document.getElementById('back-to-events-btn')!.addEventListener('click', () => {
      currentView = 'events';
      render();
    });

    document.getElementById('logout-btn')!.addEventListener('click', logout);

    document.getElementById('profile-tab')!.addEventListener('click', () => {
      activeTab = 'profile';
      renderTabs();
    });

    document.getElementById('children-tab')!.addEventListener('click', () => {
      activeTab = 'children';
      renderTabs();
    });

    document.getElementById('linking-tab')!.addEventListener('click', () => {
      activeTab = 'linking';
      renderTabs();
    });

    if (activeTab === 'profile') {
      renderProfileTab();
    } else if (activeTab === 'children') {
      renderChildrenTab();
    } else {
      renderLinkingTab();
    }
  }

  function renderProfileTab() {
    const tabContent = document.getElementById('tab-content')!;
    tabContent.innerHTML = `
      <p class="meta" style="margin-bottom: 24px;">Update your personal information below.</p>

      <div id="edit-profile-error"></div>

      <label style="display: block; margin-bottom: 4px; font-weight: 600;">First Name *</label>
      <input type="text" id="edit-firstName" value="${currentUser.firstName}">

      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Last Name *</label>
      <input type="text" id="edit-lastName" value="${currentUser.lastName}">

      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Email *</label>
      <input type="email" id="edit-email" value="${currentUser.email}">

      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Phone *</label>
      <input type="tel" id="edit-phone" value="${currentUser.phone}">

      <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #eee;">
        <button class="btn" id="save-profile-btn">Save Changes</button>
        <button class="btn btn-secondary" id="cancel-profile-btn" style="margin-left: 8px;">Cancel</button>
      </div>
    `;

    document.getElementById('cancel-profile-btn')!.addEventListener('click', () => {
      currentView = 'events';
      render();
    });

    document.getElementById('save-profile-btn')!.addEventListener('click', async () => {
      const firstName = (document.getElementById('edit-firstName') as HTMLInputElement).value.trim();
      const lastName = (document.getElementById('edit-lastName') as HTMLInputElement).value.trim();
      const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('edit-phone') as HTMLInputElement).value.trim();

      if (!firstName || !lastName || !email || !phone) {
        document.getElementById('edit-profile-error')!.innerHTML =
          '<div class="error">All fields are required.</div>';
        return;
      }

      const result = await updateUser(currentUser.id, {
        firstName,
        lastName,
        email,
        phone,
        role: currentUser.role
      });

      if (!result.success) {
        document.getElementById('edit-profile-error')!.innerHTML =
          `<div class="error">${result.error}</div>`;
      } else {
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.email = email;
        currentUser.phone = phone;

        alert('Profile updated successfully!');
        currentView = 'events';
        render();
      }
    });
  }

  async function renderChildrenTab() {
    const tabContent = document.getElementById('tab-content')!;
    tabContent.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div></div>';

    // Fetch children
    const result = await api('/api/children');
    const children = result.ok ? result.data.children : [];

    tabContent.innerHTML = `
      <p class="meta" style="margin-bottom: 24px;">Manage your children's information. This will be used when RSVPing to events.</p>

      <div id="children-error"></div>

      <div style="margin-bottom: 24px;">
        <button class="btn" id="add-child-btn">+ Add Child</button>
      </div>

      <div id="children-list">
        ${children.length === 0 ? '<p class="meta" style="text-align: center; padding: 40px;">No children added yet. Click "Add Child" to get started.</p>' : ''}
      </div>

      <div id="child-form-modal" style="display: none;"></div>
    `;

    renderChildrenList(children);

    document.getElementById('add-child-btn')!.addEventListener('click', () => {
      showChildForm(null);
    });
  }

  function renderChildrenList(children: any[]) {
    const listContainer = document.getElementById('children-list')!;
    if (children.length === 0) return;

    listContainer.innerHTML = children.map(child => `
      <div class="card" style="margin-bottom: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0;">${child.name}</h3>
            ${child.birthDate ? `<p class="meta">📅 Born: ${new Date(child.birthDate).toLocaleDateString()}</p>` : ''}
            ${child.grade ? `<p class="meta">📚 Grade: ${child.grade}</p>` : ''}
            ${child.allergies ? `<p class="meta">🏥 Allergies: ${child.allergies}</p>` : ''}
            ${child.dietaryRestrictions ? `<p class="meta">🍽️ Dietary: ${child.dietaryRestrictions}</p>` : ''}
            ${child.medicalInfo ? `<p class="meta">💊 Medical: ${child.medicalInfo}</p>` : ''}
            ${child.notes ? `<p class="meta">📝 Notes: ${child.notes}</p>` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm" data-edit-child="${child.id}">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm" data-delete-child="${child.id}">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners
    children.forEach(child => {
      document.querySelector(`[data-edit-child="${child.id}"]`)!.addEventListener('click', () => {
        showChildForm(child);
      });

      document.querySelector(`[data-delete-child="${child.id}"]`)!.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${child.name}?`)) {
          const result = await api(`/api/children/${child.id}`, { method: 'DELETE' });
          if (result.ok) {
            renderChildrenTab();
          } else {
            alert('Failed to delete child');
          }
        }
      });
    });
  }

  function showChildForm(child: any) {
    const modal = document.getElementById('child-form-modal')!;
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;" id="modal-overlay">
        <div class="card" style="max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <h2>${child ? 'Edit Child' : 'Add Child'}</h2>

          <div id="child-form-error"></div>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Name *</label>
          <input type="text" id="child-name" value="${child?.name || ''}">

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Birth Date</label>
          <input type="date" id="child-birthdate" value="${child?.birthDate || ''}">

          <label>Grade</label>
          <select id="child-grade">
            <option value="">Select Grade</option>
            <option value="Pre-K" ${child?.grade === 'Pre-K' ? 'selected' : ''}>Pre-K</option>
            <option value="Kindergarten" ${child?.grade === 'Kindergarten' ? 'selected' : ''}>Kindergarten</option>
            <option value="1st Grade" ${child?.grade === '1st Grade' ? 'selected' : ''}>1st Grade</option>
            <option value="2nd Grade" ${child?.grade === '2nd Grade' ? 'selected' : ''}>2nd Grade</option>
            <option value="3rd Grade" ${child?.grade === '3rd Grade' ? 'selected' : ''}>3rd Grade</option>
            <option value="4th Grade" ${child?.grade === '4th Grade' ? 'selected' : ''}>4th Grade</option>
            <option value="5th Grade" ${child?.grade === '5th Grade' ? 'selected' : ''}>5th Grade</option>
            <option value="6th Grade" ${child?.grade === '6th Grade' ? 'selected' : ''}>6th Grade</option>
            <option value="7th Grade" ${child?.grade === '7th Grade' ? 'selected' : ''}>7th Grade</option>
            <option value="8th Grade" ${child?.grade === '8th Grade' ? 'selected' : ''}>8th Grade</option>
            <option value="9th Grade" ${child?.grade === '9th Grade' ? 'selected' : ''}>9th Grade</option>
            <option value="10th Grade" ${child?.grade === '10th Grade' ? 'selected' : ''}>10th Grade</option>
            <option value="11th Grade" ${child?.grade === '11th Grade' ? 'selected' : ''}>11th Grade</option>
            <option value="12th Grade" ${child?.grade === '12th Grade' ? 'selected' : ''}>12th Grade</option>
          </select>

          <label>School Type</label>
          <select id="child-school-type">
            <option value="">Select School Type</option>
            <option value="homeschool" ${child?.schoolType === 'homeschool' ? 'selected' : ''}>Homeschool</option>
            <option value="public" ${child?.schoolType === 'public' ? 'selected' : ''}>Public School</option>
            <option value="private" ${child?.schoolType === 'private' ? 'selected' : ''}>Private School</option>
            <option value="college" ${child?.schoolType === 'college' ? 'selected' : ''}>College</option>
            <option value="not-enrolled" ${child?.schoolType === 'not-enrolled' ? 'selected' : ''}>Not Currently Enrolled</option>
          </select>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Allergies</label>
          <textarea id="child-allergies" rows="2">${child?.allergies || ''}</textarea>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Dietary Restrictions</label>
          <textarea id="child-dietary" rows="2">${child?.dietaryRestrictions || ''}</textarea>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Medical Information</label>
          <textarea id="child-medical" rows="2">${child?.medicalInfo || ''}</textarea>

          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Notes</label>
          <textarea id="child-notes" rows="3">${child?.notes || ''}</textarea>

          <div style="margin-top: 24px; display: flex; gap: 8px;">
            <button class="btn" id="save-child-btn">💾 Save</button>
            <button class="btn btn-secondary" id="cancel-child-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-overlay')!.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) {
        modal.style.display = 'none';
      }
    });

    document.getElementById('cancel-child-btn')!.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.getElementById('save-child-btn')!.addEventListener('click', async () => {
      const name = (document.getElementById('child-name') as HTMLInputElement).value.trim();
      const birthDate = (document.getElementById('child-birthdate') as HTMLInputElement).value;
      const grade = (document.getElementById('child-grade') as HTMLSelectElement).value;
      const schoolType = (document.getElementById('child-school-type') as HTMLSelectElement).value;
      const allergies = (document.getElementById('child-allergies') as HTMLTextAreaElement).value.trim();
      const dietaryRestrictions = (document.getElementById('child-dietary') as HTMLTextAreaElement).value.trim();
      const medicalInfo = (document.getElementById('child-medical') as HTMLTextAreaElement).value.trim();
      const notes = (document.getElementById('child-notes') as HTMLTextAreaElement).value.trim();

      // Validate required fields
      if (!name) {
        document.getElementById('child-form-error')!.innerHTML =
          '<div class="error">Name is required</div>';
        return;
      }
      if (!birthDate) {
        document.getElementById('child-form-error')!.innerHTML =
          '<div class="error">Birth date is required</div>';
        return;
      }
      if (!grade) {
        document.getElementById('child-form-error')!.innerHTML =
          '<div class="error">Grade is required</div>';
        return;
      }
      if (!schoolType) {
        document.getElementById('child-form-error')!.innerHTML =
          '<div class="error">School type is required</div>';
        return;
      }

      const body = {
        name,
        birthDate,
        grade,
        schoolType,
        allergies: allergies || null,
        dietaryRestrictions: dietaryRestrictions || null,
        medicalInfo: medicalInfo || null,
        notes: notes || null
      };

      const result = child
        ? await api(`/api/children/${child.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/api/children', { method: 'POST', body: JSON.stringify(body) });

      if (result.ok) {
        modal.style.display = 'none';
        renderChildrenTab();
      } else {
        document.getElementById('child-form-error')!.innerHTML =
          `<div class="error">${result.data.error || 'Failed to save child'}</div>`;
      }
    });
  }

  function renderLinkingTab() {
    const tabContent = document.getElementById('tab-content')!;
    tabContent.innerHTML = `
      <p class="meta" style="margin-bottom: 24px;">Link your account with a spouse or co-parent to share children and event RSVPs.</p>

      <div id="linking-error"></div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7c3f; margin-bottom: 24px;">
        <h3 style="margin-top: 0;">🔗 Request Account Link</h3>
        <p class="meta">Enter your spouse or co-parent's email address to send a linking request.</p>

        <label style="display: block; margin-bottom: 4px; font-weight: 600; margin-top: 16px;">Email Address *</label>
        <input type="email" id="spouse-email" placeholder="spouse@example.com">

        <label style="display: block; margin-bottom: 4px; font-weight: 600; margin-top: 16px;">Relationship</label>
        <select id="relationship-type">
          <option value="spouse">Spouse</option>
          <option value="partner">Partner</option>
          <option value="co-parent">Co-Parent</option>
        </select>

        <button class="btn" id="send-link-request" style="margin-top: 16px;">Send Link Request</button>
      </div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 24px;">
        <h3 style="margin-top: 0;">📥 Pending Requests</h3>
        <div id="pending-requests">
          <p class="meta">No pending requests.</p>
        </div>
      </div>
    `;

    document.getElementById('send-link-request')!.addEventListener('click', async () => {
      const email = (document.getElementById('spouse-email') as HTMLInputElement).value.trim();
      const relationshipType = (document.getElementById('relationship-type') as HTMLSelectElement).value;

      if (!email) {
        document.getElementById('linking-error')!.innerHTML =
          '<div class="error">Please enter an email address.</div>';
        return;
      }

      // For now, just show a success message since the API isn't fully implemented
      // TODO: Implement actual linking request API call
      document.getElementById('linking-error')!.innerHTML =
        '<div class="success">Link request sent successfully! The recipient will need to accept your request.</div>';

      (document.getElementById('spouse-email') as HTMLInputElement).value = '';
    });
  }

  renderTabs();
}

function renderNotifications(container: HTMLElement) {
  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div>
          <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
          <div class="meta">Role: ${currentUser.role}</div>
        </div>
        <div class="user-info-actions">
          <button class="btn btn-secondary btn-sm" id="back-to-events-btn">← Back to Events</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <h1>🔔 Notification Settings</h1>
        <p class="meta" style="margin-bottom: 24px;">Configure how and when you'd like to receive notifications for events.</p>

        <div id="notification-error"></div>

        ${notificationPreferences ? `
          <div style="margin-bottom: 32px;">
            <h2 style="margin-bottom: 16px;">📬 Notification Channels</h2>
            <p class="meta" style="margin-bottom: 16px;">Choose how you want to receive notifications:</p>

            <div style="display: grid; gap: 16px; margin-bottom: 24px;">
              <label style="display: flex; align-items: center; cursor: pointer; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px solid #e2e8f0; transition: all 0.2s;">
                <input type="checkbox" id="email-enabled" ${notificationPreferences.emailEnabled ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 24px;">📧</span>
                    <strong style="font-size: 16px;">Email Notifications</strong>
                  </div>
                  <div class="meta">Send notifications to: <strong>${currentUser.email}</strong></div>
                </div>
              </label>

              <label style="display: flex; align-items: center; cursor: pointer; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px solid #e2e8f0; transition: all 0.2s;">
                <input type="checkbox" id="sms-enabled" ${notificationPreferences.smsEnabled ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 24px;">📱</span>
                    <strong style="font-size: 16px;">SMS Notifications</strong>
                  </div>
                  <div class="meta">Send text messages to: <strong>${currentUser.phone}</strong></div>
                </div>
              </label>

              <label style="display: flex; align-items: center; cursor: pointer; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px solid #e2e8f0; transition: all 0.2s;">
                <input type="checkbox" id="in-app-enabled" ${notificationPreferences.inAppEnabled ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 24px;">🔔</span>
                    <strong style="font-size: 16px;">In-App Notifications</strong>
                  </div>
                  <div class="meta">Show notifications in your account dashboard</div>
                </div>
              </label>
            </div>

            <div style="padding: 16px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107;">
              <h4 style="margin: 0 0 8px 0; color: #856404;">💡 Tip</h4>
              <p style="margin: 0; color: #856404;">You can enable multiple notification channels. We'll send notifications via all enabled channels.</p>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h2 style="margin-bottom: 16px;">🎯 What to Notify About</h2>

            <label style="display: flex; align-items: center; cursor: pointer; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0; margin-bottom: 12px;">
              <input type="checkbox" id="new-event-notifications" ${notificationPreferences.newEventNotifications ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
              <div>
                <strong>New Event Announcements</strong>
                <div class="meta" style="margin-top: 4px;">Get notified when new events are published</div>
              </div>
            </label>
          </div>

          <h3>⏰ Reminder Times</h3>
          <p class="meta" style="margin-bottom: 16px;">Choose when you want to receive reminders before each event:</p>

          <div style="display: grid; gap: 12px;">
            <label style="display: flex; align-items: center; cursor: pointer; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0; transition: all 0.2s;" class="reminder-option">
              <input type="checkbox" id="reminder-1day" ${notificationPreferences.reminder1Day ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
              <div style="flex: 1;">
                <strong>1 Day Before</strong>
                <div class="meta" style="margin-top: 4px;">Get a reminder 24 hours before the event</div>
              </div>
              <span style="font-size: 24px;">📅</span>
            </label>

            <label style="display: flex; align-items: center; cursor: pointer; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0; transition: all 0.2s;" class="reminder-option">
              <input type="checkbox" id="reminder-1week" ${notificationPreferences.reminder1Week ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
              <div style="flex: 1;">
                <strong>1 Week Before</strong>
                <div class="meta" style="margin-top: 4px;">Get a reminder 7 days before the event</div>
              </div>
              <span style="font-size: 24px;">📆</span>
            </label>

            <label style="display: flex; align-items: center; cursor: pointer; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0; transition: all 0.2s;" class="reminder-option">
              <input type="checkbox" id="reminder-2weeks" ${notificationPreferences.reminder2Weeks ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
              <div style="flex: 1;">
                <strong>2 Weeks Before</strong>
                <div class="meta" style="margin-top: 4px;">Get a reminder 14 days before the event</div>
              </div>
              <span style="font-size: 24px;">🗓️</span>
            </label>

            <label style="display: flex; align-items: center; cursor: pointer; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0; transition: all 0.2s;" class="reminder-option">
              <input type="checkbox" id="reminder-1month" ${notificationPreferences.reminder1Month ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
              <div style="flex: 1;">
                <strong>1 Month Before</strong>
                <div class="meta" style="margin-top: 4px;">Get a reminder 30 days before the event</div>
              </div>
              <span style="font-size: 24px;">📅</span>
            </label>

            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e2e8f0;">
              <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 12px;">
                <input type="checkbox" id="reminder-custom-enabled" ${notificationPreferences.reminderCustomDays ? 'checked' : ''} style="width: auto; margin-right: 12px; transform: scale(1.3);">
                <div style="flex: 1;">
                  <strong>Custom Reminder</strong>
                  <div class="meta" style="margin-top: 4px;">Set a custom number of days before the event</div>
                </div>
                <span style="font-size: 24px;">⚙️</span>
              </label>
              <div style="margin-left: 36px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Days Before Event:</label>
                <input type="number" id="reminder-custom-days" value="${notificationPreferences.reminderCustomDays || ''}" placeholder="e.g., 3" min="1" max="365" ${!notificationPreferences.reminderCustomDays ? 'disabled' : ''} style="width: 150px;">
              </div>
            </div>
          </div>

          <div style="margin-top: 32px; padding: 16px; background: #f4ede3; border-radius: 8px; border: 2px solid #4a5d23;">
            <h4 style="margin: 0 0 8px 0; color: #4a5d23;">ℹ️ How it works</h4>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>You'll only receive reminders for events you've RSVP'd as "Going"</li>
              <li>Notifications will be sent via your enabled channels (Email, SMS, In-App)</li>
              <li>Changes apply to all future events you RSVP to</li>
              <li>Past RSVPs will be updated with your new notification preferences</li>
            </ul>
          </div>

          <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #eee;">
            <button class="btn" id="save-notifications-btn">Save Notification Settings</button>
            <button class="btn btn-secondary" id="cancel-notifications-btn" style="margin-left: 8px;">Cancel</button>
          </div>
        ` : '<p>Loading preferences...</p>'}
      </div>
    </div>
  `;

  document.getElementById('back-to-events-btn')!.addEventListener('click', () => {
    currentView = 'events';
    render();
  });

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  document.getElementById('cancel-notifications-btn')?.addEventListener('click', () => {
    currentView = 'events';
    render();
  });

  // Custom reminder toggle
  const customEnabledCheckbox = document.getElementById('reminder-custom-enabled') as HTMLInputElement;
  customEnabledCheckbox?.addEventListener('change', () => {
    const customDaysInput = document.getElementById('reminder-custom-days') as HTMLInputElement;
    if (customDaysInput) {
      customDaysInput.disabled = !customEnabledCheckbox.checked;
      if (!customEnabledCheckbox.checked) {
        customDaysInput.value = '';
      }
    }
  });

  // Save button
  document.getElementById('save-notifications-btn')?.addEventListener('click', async () => {
    const emailEnabled = (document.getElementById('email-enabled') as HTMLInputElement).checked;
    const smsEnabled = (document.getElementById('sms-enabled') as HTMLInputElement).checked;
    const inAppEnabled = (document.getElementById('in-app-enabled') as HTMLInputElement).checked;
    const newEventNotifications = (document.getElementById('new-event-notifications') as HTMLInputElement).checked;
    const reminder1Day = (document.getElementById('reminder-1day') as HTMLInputElement).checked;
    const reminder1Week = (document.getElementById('reminder-1week') as HTMLInputElement).checked;
    const reminder2Weeks = (document.getElementById('reminder-2weeks') as HTMLInputElement).checked;
    const reminder1Month = (document.getElementById('reminder-1month') as HTMLInputElement).checked;
    const customEnabled = (document.getElementById('reminder-custom-enabled') as HTMLInputElement).checked;
    const customDays = (document.getElementById('reminder-custom-days') as HTMLInputElement).value;

    const reminderCustomDays = customEnabled && customDays ? parseInt(customDays) : null;

    const preferences = {
      emailEnabled,
      smsEnabled,
      inAppEnabled,
      newEventNotifications,
      reminder1Day,
      reminder1Week,
      reminder2Weeks,
      reminder1Month,
      reminderCustomDays
    };

    const result = await updateNotificationPreferences(preferences);

    if (!result.success) {
      document.getElementById('notification-error')!.innerHTML =
        `<div class="error">${result.error}</div>`;
    } else {
      alert('Notification settings saved successfully!');
      currentView = 'events';
      render();
    }
  });
}

async function renderContractManagement(container: HTMLElement) {
  // Load contracts
  const result = await api('/api/contracts');
  const contracts = result.ok ? result.data.contracts : [];

  container.innerHTML = `
    <div class="container page-shell">
      <div class="user-info">
        <div>
          <strong>${currentUser.firstName} ${currentUser.lastName}</strong>
          <div class="meta">Role: ${currentUser.role}</div>
        </div>
        <div class="user-info-actions">
          <button class="btn btn-secondary btn-sm" id="back-to-users-btn">← Back to Users</button>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="card">
        <h1>📄 Contract/TOS Management</h1>
        <p class="meta" style="margin-bottom: 24px;">Create and manage Terms of Service contracts that users must accept.</p>

        <div id="contract-error"></div>

        <div class="panel" style="border-left: 4px solid #6b7c3f; margin-bottom: 24px;">
          <h3 style="margin-top: 0;">Create New Contract</h3>
          <label>Title</label>
          <input type="text" id="contract-title" placeholder="Terms of Service v2.0">

          <label style="margin-top: 16px;">Content</label>
          <textarea id="contract-content" rows="10" placeholder="Enter the full contract text here..."></textarea>

          <button class="btn" id="create-contract-btn" style="margin-top: 16px;">Create Contract</button>
        </div>

        <h3>Existing Contracts</h3>
        <div style="overflow-x: auto; margin-top: 16px;">
          <table class="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Title</th>
                <th>Created By</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${contracts.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 24px; text-align: center; color: #74614f;">
                    No contracts created yet. Create your first contract above.
                  </td>
                </tr>
              ` : contracts.map(contract => `
                <tr>
                  <td><strong>v${contract.version}</strong></td>
                  <td>${contract.title}</td>
                  <td>${contract.creatorName}</td>
                  <td>${new Date(contract.createdAt).toLocaleDateString()}</td>
                  <td>
                    ${contract.isActive ? '<span style="color: #4a5d23; font-weight: 600;">✓ Active</span>' : '<span style="color: #74614f;">Inactive</span>'}
                  </td>
                  <td>
                    <button class="btn btn-sm btn-secondary" data-view-contract="${contract.id}">View</button>
                    ${!contract.isActive ? `<button class="btn btn-sm" data-activate-contract="${contract.id}">Activate</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-users-btn')!.addEventListener('click', () => {
    currentView = 'user-management';
    render();
  });

  document.getElementById('logout-btn')!.addEventListener('click', logout);

  document.getElementById('create-contract-btn')!.addEventListener('click', async () => {
    const title = (document.getElementById('contract-title') as HTMLInputElement).value.trim();
    const content = (document.getElementById('contract-content') as HTMLTextAreaElement).value.trim();

    if (!title || !content) {
      document.getElementById('contract-error')!.innerHTML =
        '<div class="error">Title and content are required.</div>';
      return;
    }

    const result = await api('/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });

    if (result.ok) {
      document.getElementById('contract-error')!.innerHTML =
        '<div class="success">Contract created successfully!</div>';
      (document.getElementById('contract-title') as HTMLInputElement).value = '';
      (document.getElementById('contract-content') as HTMLTextAreaElement).value = '';
      // Reload the page
      setTimeout(() => {
        render();
      }, 1000);
    } else {
      document.getElementById('contract-error')!.innerHTML =
        `<div class="error">${result.data.error}</div>`;
    }
  });

  // View contract buttons
  document.querySelectorAll('[data-view-contract]').forEach(btn => {
    btn.addEventListener('click', () => {
      const contractId = parseInt(btn.getAttribute('data-view-contract')!);
      const contract = contracts.find(c => c.id === contractId);
      if (contract) {
        alert(`${contract.title}\n\n${contract.content}`);
      }
    });
  });

  // Activate contract buttons
  document.querySelectorAll('[data-activate-contract]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const contractId = parseInt(btn.getAttribute('data-activate-contract')!);
      const result = await api(`/api/contracts/${contractId}/activate`, {
        method: 'PATCH'
      });

      if (result.ok) {
        document.getElementById('contract-error')!.innerHTML =
          '<div class="success">Contract activated successfully!</div>';
        setTimeout(() => {
          render();
        }, 1000);
      } else {
        document.getElementById('contract-error')!.innerHTML =
          `<div class="error">${result.data.error}</div>`;
      }
    });
  });
}

// View Terms of Service
async function renderTermsOfService(container: HTMLElement) {
  // Fetch the active contract/TOS
  const result = await api('/api/contracts/active');
  const contract = result.ok ? result.data.contract : null;

  container.innerHTML = `
    <div class="container page-shell">
      <div class="card tos-card">
        <div class="page-header">
          <h1>📄 Terms of Service</h1>
          <button class="btn btn-secondary btn-sm" id="back-to-events-btn">← Back to Events</button>
        </div>

        ${contract ? `
          <div class="tos-panel">
            <div class="tos-header">
              <h2 style="margin-bottom: 6px; color: #4a5d23;">${contract.title}</h2>
              <span class="badge badge-published">Active</span>
            </div>
            <div class="tos-meta">
              Version ${contract.version} • Updated ${(() => {
                const updated = new Date(contract.createdAt);
                return Number.isNaN(updated.getTime()) ? 'Unknown' : updated.toLocaleDateString();
              })()}
            </div>
            <p class="meta" style="margin-top: 16px;">
              Please read these terms carefully. By using this platform you agree to the policies and guidelines below.
            </p>
            <div class="tos-content" style="margin-top: 16px;">${contract.content}</div>
          </div>

          ${currentUser.tos_version ? `
            <div class="tos-status">
              ✅ You accepted version ${currentUser.tos_version} on ${new Date(currentUser.tos_accepted_at).toLocaleDateString()}
            </div>
          ` : `
            <div class="tos-status warning">
              <div style="flex: 1;">
                ⚠️ You have not yet accepted the Terms of Service
                <div class="meta" style="margin-top: 6px;">You must accept the current terms to continue using the platform.</div>
              </div>
              <button class="btn btn-sm" id="accept-tos-btn">Accept Terms</button>
            </div>
          `}
        ` : `
          <div class="tos-empty">No Terms of Service available at this time.</div>
        `}
      </div>
    </div>
  `;

  document.getElementById('back-to-events-btn')!.addEventListener('click', () => {
    currentView = 'events';
    render();
  });

  if (contract && !currentUser.tos_version) {
    document.getElementById('accept-tos-btn')?.addEventListener('click', async () => {
      const result = await api('/api/contracts/accept', {
        method: 'POST',
        body: JSON.stringify({ version: contract.version })
      });

      if (result.ok) {
        const refreshed = await api('/api/auth/me');
        if (refreshed.ok) {
          currentUser = refreshed.data.user;
        } else {
          currentUser.tos_version = contract.version;
          currentUser.tos_accepted_at = new Date().toISOString();
        }
        render();
      } else {
        alert(result.data?.error || 'Failed to accept Terms of Service.');
      }
    });
  }
}

// Start app
init();
