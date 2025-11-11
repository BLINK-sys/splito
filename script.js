const BITRIX_BASE_URL = 'https://pospro24.bitrix24.kz/rest/4615/slmhoqjtm2cwr15w/';
const BITRIX_RESPONSIBLE_ID = 4615;

const formatCurrency = (value) => {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString('ru-RU')} ₸`;
};

const calculate = () => {
  const equipmentInput = document.querySelector('.calculator-card input[data-role="equipment"]');
  const termInput = document.querySelector('.calculator-card input[data-role="term"]');
  if (!equipmentInput || !termInput) return;

  const equipmentCost = Number(equipmentInput.value);
  const termMonths = Number(termInput.value);
  const markupRate = 0.06;
  const downpaymentPercent = 0.3;

  const totalAmount = equipmentCost * (1 + markupRate);
  const downpaymentAmount = totalAmount * downpaymentPercent;
  const financedAmount = totalAmount - downpaymentAmount;
  const monthlyPayment = financedAmount / termMonths;

  document.getElementById('downpayment-amount').textContent = formatCurrency(downpaymentAmount);
  document.getElementById('monthly-payment').textContent = formatCurrency(monthlyPayment);
  document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
};

const initHeroSlideshow = () => {
  const slideshow = document.querySelector('.hero-slideshow');
  if (!slideshow) return;

  const heroImages = [
    'images/2025-11-06_06-48-03.png',
    'images/2025-11-06_06-48-15.jpg',
    'images/2025-11-06_06-50-10.jpg',
    'images/2025-11-06_06-50-53.jpg',
    'images/2025-11-06_06-50-58.jpg',
    'images/2025-11-06_06-52-24.jpg',
    'images/2025-11-06_06-52-30.jpg',
  ];

  const slides = heroImages.map((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Оборудование SPLITO';
    img.loading = 'lazy';
    slideshow.appendChild(img);
    return img;
  });

  if (!slides.length) return;

  let currentIndex = 0;
  const intervalMs = 3200;
  const leaveDuration = 650;

  slides[currentIndex].classList.add('is-active');

  if (slides.length > 1) {
    setInterval(() => {
      const currentSlide = slides[currentIndex];
      currentSlide.classList.remove('is-active');
      currentSlide.classList.add('is-leaving');
      setTimeout(() => currentSlide.classList.remove('is-leaving'), leaveDuration);

      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add('is-active');
    }, intervalMs);
  }
};

const initContactForm = () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusNode = form.querySelector('[data-form-status]');
  const submitButton = form.querySelector('button[type="submit"]');

  const setStatus = (message, type = '') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.classList.remove('success', 'error');
    if (type) statusNode.classList.add(type);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!BITRIX_BASE_URL) {
      setStatus('Вебхук Bitrix24 не настроен. Укажите корректный адрес.', 'error');
      return;
    }

    const formData = new FormData(form);
    const name = formData.get('name')?.trim();
    const phone = formData.get('phone')?.trim();
    const email = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();

    if (!name || !phone) {
      setStatus('Пожалуйста, заполните имя и телефон.', 'error');
      return;
    }

    const dealUrl = `${BITRIX_BASE_URL}crm.deal.add.json`;
    const contactUrl = `${BITRIX_BASE_URL}crm.contact.add.json`;

    setStatus('Отправляем данные...', '');
    submitButton.disabled = true;

    try {
      let contactId = null;

      if (phone || email) {
        try {
          const contactPayload = {
            fields: {
              NAME: name || 'Без имени',
              OPENED: 'Y',
              ASSIGNED_BY_ID: BITRIX_RESPONSIBLE_ID || undefined,
              PHONE: phone ? [{ VALUE: phone, VALUE_TYPE: 'WORK' }] : [],
              EMAIL: email ? [{ VALUE: email, VALUE_TYPE: 'WORK' }] : [],
              COMMENTS: message || '',
            },
          };

          const contactResponse = await fetch(contactUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactPayload),
          });
          const contactData = await contactResponse.json();

          if (contactData?.result) {
            contactId = contactData.result;
          } else {
            console.warn('Bitrix contact warning:', contactData);
          }
        } catch (contactError) {
          console.warn('Bitrix contact error:', contactError);
        }
      }

      const commentsLines = [
        `Имя: ${name || '—'}`,
        `Телефон: ${phone || '—'}`,
        `Email: ${email || '—'}`,
        `Сообщение: ${message || '—'}`,
      ];

      const dealTitle = name ? `Заявка на рассрочку — ${name}` : 'Заявка на рассрочку';

      const dealPayload = {
        fields: {
          TITLE: dealTitle,
          COMMENTS: commentsLines.join('\n'),
          ASSIGNED_BY_ID: BITRIX_RESPONSIBLE_ID || undefined,
          CONTACT_ID: contactId || undefined,
          SOURCE_ID: 'WEB',
        },
      };

      const response = await fetch(dealUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealPayload),
      });

      const data = await response.json();

      if (data?.result) {
        try {
          await fetch(`${BITRIX_BASE_URL}crm.deal.update.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.result,
              fields: { TITLE: dealTitle },
            }),
          });
        } catch (updateError) {
          console.warn('Bitrix deal update warning:', updateError);
        }

        setStatus('Заявка успешно отправлена!', 'success');
        form.reset();
      } else {
        const errorMessage = data?.error_description || data?.error || 'Не удалось создать сделку в Bitrix24.';
        setStatus(errorMessage, 'error');
      }
    } catch (error) {
      setStatus('Не удалось связаться с Bitrix24. Проверьте подключение.', 'error');
      console.error('Bitrix CRM error:', error);
    } finally {
      submitButton.disabled = false;
    }
  });
};

const initRanges = () => {
  const rangeInputs = document.querySelectorAll('.calculator-card input[type="range"]');

  rangeInputs.forEach((input) => {
    const outputSelector = input.dataset.output;
    const output = document.querySelector(outputSelector);
    if (!output) return;

    const updateOutput = () => {
      const value = Number(input.value);

      if (input.dataset.role === 'equipment') {
        output.textContent = formatCurrency(value);
      } else {
        output.textContent = String(value);
      }
    };

    input.addEventListener('input', () => {
      updateOutput();
      calculate();
    });

    updateOutput();
  });

  calculate();
};

const initMenuToggle = () => {
  const toggle = document.querySelector('.menu-toggle');
  const topbar = document.querySelector('.topbar');
  const navLinks = document.querySelectorAll('.nav a');
  if (!toggle || !topbar) return;

  toggle.addEventListener('click', () => {
    topbar.classList.toggle('menu-open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      topbar.classList.remove('menu-open');
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlideshow();
  initRanges();
  initMenuToggle();
  initContactForm();
});

