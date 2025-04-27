document.addEventListener('DOMContentLoaded', function () {
  let currentPhotoIndex = 0;
  const modal = document.getElementById('photoModal');
  const modalImage = document.getElementById('modalImage');
  const thumbnails = Array.from(document.querySelectorAll('.thumbnail'));
  const photos = thumbnails.map(img => img.src);

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      currentPhotoIndex = index;
      openModal(photos[currentPhotoIndex]);
    });
  });

  document.querySelector('.close').addEventListener('click', closeModal);
  document.getElementById('prevPhoto').addEventListener('click', () => navigatePhoto(-1));
  document.getElementById('nextPhoto').addEventListener('click', () => navigatePhoto(1));

  function openModal(src) {
    modal.style.display = 'block';
    modalImage.src = src;
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  function navigatePhoto(direction) {
    currentPhotoIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
    modalImage.src = photos[currentPhotoIndex];
  }
});
