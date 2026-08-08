const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navLinks?.classList.toggle('open', !expanded);
});

document.querySelectorAll('.nav-links a, .nav-links button').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navLinks?.classList.remove('open');
  });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll('main section[id], footer[id]')];
const navigation = [...document.querySelectorAll('.nav-links a[href^="#"]')];

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navigation.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
  });
}, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.2, 0.5] });

sections.forEach((section) => sectionObserver.observe(section));


// Booking modal + Calendar/Gmail handoff
const bookingModal = document.querySelector('#booking-modal');
const bookingForm = document.querySelector('#booking-form');
const bookingName = document.querySelector('#booking-name');
const bookingEmail = document.querySelector('#booking-email');
const bookingDate = document.querySelector('#booking-date');
const bookingTime = document.querySelector('#booking-time');
const bookingDuration = document.querySelector('#booking-duration');
const bookingMessage = document.querySelector('#booking-message');
const gmailTrigger = document.querySelector('.gmail-trigger');
let lastFocusedElement = null;

const pad2 = (value) => String(value).padStart(2, '0');

const todayInManila = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
};

if (bookingDate) bookingDate.min = todayInManila();

function openBooking() {
  if (!bookingModal) return;
  lastFocusedElement = document.activeElement;
  bookingModal.classList.add('open');
  bookingModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => bookingName?.focus(), 30);
}

function closeBooking() {
  if (!bookingModal) return;
  bookingModal.classList.remove('open');
  bookingModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  lastFocusedElement?.focus?.();
}

document.querySelectorAll('.book-call-trigger').forEach((button) => {
  button.addEventListener('click', openBooking);
});

document.querySelectorAll('[data-close-booking]').forEach((element) => {
  element.addEventListener('click', closeBooking);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && bookingModal?.classList.contains('open')) closeBooking();
});

function getBookingDetails() {
  return {
    name: bookingName?.value.trim() || '',
    email: bookingEmail?.value.trim() || '',
    date: bookingDate?.value || '',
    time: bookingTime?.value || '',
    duration: Number(bookingDuration?.value || 30),
    message: bookingMessage?.value.trim() || ''
  };
}

function makeCalendarDate(date, time, offsetMinutes = 0) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day, hour, minute));
  base.setUTCMinutes(base.getUTCMinutes() + offsetMinutes);
  return `${base.getUTCFullYear()}${pad2(base.getUTCMonth() + 1)}${pad2(base.getUTCDate())}T${pad2(base.getUTCHours())}${pad2(base.getUTCMinutes())}00`;
}

bookingForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;
  const details = getBookingDetails();
  const start = makeCalendarDate(details.date, details.time);
  const end = makeCalendarDate(details.date, details.time, details.duration);
  const description = [
    `Requested by: ${details.name}`,
    `Email: ${details.email}`,
    details.message ? `Discussion: ${details.message}` : '',
    '',
    'Portfolio booking request for Renato Jr. Ravanes.'
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Discovery Call — ${details.name} + Renato Jr. Ravanes`,
    dates: `${start}/${end}`,
    ctz: 'Asia/Manila',
    details: description,
    add: 'renatojrravanes@gmail.com'
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener');
});

gmailTrigger?.addEventListener('click', () => {
  const details = getBookingDetails();
  const subject = details.name ? `Call request from ${details.name}` : 'Portfolio call request';
  const body = [
    'Hi Renato,',
    '',
    'I would like to connect regarding a possible opportunity.',
    details.name ? `Name: ${details.name}` : '',
    details.email ? `Email: ${details.email}` : '',
    details.date ? `Preferred date: ${details.date}` : '',
    details.time ? `Preferred time: ${details.time} (GMT+8 / Philippine Time)` : '',
    details.duration ? `Preferred call length: ${details.duration} minutes` : '',
    details.message ? `Message: ${details.message}` : '',
    '',
    'Thank you.'
  ].filter(Boolean).join('\n');
  const gmail = new URL('https://mail.google.com/mail/');
  gmail.searchParams.set('view', 'cm');
  gmail.searchParams.set('fs', '1');
  gmail.searchParams.set('to', 'renatojrravanes@gmail.com');
  gmail.searchParams.set('su', subject);
  gmail.searchParams.set('body', body);
  window.open(gmail.toString(), '_blank', 'noopener');
});

// Subtle neon cursor aura for desktop/fine-pointer devices.
// The normal cursor stays visible; this only adds a soft trailing glow.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (finePointer && !reducedMotion) {
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  cursorGlow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursorGlow);

  let targetX = -200;
  let targetY = -200;
  let currentX = -200;
  let currentY = -200;
  let animationFrame = null;

  const renderGlow = () => {
    currentX += (targetX - currentX) * 0.22;
    currentY += (targetY - currentY) * 0.22;
    cursorGlow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    animationFrame = requestAnimationFrame(renderGlow);
  };

  document.addEventListener('mousemove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursorGlow.classList.add('visible');
    if (!animationFrame) animationFrame = requestAnimationFrame(renderGlow);
  }, { passive: true });

  document.addEventListener('mouseover', (event) => {
    const interactive = event.target.closest(
      'a, button, input, select, textarea, video, .service-card, .cert-card, .feedback-card, .skill-column, .education-grid article, .capability-grid article, .info-panel, .portrait-card, .terminal'
    );
    cursorGlow.classList.toggle('hot', Boolean(interactive));
  });

  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) {
      cursorGlow.classList.remove('visible', 'hot');
    }
  });

  window.addEventListener('blur', () => {
    cursorGlow.classList.remove('visible', 'hot');
  });
}
