/* ================= STEP-BY-STEP SIGN UP =================
   1) enter email -> [Verify email] -> confirm the code we email
   2) set a password (min 6 characters)       -> account is created and login is enabled
   Nothing becomes a logged-in session until step 2 succeeds (tokens live only in memory here),
   so closing the page half-way never leaves a usable or half-made account.
   Needs: email OTP template with {{ .Token }} and SMTP set in Supabase. See SETUP_GUIDE.md. */
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const W = { step: 1, busy: false, email: '', name: '', tok: '', refresh: '', emailOk: false, timers: {} };

    function msg(t, bad) { if (typeof setGateMsg === 'function') setGateMsg(t, bad); }
    function friendly(e, fallback) {
        if (!e) return fallback;
        if (e.offline) return 'No internet connection.';
        return e.message || fallback;
    }
    function cooldown(btnId, sec) {
        const b = $(btnId); if (!b) return;
        clearInterval(W.timers[btnId]);
        if (sec <= 0) { b.disabled = false; b.textContent = 'Resend code'; return; }
        b.disabled = true; b.textContent = 'Resend in ' + sec + 's';
        W.timers[btnId] = setInterval(() => { sec--; if (sec <= 0) { clearInterval(W.timers[btnId]); b.disabled = false; b.textContent = 'Resend code'; } else b.textContent = 'Resend in ' + sec + 's'; }, 1000);
    }
    function show(step) {
        W.step = step;
        for (let i = 1; i <= 2; i++) {
            $('swPane' + i).style.display = i === step ? 'block' : 'none';
            const d = $('swDot' + i); d.classList.toggle('active', i === step); d.classList.toggle('done', i < step);
        }
        msg('');
    }
    function reset() {
        Object.keys(W.timers).forEach(k => clearInterval(W.timers[k]));
        Object.assign(W, { step: 1, busy: false, email: '', name: '', tok: '', refresh: '', emailOk: false });
        ['swName', 'swEmail', 'swEmailCode', 'swPass', 'swPass2'].forEach(id => { const el = $(id); if (el) { el.value = ''; el.disabled = false; } });
        $('swEmailCodeBox').style.display = 'none';
        $('swEmailBtn').disabled = false; $('swCreateBtn').disabled = false;
        $('swEmailBtn').textContent = 'Verify email';
        show(1);
    }

    // ---------- STEP 1: email ----------
    window.swSendEmail = async function (isResend) {
        if (W.busy) return;
        const email = (isResend ? W.email : ($('swEmail').value || '')).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return msg('Please enter a valid email address.', true);
        if (typeof CLOUD_ON === 'undefined' || !CLOUD_ON) return msg('Sign up needs an internet connection so we can verify your email.', true);
        W.busy = true; msg('Sending code...');
        try {
            if (!isResend) { const dup = await signupCheck(email, ''); if (dup) return msg(dup, true); }
            await cloudFetch('/auth/v1/otp', { method: 'POST', body: { email, create_user: true }, token: false });
            W.email = email; W.name = ($('swName').value || '').trim();
            $('swEmail').disabled = true; $('swName').disabled = true; $('swEmailBtn').textContent = 'Code sent';
            $('swEmailBtn').disabled = true;
            const hint = $('swEmailHint'); hint.textContent = 'We emailed a code to '; const b = document.createElement('b'); b.textContent = email; hint.appendChild(b); hint.appendChild(document.createTextNode('. Check your inbox and spam.'));
            $('swEmailCodeBox').style.display = 'block'; setTimeout(() => $('swEmailCode').focus(), 60);
            cooldown('swEmailResend', 45); msg('Verification code sent.');
        } catch (e) { msg(friendly(e, 'Could not send the code. Try again.'), true); }
        finally { W.busy = false; }
    };
    window.swConfirmEmail = async function () {
        if (W.busy) return;
        const code = ($('swEmailCode').value || '').replace(/\D/g, '');
        if (code.length < 6) return msg('Enter the code from your email.', true);
        W.busy = true; msg('Checking...');
        try {
            const r = await cloudFetch('/auth/v1/verify', { method: 'POST', body: { type: 'email', email: W.email, token: code }, token: false });
            if (!(r && r.access_token)) throw { message: 'Could not verify. Please try again.' };
            W.tok = r.access_token; W.refresh = r.refresh_token || ''; W.emailOk = true;
            $('swEmailOk').textContent = '\u2713 Email verified: ' + W.email;
            show(2); setTimeout(() => $('swPass').focus(), 60);
        } catch (e) { msg(friendly(e, 'Wrong code. Try again.'), true); }
        finally { W.busy = false; }
    };

    // ---------- STEP 2: password -> create account ----------
    window.swCreate = async function () {
        if (W.busy) return;
        if (!W.emailOk) return msg('Verify your email first.', true);
        const p1 = $('swPass').value || '', p2 = $('swPass2').value || '';
        const issues = passwordIssues(p1); if (issues.length) return msg(issues.join(' '), true);
        if (p1 !== p2) return msg('The two passwords do not match.', true);
        W.busy = true; $('swCreateBtn').disabled = true; msg('Creating your account...');
        try {
            const name = W.name || W.email.split('@')[0];
            const u = await cloudFetch('/auth/v1/user', { method: 'PUT', body: { password: p1, data: { full_name: name, signup_complete: true } }, token: W.tok });
            // account exists and email is verified: only now do we create the login session
            cloudSetSession({ access_token: W.tok, refresh_token: W.refresh, expires_in: 3600, user: { id: u.id, email: u.email || W.email, user_metadata: { full_name: name } } });
            const em = W.email, accs = cloudLS.get('quantumLocalAccounts', {});
            const passHash = await hashPin(em + '::' + p1);
            accs[em] = { email: em, name, phone: '', passHash, createdAt: Date.now(), verified: true };
            cloudLS.set('quantumLocalAccounts', accs);
            cloudLS.set('quantumActiveSession', { email: em, name, phone: '', loginAt: Date.now() });
            const done = W.email; reset();
            enforceAuthGate(); renderAccountPanel();
            notify({ type: 'success', title: 'Account created', message: 'Welcome to ARISE CORE, ' + done });
            cloud.lastOk = 0; await cloudBootstrap(); await cloudSync(true);
        } catch (e) { $('swCreateBtn').disabled = false; msg(friendly(e, 'Could not create the account. Try again.'), true); }
        finally { W.busy = false; }
    };

    // reset the wizard whenever the gate switches mode, so stale verification never carries over
    const _set = window.setGateMode;
    if (typeof _set === 'function') {
        window.setGateMode = function (m) {
            const r = _set.apply(this, arguments);
            if (m !== 'signup' && (W.emailOk || W.tok)) reset();
            return r;
        };
    }
    // legacy single-form sign up can no longer be used
    const _submit = window.submitGateAuth;
    if (typeof _submit === 'function') window.submitGateAuth = function () { if (typeof gateMode !== 'undefined' && gateMode === 'signup') return; return _submit.apply(this, arguments); };
    window.addEventListener('load', () => { try { if ($('swWizard')) show(1); } catch (e) {} });
})();
