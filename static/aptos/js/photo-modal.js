document.addEventListener('DOMContentLoaded', function () {
  let currentPhotoIndex = 0;
  let currentAptoId = null; // Variável para armazenar o ID do apartamento atual
  const modal = document.getElementById('photoModal');
  const modalImage = document.getElementById('modalImage');
  const thumbnails = Array.from(document.querySelectorAll('.thumbnail'));

  // Mapeia as fotos por apartamento
  const photosByApto = {};

  thumbnails.forEach((thumbnail) => {
    const aptoId = thumbnail.dataset.apto; // Obtém o ID do apartamento da miniatura
    if (!photosByApto[aptoId]) {
      photosByApto[aptoId] = [];
    }
    photosByApto[aptoId].push(thumbnail.src);
  });

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
      const aptoId = thumbnail.dataset.apto; // Obtém o ID do apartamento da miniatura
      const photos = photosByApto[aptoId]; // Pega as fotos do apartamento selecionado
      currentAptoId = aptoId; // Armazena o ID do apartamento atual
      currentPhotoIndex = photos.indexOf(thumbnail.src); // Ajusta o índice para a foto selecionada
      openModal(photos[currentPhotoIndex], aptoId); // Passa o apartamento atual para o modal
    });
  });

  document.querySelector('.close').addEventListener('click', closeModal);
  document.getElementById('prevPhoto').addEventListener('click', () => navigatePhoto(-1));
  document.getElementById('nextPhoto').addEventListener('click', () => navigatePhoto(1));

  function openModal(src, aptoId) {
    const photos = photosByApto[aptoId]; // Pega as fotos do apartamento atual
    modal.style.display = 'block';
    modalImage.src = src;
    // Atualiza o índice e permite navegar pelas fotos desse apartamento
    currentPhotoIndex = photos.indexOf(src);
  }

  function closeModal() {
    modal.style.display = 'none';
    currentAptoId = null; // Reseta o ID do apartamento quando o modal é fechado
  }

  function navigatePhoto(direction) {
    if (currentAptoId !== null) {
      const photos = photosByApto[currentAptoId]; // Pega as fotos do apartamento atual
      currentPhotoIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
      modalImage.src = photos[currentPhotoIndex];
    }
  }
});
