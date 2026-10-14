const contactForm = document.querySelector('.contact-form');
const contactResult = document.querySelector('#contact-result');
const interest = new URLSearchParams(location.search).get('interesse');
if (interest === 'host') contactForm.elements.interest.value = 'host';
let messageSummary = '';
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = contactForm.elements;
  messageSummary = [
    'Messaggio dimostrativo — Innocenti',
    `Nome: ${fields.name.value}`,
    `Email: ${fields.email.value}`,
    `Telefono: ${fields.phone.value || 'Non indicato'}`,
    `Interesse: ${fields.interest.options[fields.interest.selectedIndex].text}`,
    '', fields.message.value, '',
    'Nessun invio effettuato. Riepilogo creato solo sul tuo dispositivo.'
  ].join('\n');
  contactResult.querySelector('.request-summary').textContent = messageSummary;
  contactForm.hidden = true;
  contactResult.hidden = false;
  contactResult.focus();
});
contactResult.querySelector('.download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([messageSummary], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'messaggio-innocenti.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
contactResult.querySelector('.reset-message').addEventListener('click', () => {
  contactResult.hidden = true;
  contactForm.hidden = false;
  contactForm.elements.name.focus();
});
