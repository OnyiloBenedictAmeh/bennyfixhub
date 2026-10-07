(function () {
  document.documentElement.classList.add('js');

  var nav = document.getElementById('site-nav');
  var menuToggle = document.querySelector('.menu-toggle');

  function toggleMenu(forceOpen) {
    if (!nav || !menuToggle) return;
    var willOpen = typeof forceOpen === 'boolean' ? forceOpen : nav.classList.toggle('is-open');
    nav.classList.toggle('is-open', willOpen);
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () { toggleMenu(); });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) toggleMenu(false);
    });
  }

  function showTab(tabId) {
    var tabs = [].slice.call(document.querySelectorAll('.tab'));
    var panels = [].slice.call(document.querySelectorAll('.panel'));
    tabs.forEach(function (tab) {
      var isCurrent = tab.getAttribute('data-tab') === tabId;
      tab.setAttribute('aria-selected', String(isCurrent));
      tab.tabIndex = isCurrent ? 0 : -1;
    });
    panels.forEach(function (panel) { panel.hidden = panel.id !== tabId; });
  }

  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { showTab(tab.getAttribute('data-tab')); });
    tab.addEventListener('keydown', function (event) {
      var nextIndex = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : null;
      if (nextIndex === null) return;
      nextIndex = (nextIndex + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      showTab(tabs[nextIndex].getAttribute('data-tab'));
      event.preventDefault();
    });
  });
  if (tabs.length) showTab(tabs[0].getAttribute('data-tab'));

  var HOURS = { 0: [12, 21], 1: [11, 22], 2: [11, 22], 3: [11, 22], 4: [11, 22], 5: [11, 23], 6: [11, 23] };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function padHour(hour) { return (hour < 10 ? '0' : '') + hour + ':00'; }

  try {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    var day = DAYS.indexOf(values.weekday);
    var minutes = parseInt(values.hour, 10) * 60 + parseInt(values.minute, 10);
    var hours = HOURS[day];
    var open = minutes >= hours[0] * 60 && minutes < hours[1] * 60;
    var text;
    if (open) text = 'Open now, until ' + padHour(hours[1]);
    else if (minutes < hours[0] * 60) text = 'Closed now, opens today at ' + padHour(hours[0]);
    else text = 'Closed now, opens tomorrow at ' + padHour(HOURS[(day + 1) % 7][0]);
    var status = document.getElementById('status');
    var statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = text;
    if (open && status) status.classList.add('open');
    var row = document.querySelector('.hours tr[data-day="' + day + '"]');
    if (row) row.classList.add('today');
  } catch (error) {
    // Keep the default status text when the browser cannot format Lagos time.
  }

  var nameEl = document.getElementById('c-name');
  var msgEl = document.getElementById('c-msg');
  var send = document.getElementById('wa-send');
  function buildWhatsAppMessage() {
    if (!nameEl || !msgEl || !send) return;
    var who = nameEl.value.trim();
    var text = 'Hello Hearth & Spice. ' + (who ? 'My name is ' + who + '. ' : '') + (msgEl.value.trim() || 'I have a question.');
    send.href = 'https://wa.me/2348000000000?text=' + encodeURIComponent(text);
  }
  if (nameEl) nameEl.addEventListener('input', buildWhatsAppMessage);
  if (msgEl) msgEl.addEventListener('input', buildWhatsAppMessage);

  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (event) { event.preventDefault(); });

  function selectText(button) {
    var target = document.getElementById(button.getAttribute('data-target'));
    if (!target) return;
    var range = document.createRange();
    range.selectNodeContents(target);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  [].forEach.call(document.querySelectorAll('[data-copy]'), function (button) {
    button.addEventListener('click', function () {
      var originalText = button.textContent;
      var setCopied = function () {
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = originalText; }, 1500);
      };
      try {
        navigator.clipboard.writeText(button.getAttribute('data-copy')).then(setCopied, function () { selectText(button); });
      } catch (error) { selectText(button); }
    });
  });
})();
