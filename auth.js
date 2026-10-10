// auth.js
// Configuration
// 1. Log in to your Clerk Dashboard: https://dashboard.clerk.com
// 2. Select your application.
// 3. Go to "API Keys" in the sidebar.
// 4. Copy the "Publishable Key" (it starts with pk_test_ for development)
// 5. Paste it here, replacing the placeholder.
const CLERK_PUBLISHABLE_KEY = 'pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE';

async function initClerk() {
  if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE') {
    console.error('Clerk Publishable Key is missing! Please configure it in auth.js.');
    const authActions = document.getElementById('auth-actions');
    if (authActions) authActions.style.display = 'flex';
    return; // Stop initialization because SDK will crash without a valid key
  }

  const script = document.createElement('script');
  // Loading the latest official SDK version as per Clerk documentation
  script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
  script.setAttribute('data-clerk-publishable-key', CLERK_PUBLISHABLE_KEY);
  script.crossOrigin = 'anonymous';
  
  script.onload = async () => {
    try {
      await window.Clerk.load();
      updateNavigation();
      mountClerkComponents();
    } catch (err) {
      console.error('Error initializing Clerk: ', err);
      // Fallback: show the buttons even if Clerk fails to load properly
      const authActions = document.getElementById('auth-actions');
      if (authActions) authActions.style.display = 'flex';
    }
  };
  document.body.appendChild(script);
}

function updateNavigation() {
  const authActions = document.getElementById('auth-actions');
  const userButtonMount = document.getElementById('user-button-mount');
  const isDashboard = window.location.pathname.includes('dashboard.html');
  const isAuthPage = window.location.pathname.includes('sign-in.html') || window.location.pathname.includes('sign-up.html');

  if (window.Clerk.user) {
    // === SIGNED IN STATE ===
    if (authActions) authActions.style.display = 'none';
    
    if (userButtonMount && !userButtonMount.hasChildNodes()) {
      // Create a container for signed-in actions
      const signedInContainer = document.createElement('div');
      signedInContainer.style.display = 'flex';
      signedInContainer.style.alignItems = 'center';
      signedInContainer.style.gap = '16px';
      
      // Add Dashboard link if not already on dashboard
      if (!isDashboard) {
        const dashboardLink = document.createElement('a');
        dashboardLink.href = 'dashboard.html';
        dashboardLink.className = 'btn btn--ghost';
        dashboardLink.textContent = 'Dashboard';
        signedInContainer.appendChild(dashboardLink);
      }
      
      // Mount UserButton
      const userButtonDiv = document.createElement('div');
      signedInContainer.appendChild(userButtonDiv);
      userButtonMount.appendChild(signedInContainer);
      
      window.Clerk.mountUserButton(userButtonDiv, {
        afterSignOutUrl: window.location.pathname
      });
    }

    // Redirect signed-in users away from auth pages
    if (isAuthPage) {
      window.location.href = 'dashboard.html';
    }
  } else {
    // === SIGNED OUT STATE ===
    if (isDashboard) {
      window.location.href = 'sign-in.html';
    }
    if (authActions) authActions.style.display = 'flex'; // show login/signup
  }
}

function mountClerkComponents() {
  const signInDiv = document.getElementById('sign-in-app');
  if (signInDiv) {
    window.Clerk.mountSignIn(signInDiv, { 
      routing: 'hash', 
      signUpUrl: 'sign-up.html',
      forceRedirectUrl: 'dashboard.html'
    });
  }
  
  const signUpDiv = document.getElementById('sign-up-app');
  if (signUpDiv) {
    window.Clerk.mountSignUp(signUpDiv, { 
      routing: 'hash', 
      signInUrl: 'sign-in.html',
      forceRedirectUrl: 'dashboard.html'
    });
  }
}

initClerk();
