function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function showToast(message, type = 'success') {
  let backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';

  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    style: {
      background: backgroundColor
    },
    stopOnFocus: true
  }).showToast();
}