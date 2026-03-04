const DEFAULT_LANG = 'ja';
const DEFAULT_DATE = '';
const DEFAULT_TARGET = '';
const DEFAULT_DURATION = '';
const DEFAULT_TITLE = '';
const DEFAULT_STYLE = '';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const YYYYMMDD_REGEX = /^\d{8}$/;

const ELEM_INPUT_TITLE = 'input-title';
const ELEM_INPUT_DATE = 'input-date';
const ELEM_INPUT_TARGET = 'input-target';
const ELEM_INPUT_DURATION = 'input-duration';
const ELEM_INPUT_STYLE = 'input-style';
const ELEM_SUMMARY_TILE = 'summary-tile';
const ELEM_SUMMARY_TITLE = 'summary-title';
const ELEM_SUMMARY_RANGE = 'summary-range';
const ELEM_SUMMARY_DAYS = 'summary-days';
const ELEM_DATES = 'dates';

const PARAM_TITLE = 'n';
const PARAM_DATE = 'd';
const PARAM_TARGET = 't';
const PARAM_DURATION = 'p';
const PARAM_STYLE = 'y';
const PARAM_LANG = 'l';

const STORAGE_DATES = 'dates';
const STORAGE_LANG = 'lang';
const STORAGE_LIGHTDARK = 'lightdark';

const LANGS = ['en', 'ja'];
const LABELS = {
  'app-name': {
    en: 'DaysLog',
    ja: 'デイズログ',
  },
  'share-to-x-message': {
    en: '📅 #{app} {title}\n{days} days since {date} until {target}',
    ja: '📅 #{app} {title}\n{date}から{target}まで{days}日が経ちました',
  },
  'summary-range-message': {
    en: 'From <span class="summary-range-date">{date}</span> to <span class="summary-range-date">{target}</span>',
    ja: '<span class="summary-range-date">{date}</span> から <span class="summary-range-date">{target}</span> まで',
  },
  'summary-days-message': {
    en: '<span class="summary-days-number">{days}</span> days<br/>has passed',
    ja: '<span class="summary-days-number">{days}</span> 日<br/>が経ちました',
  },
  date: {
    en: 'Date',
    ja: '日付',
  },
  target: {
    en: 'Target Date',
    ja: '目標日付',
  },
  duration: {
    en: 'Duration',
    ja: '期間',
  },
  title: {
    en: 'Title',
    ja: 'タイトル',
  },
  'dates-log': {
    en: 'Dates Log',
    ja: '日付ログ',
  },
  share: {
    en: 'Share',
    ja: '共有',
  },
  'copy-url': {
    en: 'URL',
    ja: 'URL',
  },
  save: {
    en: 'Save',
    ja: '保存',
  },
  delete: {
    en: 'Delete',
    ja: '削除',
  },
  today: {
    en: 'Today',
    ja: '今日',
  },
};

const DATE_FORMATTERS = new Map();
const TODAY_LABELS = new Map();

/**
 * JSON structure for date log.
 *
 * @typedef {Object} DateLog
 * @property {(string|undefined)} id - Local unique identifier for the date.
 * @property {(string|undefined)} date - The date in ISO format (YYYY-MM-DD).
 * @property {(string|undefined)} target - The target date in ISO format (YYYY-MM-DD).
 * @property {(string|undefined)} title - The title of the date.
 * @property {(string|undefined)} style - The style associated with the date.
 */

function id(value) {
  return document.getElementById(value);
}

function getUserLang() {
  return localStorage.getItem(STORAGE_LANG) || navigator.language || DEFAULT_LANG;
}

function label(key, params = {}) {
  if (!LABELS[key]) return key;
  const userLang = getUserLang();
  const lang = userLang.split('-')[0];
  let label = LABELS[key][userLang] || LABELS[key][lang] || LABELS[key][DEFAULT_LANG];
  if (!label) return key;
  for (const param in params) {
    label = label.replace(`{${param}}`, params[param]);
  }
  return label;
}

function generateDateId() {
  const base = Math.random().toString(36);
  return base.length > 11 ? base.substring(2, 11) : base.substring(2).padEnd(9, '0');
}

function getDates() {
  const dates = localStorage.getItem(STORAGE_DATES);
  return dates ? JSON.parse(dates) : [];
}

function deleteDate(id) {
  const dates = getDates();
  const dateToDelete = dates.find((date) => date.id === id);

  if (!dateToDelete) return;

  const remainingDates = dates.filter((date) => date.id !== id);
  localStorage.setItem(STORAGE_DATES, JSON.stringify(remainingDates));
  renderDates();
}

