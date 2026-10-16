'use strict';
// Content remains visible when JavaScript is disabled or unsupported.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: .08});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  const steps = [...document.querySelectorAll('.week')];
  const links = [...document.querySelectorAll('[data-week]')];
  const updateStep = () => {
    const current = steps.reduce((last, section) => section.getBoundingClientRect().top < innerHeight * .48 ? section : last, steps[0]);
    links.forEach(link => {
      const active = link.hash === '#' + current.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  };
  let scheduled = false;
  addEventListener('scroll', () => {
    if (!scheduled) requestAnimationFrame(() => {updateStep(); scheduled = false;});
    scheduled = true;
  }, {passive: true});
  updateStep();
}
const toggle = document.querySelector('#motion-toggle');
toggle.addEventListener('click', () => {
  const paused = document.body.classList.toggle('paused');
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.textContent = paused ? 'Продолжить анимацию ▶' : 'Остановить анимацию Ⅱ';
});
const leadForm = document.querySelector('.brief-form');
let pendingLead = null;
addEventListener('message', event => {
  const trusted = /^https:\/\/([a-z0-9-]+\.)?(script\.google\.com|script\.googleusercontent\.com)$/.test(event.origin);
  const result = event.data;
  if (!trusted || !pendingLead || !result || result.type !== 'apex-lead-result' || result.requestId !== pendingLead.id) return;
  clearTimeout(pendingLead.timer);
  pendingLead.button.disabled = false;
  pendingLead.button.textContent = 'Отправить заявку ↗';
  document.querySelector('#form-status').textContent = result.ok ? 'Заявка сохранена. Мы свяжемся с вами.' : 'Не удалось сохранить заявку. Попробуйте ещё раз.';
  if (result.ok) leadForm.reset();
  pendingLead.frame.remove(); pendingLead = null;
});
leadForm.addEventListener('submit', event => {
  event.preventDefault();
  const endpoint = window.APEX_CONFIG && window.APEX_CONFIG.sheetsEndpoint;
  const status = document.querySelector('#form-status');
  if (!endpoint) {
    status.textContent = 'Приём заявок ещё подключается. Пожалуйста, попробуйте позже.';
    return;
  }
  if (pendingLead) return;
  const data = new FormData(leadForm);
  const id = crypto.randomUUID();
  const frame = document.createElement('iframe');
  frame.name = 'apex-lead-' + id; frame.hidden = true; frame.title = 'Отправка заявки';
  document.body.append(frame);
  const post = document.createElement('form');
  post.method = 'POST'; post.action = endpoint; post.target = frame.name; post.hidden = true;
  const values = {name: data.get('name'), phone: data.get('phone'), consent: data.get('consent') ? 'yes' : '', website: data.get('website') || '', requestId: id, origin: location.origin};
  Object.entries(values).forEach(([name, value]) => {const input = document.createElement('input'); input.name = name; input.value = value; post.append(input);});
  document.body.append(post);
  const button = leadForm.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Отправляем…'; status.textContent = '';
  const timer = setTimeout(() => {
    if (!pendingLead || pendingLead.id !== id) return;
    button.disabled = false; button.textContent = 'Отправить заявку ↗';
    status.textContent = 'Нет подтверждения от сервера. Заявка могла сохраниться. Проверьте соединение и попробуйте позже.';
    frame.remove(); pendingLead = null;
  }, 30000);
  pendingLead = {id, frame, button, timer};
  post.submit(); post.remove();
});

// Make each CTA land at the form, below the fixed header, rather than the
// beginning of the tall closing section. Reveal before scrolling and focus
// without moving the viewport a second time.
document.querySelectorAll('a[href="#signup"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const form = document.querySelector('.brief-form');
    form.classList.add('visible', 'is-destination');
    const headerHeight = document.querySelector('.nav').getBoundingClientRect().height;
    const top = Math.max(0, scrollY + form.getBoundingClientRect().top - headerHeight - 24);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({top, behavior: reduced ? 'instant' : 'smooth'});
    history.replaceState(null, '', '#signup');
    form.querySelector('input').focus({preventScroll: true});
    setTimeout(() => form.classList.remove('is-destination'), 2400);
  });
});

const heroArt = document.querySelector('.hero-art');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => canHover.matches && !prefersReduced.matches && !document.body.classList.contains('paused');
heroArt.querySelectorAll('.floating').forEach(card => {
  card.addEventListener('pointerenter', () => {
    if (!motionAllowed()) return;
    const x = (heroArt.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2) * .45;
    const y = (heroArt.clientHeight / 2 - card.offsetTop - card.offsetHeight / 2) * .35;
    card.style.setProperty('--hover-x', Math.max(-80, Math.min(80, x)) + 'px');
    card.style.setProperty('--hover-y', Math.max(-70, Math.min(70, y)) + 'px');
    card.classList.add('is-highlighted');
  });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-highlighted');
    card.style.setProperty('--hover-x', '0px');
    card.style.setProperty('--hover-y', '0px');
  });
});
heroArt.addEventListener('pointermove', event => {
  if (!motionAllowed()) return;
  const box = heroArt.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  heroArt.style.setProperty('--pointer-x', (x - .5) * 24 + 'px');
  heroArt.style.setProperty('--pointer-y', (y - .5) * 24 + 'px');
  heroArt.style.setProperty('--spot-x', x * 100 + '%');
  heroArt.style.setProperty('--spot-y', y * 100 + '%');
});
heroArt.addEventListener('pointerleave', () => {
  heroArt.style.setProperty('--pointer-x', '0px');
  heroArt.style.setProperty('--pointer-y', '0px');
});
if ('IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
  }, {threshold: .12});
  document.querySelectorAll('main section').forEach(section => motionObserver.observe(section));
}
