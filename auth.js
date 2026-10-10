// auth.js
// Configuration
// 1. Log in to your Clerk Dashboard: https://dashboard.clerk.com
// 2. Go to "API Keys".
// 3. Find your Publishable Key.
// 4. Replace the placeholder below.
const CLERK_PUBLISHABLE_KEY = 'pk_test_cHJlcGFyZWQtbXVza294LTEzNTMuY2xlcmsuYWNjb3VudHMuZGV2JA';
const CLERK_FRONTEND_API_URL = 'https://prepared-muskox-1353.clerk.accounts.dev';

// The script paths as derived from your provided Frontend API URL
const CLERK_UI_SCRIPT_URL = `${CLERK_FRONTEND_API_URL}/npm/@clerk/ui@1/dist/ui.browser.js`;
const CLERK_CORE_SCRIPT_URL = `${CLERK_FRONTEND_API_URL}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`;

async function loadScript(src, attributes = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    for (const [key, value] of Object.entries(attributes)) {
      script.setAttribute(key, value);
    }
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

async function initClerk() {
  if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE') {
    console.error('Clerk Publishable Key is missing! Live authentication testing is blocked.');
    showFallbackButtons();
    return;
  }

  try {
    // Load the Clerk UI bundle FIRST as per the new official Javascript Quickstart
    await loadScript(CLERK_UI_SCRIPT_URL, {
      'defer': 'true',
      'type': 'text/javascript'
    });
    
    // Load the Clerk core JS SDK NEXT
    await loadScript(CLERK_CORE_SCRIPT_URL, {
      'data-clerk-publishable-key': CLERK_PUBLISHABLE_KEY,
      'defer': 'true',
      'type': 'text/javascript'
    });

    // Initialize Clerk using the documented UI configuration
    await window.Clerk.load({
      ui: {
        ClerkUI: window.__internal_ClerkUICtor
      }
    });

    updateNavigation();
    mountClerkComponents();
  } catch (err) {
    console.error('Error initializing Clerk: ', err);
    showFallbackButtons();
  }
}

function showFallbackButtons() {
  const authActions = document.getElementById('auth-actions');
  if (authActions) authActions.style.display = 'flex';
}

function updateNavigation() {
  const authActions = document.getElementById('auth-actions');
  const userButtonMount = document.getElementById('user-button-mount');
  const isDashboard = window.location.pathname.includes('dashboard.html');
  const isAuthPage = window.location.pathname.includes('sign-in.html') || window.location.pathname.includes('sign-up.html');

  if (window.Clerk && window.Clerk.user) {
    // === SIGNED IN STATE ===
    if (authActions) authActions.style.display = 'none';
    
    if (userButtonMount && !userButtonMount.hasChildNodes()) {
      const signedInContainer = document.createElement('div');
      signedInContainer.style.display = 'flex';
      signedInContainer.style.alignItems = 'center';
      signedInContainer.style.gap = '16px';
      
      if (!isDashboard) {
        const dashboardLink = document.createElement('a');
        dashboardLink.href = 'dashboard.html';
        dashboardLink.className = 'btn btn--ghost';
        dashboardLink.textContent = 'Dashboard';
        signedInContainer.appendChild(dashboardLink);
      }
      
      const userButtonDiv = document.createElement('div');
      signedInContainer.appendChild(userButtonDiv);
      userButtonMount.appendChild(signedInContainer);
      
      window.Clerk.mountUserButton(userButtonDiv, {
        afterSignOutUrl: window.location.pathname
      });
    }

    if (isAuthPage) {
      window.location.href = 'dashboard.html';
    }
  } else {
    // === SIGNED OUT STATE ===
    if (isDashboard) {
      window.location.href = 'sign-in.html';
    }
    showFallbackButtons();
  }
}

function mountClerkComponents() {
  const signInDiv = document.getElementById('sign-in-app');
  if (signInDiv && window.Clerk) {
    window.Clerk.mountSignIn(signInDiv, { 
      routing: 'hash', 
      signUpUrl: 'sign-up.html',
      forceRedirectUrl: 'dashboard.html'
    });
  }
  
  const signUpDiv = document.getElementById('sign-up-app');
  if (signUpDiv && window.Clerk) {
    window.Clerk.mountSignUp(signUpDiv, { 
      routing: 'hash', 
      signInUrl: 'sign-in.html',
      forceRedirectUrl: 'dashboard.html'
    });
  }
}

initClerk();