function saveInput() {
  const title = id(ELEM_INPUT_TITLE).value ? id(ELEM_INPUT_TITLE).value.trim() : DEFAULT_TITLE;
  const date = id(ELEM_INPUT_DATE).value || DEFAULT_DATE;
  const target = id(ELEM_INPUT_TARGET).value || DEFAULT_TARGET;
  const style = id(ELEM_INPUT_STYLE).value ? id(ELEM_INPUT_STYLE).value.trim() : DEFAULT_STYLE;
  if (date) {
    const dates = getDates();
    const data = {
      id: generateDateId(),
      date,
      target,
      title,
      style,
    };
    dates.push(data);
    localStorage.setItem(STORAGE_DATES, JSON.stringify(dates));
    renderDates();
  }
}

function swapDates() {
  const date = id(ELEM_INPUT_DATE);
  const target = id(ELEM_INPUT_TARGET);
  const temp = date.value;
  date.value = target.value;
  target.value = temp;
  renderSummary();
}

function calculateDays(date, target) {
  date = date ? Temporal.PlainDate.from(date) : Temporal.Now.plainDateISO();
  target = target ? Temporal.PlainDate.from(target) : Temporal.Now.plainDateISO();
  return target.since(date).days;
}

function generateUrl(data) {
  const { date, target, title, style } = data || {
    date: id(ELEM_INPUT_DATE).value || DEFAULT_DATE,
    target: id(ELEM_INPUT_TARGET).value || DEFAULT_TARGET,
    title: id(ELEM_INPUT_TITLE).value.trim() || DEFAULT_TITLE,
    style: id(ELEM_INPUT_STYLE).value.trim() || DEFAULT_STYLE,
  };
  const params = new URLSearchParams();
  if (date) {
    params.set(PARAM_DATE, date.replace(/-/g, ''));
  }
  if (target) {
    params.set(PARAM_TARGET, target.replace(/-/g, ''));
  }
  if (title) {
    params.set(PARAM_TITLE, title);
  }
  if (style) {
    params.set(PARAM_STYLE, style);
  }
  const url = new URL(window.location.href);
  url.hash = `#${params.toString()}`;
  return url.toString();
}

function shareToX(data) {
  let { date, target, title, style } = data || {
    date: id(ELEM_INPUT_DATE).value,
    target: id(ELEM_INPUT_TARGET).value,
    title: id(ELEM_INPUT_TITLE).value,
    style: id(ELEM_INPUT_STYLE).value,
  };
  date = date || DEFAULT_DATE;
  if (!date) return;
  target = target || DEFAULT_TARGET;
  title = title.trim() || DEFAULT_TITLE;
  style = style.trim() || DEFAULT_STYLE;
  const days = calculateDays(date, target);
  const url = generateUrl(data);
  const app = label('app-name');
  const dateStr = formatDate(date);
  const targetStr = target ? formatDate(target) : formatDate(Temporal.Now.plainDateISO().toString());
  const text = label('share-to-x-message', { app, title, date: dateStr, target: targetStr, days, url });
  const intentUrl = new URL('https://x.com/intent/tweet');
  intentUrl.searchParams.set('text', text);
  intentUrl.searchParams.set('url', url.toString());
  window.open(intentUrl, '_blank');
}

function copyUrl(data) {
  navigator.clipboard.writeText(generateUrl(data));
}

