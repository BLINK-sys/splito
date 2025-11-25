const BITRIX_BASE_URL = 'https://pospro24.bitrix24.kz/rest/4243/ujfsiyj7t7z1m1a9/';
const BITRIX_CATEGORY_ID = 15;
const BITRIX_RESPONSIBLE_ID = 1;

// Функция для получения UTM параметров из URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  const utmParams = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  return utmParams;
};

// Сохранение UTM параметров в sessionStorage
const saveUTMParams = () => {
  const utmParams = getUTMParams();
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  }
};

// Получение сохраненных UTM параметров
const getSavedUTMParams = () => {
  const saved = sessionStorage.getItem('utm_params');
  return saved ? JSON.parse(saved) : {};
};

// Форматирование UTM параметров для комментариев
const formatUTMForComments = (utmParams) => {
  if (!utmParams || Object.keys(utmParams).length === 0) {
    return null;
  }
  
  const labels = {
    utm_source: 'Источник',
    utm_medium: 'Канал',
    utm_campaign: 'Кампания',
    utm_term: 'Ключевое слово',
    utm_content: 'Контент'
  };
  
  const lines = ['UTM метки:'];
  Object.keys(utmParams).forEach(key => {
    const label = labels[key] || key;
    lines.push(`${label}: ${utmParams[key]}`);
  });
  
  return lines.join('\n');
};

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

const initHeroSlideshow = async () => {
  const slideshow = document.querySelector('.hero-slideshow');
  if (!slideshow) return;

  // Список всех изображений в папке images
  // Добавляйте сюда новые файлы - формат определяется автоматически (png, jpg, jpeg, webp, gif)
  const imageFiles = [
    '1.png',
    '2.png',
  ];

  // Загружаем все изображения (формат определяется автоматически браузером)
  const imagesToLoad = imageFiles.map(file => `images/${file}`);

  const slides = [];
  const validSlides = [];
  let loadedCount = 0;
  const totalImages = imagesToLoad.length;
  let slideshowInitialized = false;
  let currentIndex = 0;
  const intervalMs = 3200;
  const leaveDuration = 650;

  // Функция для инициализации слайдшоу после загрузки всех изображений
  const initSlideshow = () => {
    if (validSlides.length === 0 || slideshowInitialized) return;

    slideshowInitialized = true;

    // Запускаем автоматическую смену изображений только если есть больше одного
    if (validSlides.length > 1) {
    setInterval(() => {
        const currentSlide = validSlides[currentIndex];
        if (currentSlide) {
      currentSlide.classList.remove('is-active');
      currentSlide.classList.add('is-leaving');
      setTimeout(() => currentSlide.classList.remove('is-leaving'), leaveDuration);
        }

        currentIndex = (currentIndex + 1) % validSlides.length;
        if (validSlides[currentIndex]) {
          validSlides[currentIndex].classList.add('is-active');
        }
    }, intervalMs);
  }
  };

  // Загружаем все изображения
  imagesToLoad.forEach((src) => {
    const img = document.createElement('img');
    img.alt = 'Оборудование SPLITO';
    // Обработка ошибок загрузки изображений (включая PNG)
    img.onerror = function() {
      console.warn(`Не удалось загрузить изображение: ${src}`);
      this.style.display = 'none';
      loadedCount++;
      if (loadedCount === totalImages) {
        initSlideshow();
      }
    };
    img.onload = function() {
      // Изображение успешно загружено (поддерживает jpg, png, jpeg, webp и др.)
      validSlides.push(this);
      loadedCount++;
      
      // Показываем первое изображение сразу после загрузки
      if (loadedCount === 1 && validSlides[0]) {
        validSlides[0].classList.add('is-active');
      }
      
      // Запускаем слайдшоу после загрузки всех изображений
      if (loadedCount === totalImages) {
        initSlideshow();
      }
    };
    img.src = src; // Устанавливаем src после обработчиков
    slideshow.appendChild(img);
    slides.push(img);
  });
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

      // Получаем сохраненные UTM параметры
      const utmParams = getSavedUTMParams();
      const utmInfo = formatUTMForComments(utmParams);
      
      const commentsLines = [
        `Имя: ${name || '—'}`,
        `Телефон: ${phone || '—'}`,
        `Email: ${email || '—'}`,
        `Сообщение: ${message || '—'}`,
      ];
      
      // Добавляем UTM метки в комментарии, если они есть
      if (utmInfo) {
        commentsLines.push('', utmInfo);
      }

      const dealTitle = name ? `Заявка на рассрочку — ${name}` : 'Заявка на рассрочку';

      const dealPayload = {
        fields: {
          TITLE: dealTitle,
          COMMENTS: commentsLines.join('\n'),
          ASSIGNED_BY_ID: BITRIX_RESPONSIBLE_ID || undefined,
          CONTACT_ID: contactId || undefined,
          SOURCE_ID: 'WEB',
          CATEGORY_ID: BITRIX_CATEGORY_ID,
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

const initPhoneReveal = () => {
  // Находим все ссылки с номерами телефонов
  const phoneLinks = document.querySelectorAll('a[data-phone-full]');
  
  phoneLinks.forEach(link => {
    const fullPhone = link.getAttribute('data-phone-full');
    const shortPhone = link.getAttribute('data-phone-short');
    
    // Проверяем, был ли номер уже показан (в sessionStorage)
    const phoneRevealed = sessionStorage.getItem(`phone_revealed_${fullPhone}`);
    
    if (phoneRevealed === 'true') {
      // Если номер уже был показан, показываем полный номер сразу
      link.textContent = fullPhone;
    } else {
      // Иначе показываем короткий вариант
      link.textContent = shortPhone;
      
      // Обработчик клика для показа номера
      link.addEventListener('click', (e) => {
        // Если номер еще не показан, показываем его
        if (link.textContent === shortPhone) {
          e.preventDefault(); // Предотвращаем переход по ссылке
          
          // Показываем полный номер
          link.textContent = fullPhone;
          
          // Сохраняем в sessionStorage, что номер был показан
          sessionStorage.setItem(`phone_revealed_${fullPhone}`, 'true');
          
          // Отслеживаем событие показа номера через dataLayer для GTM
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'phone_reveal',
              phone_number: fullPhone,
              page_url: window.location.href,
              page_title: document.title
            });
          }
          
          // Также можно отправить событие в консоль для отладки
          console.log('Phone number revealed:', fullPhone);
        }
        // Если номер уже показан, позволяем обычный переход по ссылке tel:
      });
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // Сохраняем UTM параметры при загрузке страницы
  saveUTMParams();
  
  initHeroSlideshow();
  initRanges();
  initMenuToggle();
  initContactForm();
  initPhoneReveal();
});

