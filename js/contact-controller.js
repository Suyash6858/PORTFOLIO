/**
 * NEXUS // OS — Command Center Contact Controller
 * Handles front-end validation, mailto dispatch protocol,
 * error state rendering, and direct channel interactions.
 */

(function () {
  'use strict';

  function initContactController() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const subjectInput = document.getElementById('contact-subject');
    const messageInput = document.getElementById('contact-message');

    const errorBox = document.getElementById('contact-error-box');
    const errorText = document.getElementById('contact-error-text');
    const statusBox = document.getElementById('contact-status-box');
    const copyEmailBtn = document.getElementById('contact-copy-email-btn');
    const copyEmailChip = document.getElementById('contact-copy-chip');

    // Email validation regex (RFC 5322 compliant simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function clearErrors() {
      if (errorBox) {
        errorBox.classList.remove('visible');
      }
      [nameInput, emailInput, subjectInput, messageInput].forEach(function (input) {
        if (input) {
          input.classList.remove('input-error');
        }
      });
    }

    function showError(message, inputElement) {
      clearErrors();
      if (inputElement) {
        inputElement.classList.add('input-error');
        inputElement.focus();
      }
      if (errorBox && errorText) {
        errorText.textContent = message;
        errorBox.classList.add('visible');
      }
      if (statusBox) {
        statusBox.classList.remove('visible');
      }
    }

    // Live validation error removal on typing
    [nameInput, emailInput, subjectInput, messageInput].forEach(function (input) {
      if (input) {
        input.addEventListener('input', function () {
          if (input.classList.contains('input-error')) {
            input.classList.remove('input-error');
          }
          if (errorBox && errorBox.classList.contains('visible')) {
            errorBox.classList.remove('visible');
          }
        });
      }
    });

    // Form Submission Handler
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const subject = subjectInput ? subjectInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      // Validation Steps
      if (!name) {
        showError('Please enter your full name before transmission.', nameInput);
        return;
      }
      if (name.length < 2) {
        showError('Name must be at least 2 characters long.', nameInput);
        return;
      }

      if (!email) {
        showError('Please enter a valid email address for correspondence.', emailInput);
        return;
      }
      if (!emailRegex.test(email)) {
        showError('Invalid email format. Please enter a valid address (e.g. name@domain.com).', emailInput);
        return;
      }

      if (!subject) {
        showError('Please provide a subject line for your message.', subjectInput);
        return;
      }
      if (subject.length < 3) {
        showError('Subject line must be at least 3 characters long.', subjectInput);
        return;
      }

      if (!message) {
        showError('Please enter your message content.', messageInput);
        return;
      }
      if (message.length < 10) {
        showError('Message content is too brief. Please enter at least 10 characters.', messageInput);
        return;
      }

      // Valid: clear previous errors
      clearErrors();

      // Construct mailto link
      const targetEmail = 'suyash4284@gmail.com';
      const formattedSubject = `[PORTFOLIO CONTACT] ${subject}`;
      const formattedBody = `From: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nTransmitted via SUYASH AG. Portfolio Command Center`;

      const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(formattedSubject)}&body=${encodeURIComponent(formattedBody)}`;

      // Show transparent dispatch notification indicating mail client trigger
      if (statusBox) {
        statusBox.classList.add('visible');
        statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Trigger mail client
      try {
        window.location.href = mailtoUrl;
      } catch (err) {
        console.warn('Mailto link navigation trigger error:', err);
      }
    });

    // Copy Email to Clipboard helper
    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const emailAddress = 'suyash4284@gmail.com';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(emailAddress).then(function () {
            if (copyEmailChip) {
              const originalText = copyEmailChip.textContent;
              copyEmailChip.textContent = 'COPIED!';
              copyEmailChip.style.color = 'var(--cyan-bright)';
              copyEmailChip.style.borderColor = 'var(--cyan-primary)';
              setTimeout(function () {
                copyEmailChip.textContent = originalText;
                copyEmailChip.style.color = '';
                copyEmailChip.style.borderColor = '';
              }, 2200);
            }
          }).catch(function () {
            fallbackCopyText(emailAddress);
          });
        } else {
          fallbackCopyText(emailAddress);
        }
      });
    }

    function fallbackCopyText(text) {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = text;
      tempTextArea.style.position = 'fixed';
      tempTextArea.style.left = '-9999px';
      document.body.appendChild(tempTextArea);
      tempTextArea.focus();
      tempTextArea.select();
      try {
        document.execCommand('copy');
        if (copyEmailChip) {
          const originalText = copyEmailChip.textContent;
          copyEmailChip.textContent = 'COPIED!';
          setTimeout(function () {
            copyEmailChip.textContent = originalText;
          }, 2200);
        }
      } catch (err) {
        console.error('Fallback clipboard copy failed', err);
      }
      document.body.removeChild(tempTextArea);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactController);
  } else {
    initContactController();
  }
})();