function formatDate(date) {
  if (!date) return '';
  const userLang = getUserLang();
  if (!DATE_FORMATTERS.has(userLang)) {
    DATE_FORMATTERS.set(
      userLang,
      new Intl.DateTimeFormat(userLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
  }
  const formatter = DATE_FORMATTERS.get(userLang);
  // PlainDateの場合は年月日でフォーマットされていない
  // return formatter.format(Temporal.PlainDate.from(date));
  return formatter.format(new Date(date));
}

function formatToday() {
  const userLang = getUserLang();
  if (!TODAY_LABELS.has(userLang)) {
    TODAY_LABELS.set(userLang, new Intl.RelativeTimeFormat(userLang, { numeric: 'auto' }).format(0, 'day'));
  }
  return TODAY_LABELS.get(userLang);
}

function renderSummary() {
  const title = id(ELEM_INPUT_TITLE).value.trim();
  const date = id(ELEM_INPUT_DATE).value || DEFAULT_DATE;
  const target = id(ELEM_INPUT_TARGET).value || DEFAULT_TARGET;
  if (date) {
    id(ELEM_SUMMARY_TITLE).textContent = title || '';
    const dateStr = formatDate(date);
    const targetStr = target ? formatDate(target) : formatToday();
    const rangeMessage = label('summary-range-message', { date: dateStr, target: targetStr });
    id(ELEM_SUMMARY_RANGE).innerHTML = rangeMessage;
    const days = calculateDays(date, target);
    const daysMessage = label('summary-days-message', { days });
    id(ELEM_SUMMARY_DAYS).innerHTML = days !== null ? daysMessage : '';
    id(ELEM_SUMMARY_TILE).classList.remove('hidden');
  } else {
    id(ELEM_SUMMARY_TILE).classList.add('hidden');
    id(ELEM_SUMMARY_TITLE).textContent = '';
    id(ELEM_SUMMARY_RANGE).textContent = '';
    id(ELEM_SUMMARY_DAYS).textContent = '';
  }
}

function renderDates() {
  const dates = getDates();
  const datesElem = id(ELEM_DATES);
  datesElem.innerHTML = '';
  dates.forEach((date) => {
    const li = document.createElement('li');
    li.innerHTML = `
            <span>${date.date}</span>
            <span>${date.title}</span>
            <div>
                <button data-id="${date.id}" class="select-btn"><svg class="svg-icon"><use href="#svg-upload"></use></svg></button>
                <button data-id="${date.id}" class="delete-btn"><svg class="svg-icon"><use href="#svg-delete"></use></svg></button>
            </div>
        `;
    li.querySelector('.select-btn').addEventListener('click', () => {
      id(ELEM_INPUT_TITLE).value = date.title;
      id(ELEM_INPUT_DATE).value = date.date;
      renderSummary();
    });
    li.querySelector('.delete-btn').addEventListener('click', () => {
      deleteDate(date.id);
    });
    datesElem.appendChild(li);
  });
}

function renderLabels() {
  const labelElems = document.querySelectorAll('[data-label],[data-label-placeholder]');
  labelElems.forEach((elem) => {
    const key = elem.dataset.label || elem.dataset.labelPlaceholder;
    const text = label(key);
    if (elem.dataset.label !== undefined) {
      elem.textContent = text;
    }
    if (elem.dataset.labelPlaceholder !== undefined) {
      elem.setAttribute('placeholder', text);
    }
  });
}

function loadFromHash() {
  const hash = window.location.hash ? window.location.hash.substring(1) : '';
  const params = new URLSearchParams(hash);
  const start = params.get(PARAM_DATE) || DEFAULT_DATE;
  const end = params.get(PARAM_TARGET) || DEFAULT_TARGET;
  const title = params.get(PARAM_TITLE) || DEFAULT_TITLE;
  const style = params.get(PARAM_STYLE) || DEFAULT_STYLE;
  let useHash = false;
  if (start && YYYYMMDD_REGEX.test(start)) {
    id(ELEM_INPUT_DATE).value = `${start.substring(0, 4)}-${start.substring(4, 6)}-${start.substring(6, 8)}`;
    useHash = true;
  }
  if (end && YYYYMMDD_REGEX.test(end)) {
    id(ELEM_INPUT_TARGET).value = `${end.substring(0, 4)}-${end.substring(4, 6)}-${end.substring(6, 8)}`;
    useHash = true;
  }
  if (title) {
    id(ELEM_INPUT_TITLE).value = title;
  }
  if (style) {
    id(ELEM_INPUT_STYLE).value = style;
  }
  return useHash;
}

function loadFromLocalStorage() {
  const dates = getDates();
  if (dates.length > 0) {
    const date = dates[0];
    id(ELEM_INPUT_DATE).value = ISO_DATE_REGEX.test(date[PARAM_DATE]) ? date[PARAM_DATE] : DEFAULT_DATE;
    id(ELEM_INPUT_TARGET).value = ISO_DATE_REGEX.test(date[PARAM_TARGET]) ? date[PARAM_TARGET] : DEFAULT_TARGET;
    id(ELEM_INPUT_TITLE).value = date[PARAM_TITLE] || DEFAULT_TITLE;
    id(ELEM_INPUT_STYLE).value = date[PARAM_STYLE] || DEFAULT_STYLE;
    return true;
  }
  return false;
}

function load() {
  renderLabels();
  if (!loadFromHash() && !loadFromLocalStorage()) {
    id(ELEM_INPUT_DATE).value = DEFAULT_DATE;
    id(ELEM_INPUT_TARGET).value = DEFAULT_TARGET;
    id(ELEM_INPUT_TITLE).value = DEFAULT_TITLE;
    id(ELEM_INPUT_STYLE).value = DEFAULT_STYLE;
  }
  renderSummary();
  renderDates();
}

document.addEventListener('DOMContentLoaded', load);
