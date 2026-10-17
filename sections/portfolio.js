const pageSectionFiles = [
  './sections/home.html',
  './sections/work.html',
  './sections/longform.html',
  './sections/services.html',
  './sections/process.html',
  './sections/about.html',
  './sections/tools.html',
  './sections/contact.html',
];

async function loadPageSections() {
  const container = document.querySelector('#page-sections');
  if (!container) throw new Error('Missing #page-sections container.');

  const fragments = await Promise.all(pageSectionFiles.map(async (file) => {
    const response = await fetch(file, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load ${file}: HTTP ${response.status}.`);
    return response.text();
  }));
  container.innerHTML = fragments.join('\n');
}

function initializePortfolio() {
    const editorRuler = document.querySelector('.editor-ruler');
    const rulerTimecode = editorRuler.querySelector('.editor-ruler-timecode');
    let rulerFrame = 0;
    const updateEditorRuler = () => {
      rulerFrame = 0;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
      editorRuler.style.setProperty('--edit-progress', `${progress * 100}%`);
      const totalFrames = Math.round(progress * 60 * 30);
      const minutes = Math.floor(totalFrames / 1800);
      const seconds = Math.floor((totalFrames % 1800) / 30);
      const frames = totalFrames % 30;
      rulerTimecode.textContent = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    };
    const requestEditorRulerUpdate = () => {
      if (!rulerFrame) rulerFrame = window.requestAnimationFrame(updateEditorRuler);
    };
    window.addEventListener('scroll', requestEditorRulerUpdate, { passive: true });
    window.addEventListener('resize', requestEditorRulerUpdate);
    updateEditorRuler();

    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.nav-links');
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      navigation.classList.toggle('is-open', !isOpen);
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        navigation.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation');
      }
    });

    const reelTrack = document.querySelector('.project-grid');
    const reelControls = document.querySelector('.reel-controls');
    const previousReels = document.querySelector('.reel-previous');
    const nextReels = document.querySelector('.reel-next');
    const projectCards = Array.from(reelTrack.children);
    projectCards
      .sort((a, b) => {
        const aIsTalkingHead = a.dataset.category.split(' ').includes('talkinghead');
        const bIsTalkingHead = b.dataset.category.split(' ').includes('talkinghead');
        const aIsUnfiltered = a.querySelector('.project-info h3')?.textContent.trim() === 'Unfiltered Conversations';
        const bIsUnfiltered = b.querySelector('.project-info h3')?.textContent.trim() === 'Unfiltered Conversations';
        const aIsMovedToEnd = a.querySelector('.project-info h3')?.textContent.trim() === 'Conversations That Matter';
        const bIsMovedToEnd = b.querySelector('.project-info h3')?.textContent.trim() === 'Conversations That Matter';
        return Number(bIsUnfiltered) - Number(aIsUnfiltered)
          || Number(aIsMovedToEnd) - Number(bIsMovedToEnd)
          || Number(bIsTalkingHead) - Number(aIsTalkingHead);
      })
      .forEach((card) => reelTrack.appendChild(card));
    projectCards.forEach((card, index) => {
      const projectNumber = card.querySelector('.project-number');
      if (projectNumber) projectNumber.textContent = `${String(index + 1).padStart(2, '0')} / ${projectCards.length}`;
    });
    const visibleReels = () => Array.from(reelTrack.children).filter((card) => !card.hidden);
    const updateReelCarousel = () => {
      const hasCarousel = visibleReels().length > 3;
      reelTrack.classList.toggle('is-carousel', hasCarousel);
      reelControls.hidden = !hasCarousel;
      const atEnd = reelTrack.scrollLeft >= reelTrack.scrollWidth - reelTrack.clientWidth - 1;
      previousReels.disabled = !hasCarousel || reelTrack.scrollLeft <= 1;
      nextReels.disabled = !hasCarousel || atEnd;
    };

    previousReels.addEventListener('click', () => reelTrack.scrollBy({ left: -reelTrack.clientWidth, behavior: 'smooth' }));
    nextReels.addEventListener('click', () => reelTrack.scrollBy({ left: reelTrack.clientWidth, behavior: 'smooth' }));
    reelTrack.addEventListener('scroll', updateReelCarousel, { passive: true });
    window.addEventListener('resize', updateReelCarousel);

    const longformTrack = document.querySelector('.longform-track');
    const longformControls = document.querySelector('.longform-controls');
    const previousLongform = document.querySelector('.longform-previous');
    const nextLongform = document.querySelector('.longform-next');
    const updateLongformCarousel = () => {
      const hasCarousel = longformTrack.children.length > 2;
      longformTrack.classList.toggle('is-carousel', hasCarousel);
      longformControls.hidden = !hasCarousel;
      const atEnd = longformTrack.scrollLeft >= longformTrack.scrollWidth - longformTrack.clientWidth - 1;
      previousLongform.disabled = !hasCarousel || longformTrack.scrollLeft <= 1;
      nextLongform.disabled = !hasCarousel || atEnd;
    };
    previousLongform.addEventListener('click', () => longformTrack.scrollBy({ left: -longformTrack.clientWidth, behavior: 'smooth' }));
    nextLongform.addEventListener('click', () => longformTrack.scrollBy({ left: longformTrack.clientWidth, behavior: 'smooth' }));
    longformTrack.addEventListener('scroll', updateLongformCarousel, { passive: true });
    window.addEventListener('resize', updateLongformCarousel);
    new MutationObserver(updateLongformCarousel).observe(longformTrack, { childList: true });
    updateLongformCarousel();

    let activeYouTubePlayer = null;
    const stopActiveYouTubePlayer = () => {
      if (!activeYouTubePlayer) return;
      const activePoster = activeYouTubePlayer.parentElement.querySelector('.longform-poster, .project-poster');
      activeYouTubePlayer.remove();
      if (activePoster) activePoster.hidden = false;
      activeYouTubePlayer = null;
    };
    const createYouTubeFrame = (poster, className) => {
      const videoId = poster.dataset.youtubeId;
      const title = poster.closest('.project-card')?.querySelector('.project-info h3')?.textContent.trim()
        || poster.getAttribute('aria-label').replace(/^Play | on YouTube$/g, '');
      const frame = document.createElement('iframe');
      frame.className = className;
      frame.title = title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const parameters = new URLSearchParams({
        autoplay: '1',
        controls: '1',
        fs: '0',
        playsinline: '1',
        rel: '0',
        origin: window.location.origin,
      });
      if (className === 'project-youtube-preview') {
        parameters.set('loop', '1');
        parameters.set('playlist', videoId);
      }
      frame.src = `https://www.youtube.com/embed/${videoId}?${parameters}`;
      return frame;
    };
    const playYouTubeWithSound = (container, poster, preview, className) => {
      stopActiveYouTubePlayer();
      stopActiveProjectVideo();
      const player = createYouTubeFrame(poster, className);
      if (preview?.isConnected) {
        preview.replaceWith(player);
      } else {
        container.appendChild(player);
      }
      poster.hidden = true;
      activeYouTubePlayer = player;
      return player;
    };

    longformTrack.querySelectorAll('.longform-player-screen').forEach((screen) => {
      const poster = screen.querySelector('.longform-poster');
      if (!poster || (window.location.protocol !== 'http:' && window.location.protocol !== 'https:')) return;
      let preview = null;

      screen.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse' || preview) return;
        stopActiveYouTubePlayer();
        stopActiveProjectVideo();
        preview = createYouTubeFrame(poster, 'longform-video');
        screen.appendChild(preview);
        poster.hidden = true;
      });

      screen.addEventListener('click', (event) => {
        if (!poster.contains(event.target)) return;
        if (preview === activeYouTubePlayer) return;
        event.preventDefault();
        preview = playYouTubeWithSound(screen, poster, preview, 'longform-video');
      });

      screen.addEventListener('pointerleave', () => {
        if (preview === activeYouTubePlayer) return;
        preview?.remove();
        preview = null;
        poster.hidden = false;
      });
    });

    let activeProjectVideo = null;
    const stopActiveProjectVideo = () => {
      if (!activeProjectVideo) return;
      const activePoster = activeProjectVideo.parentElement.querySelector('.project-poster');
      activeProjectVideo.removeAttribute('src');
      activeProjectVideo.load();
      activeProjectVideo.hidden = true;
      if (activePoster) activePoster.hidden = false;
      activeProjectVideo = null;
    };
    const activateProjectVideo = (video) => {
      if (activeProjectVideo && activeProjectVideo !== video) {
        stopActiveProjectVideo();
      }
      activeProjectVideo = video;
    };

    document.querySelectorAll('.project-video').forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('autoplay', 'autoplay');
      video.setAttribute('muted', 'muted');
      video.addEventListener('pointerenter', () => activateProjectVideo(video));
      video.addEventListener('focus', () => activateProjectVideo(video));
    });

    document.querySelectorAll('.filter-button').forEach((button) => {
      button.addEventListener('click', () => {
        stopActiveProjectVideo();
        document.querySelectorAll('.filter-button').forEach((item) => item.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
        document.querySelectorAll('.project-card').forEach((card) => {
          card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
        });
        reelTrack.scrollLeft = 0;
        updateReelCarousel();
      });
    });
    updateReelCarousel();

    const setPosterFrame = (poster, videoUrl) => {
      const posterImage = poster.querySelector('.project-poster-image') || document.createElement('img');
      posterImage.classList.add('project-poster-image');
      posterImage.alt = '';
      posterImage.loading = 'eager';
      posterImage.decoding = 'async';
      if (!posterImage.isConnected) {
        const art = poster.querySelector('.project-poster-art');
        if (art) {
          poster.insertBefore(posterImage, art.nextSibling);
        } else {
          poster.appendChild(posterImage);
        }
      }

      const sourceVideo = document.createElement('video');
      sourceVideo.preload = 'auto';
      sourceVideo.muted = true;
      sourceVideo.playsInline = true;
      sourceVideo.crossOrigin = 'anonymous';
      sourceVideo.src = videoUrl;

      const captureFrame = () => {
        const canvas = document.createElement('canvas');
        const width = sourceVideo.videoWidth || 540;
        const height = sourceVideo.videoHeight || 960;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sourceVideo, 0, 0, width, height);
        posterImage.src = canvas.toDataURL('image/jpeg', 0.82);
        const video = poster.parentElement.querySelector('.project-video');
        if (video) video.poster = posterImage.src;
      };

      const tryCapture = () => {
        if (sourceVideo.readyState >= 2 && sourceVideo.videoWidth > 0 && sourceVideo.videoHeight > 0) {
          const midpoint = sourceVideo.duration > 0 ? Math.min(sourceVideo.duration * 0.18, 2) : 1;
          try {
            sourceVideo.currentTime = midpoint;
          } catch (error) {
            captureFrame();
          }
        }
      };

      sourceVideo.addEventListener('loadedmetadata', tryCapture, { once: true });
      sourceVideo.addEventListener('canplay', tryCapture, { once: true });
      sourceVideo.addEventListener('seeked', captureFrame, { once: true });
      sourceVideo.addEventListener('error', () => {
        if (!posterImage.src) {
          posterImage.remove();
        }
      });
    };

    const openProjectVideo = new WeakMap();
    const projectVisibility = new Map();
    document.querySelectorAll('.project-poster').forEach((poster) => {
      if (poster.dataset.youtubeId) {
        if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return;
        const wrapper = poster.parentElement;
        let preview = null;
        wrapper.addEventListener('pointerenter', (event) => {
          if (event.pointerType !== 'mouse' || preview) return;
          stopActiveYouTubePlayer();
          stopActiveProjectVideo();
          preview = createYouTubeFrame(poster, 'project-youtube-preview');
          wrapper.insertBefore(preview, poster);
          poster.hidden = true;
        });
        wrapper.addEventListener('click', (event) => {
          if (event.target.closest('.project-open')) return;
          if (!poster.contains(event.target)) return;
          if (preview === activeYouTubePlayer) return;
          event.preventDefault();
          preview = playYouTubeWithSound(wrapper, poster, preview, 'project-youtube-preview');
        });
        wrapper.addEventListener('pointerleave', () => {
          if (preview === activeYouTubePlayer) return;
          if (preview) preview.remove();
          preview = null;
          poster.hidden = false;
        });
        return;
      }
      const videoUrl = poster.dataset.video;
      if (!videoUrl) return;
      setPosterFrame(poster, videoUrl);
      const openInlinePlayer = (withSound = false) => {
        const video = poster.parentElement.querySelector('.project-video');
        if (!video) return video;
        if (!video.hidden) {
          if (withSound) {
            video.muted = false;
            video.volume = 1;
            video.controls = true;
          }
          return video;
        }
        stopActiveYouTubePlayer();
        activateProjectVideo(video);
        video.src = poster.dataset.video;
        video.hidden = false;
        poster.hidden = true;
        video.muted = !withSound;
        video.controls = withSound;
        video.play().catch((error) => {
          console.error(`Could not autoplay project video "${video.title}".`, error);
          video.hidden = true;
          poster.hidden = false;
          video.removeAttribute('src');
          video.load();
          if (activeProjectVideo === video) activeProjectVideo = null;
        });
        return video;
      };
      openProjectVideo.set(poster, openInlinePlayer);
      poster.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') openInlinePlayer();
      });
      poster.addEventListener('click', (event) => {
        event.preventDefault();
        openInlinePlayer(true);
      });
      poster.parentElement.querySelector('.project-video')?.addEventListener('click', () => {
        const video = poster.parentElement.querySelector('.project-video');
        video.muted = false;
        video.volume = 1;
        video.controls = true;
      });
    });

    if ('IntersectionObserver' in window) {
      const mobileReelObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => projectVisibility.set(entry.target, entry.intersectionRatio));
        if (!window.matchMedia('(max-width: 600px)').matches) return;

        const currentPoster = activeProjectVideo?.parentElement.querySelector('.project-poster');
        if (currentPoster && (projectVisibility.get(currentPoster.closest('.project-card')) || 0) >= 0.35) return;
        if (activeProjectVideo) stopActiveProjectVideo();

        const nextPoster = Array.from(projectVisibility.entries())
          .filter(([card, ratio]) => ratio >= 0.6 && !card.hidden)
          .sort((a, b) => b[1] - a[1])[0]?.[0]
          .querySelector('.project-poster');
        if (nextPoster) openProjectVideo.get(nextPoster)?.();
      }, { threshold: [0, 0.35, 0.6, 0.8] });

      projectCards.forEach((card) => mobileReelObserver.observe(card));
    }

    const projectDialog = document.querySelector('.project-dialog');
    document.querySelectorAll('.project-open').forEach((button) => {
      button.addEventListener('click', (event) => {
        if (button.dataset.project) {
          event.preventDefault();
          document.querySelector('#dialog-title').textContent = button.dataset.project;
          document.querySelector('#dialog-kind').textContent = button.dataset.kind;
          document.querySelector('#dialog-image').src = button.dataset.image;
          document.querySelector('#dialog-image').alt = button.dataset.project;
          projectDialog.showModal();
          return;
        }
        window.open(button.href, '_blank', 'noopener,noreferrer');
        event.preventDefault();
      });
    });
    document.querySelector('.dialog-close').addEventListener('click', () => projectDialog.close());
    projectDialog.addEventListener('click', (event) => {
      if (event.target === projectDialog) projectDialog.close();
    });
    document.querySelector('#year').textContent = new Date().getFullYear();

    const toolsSection = document.querySelector('.tools-section');
    if ('IntersectionObserver' in window) {
      const toolsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => toolsSection.classList.toggle('is-visible', entry.isIntersecting));
      }, { threshold: 0.25 });
      toolsObserver.observe(toolsSection);
    } else {
      toolsSection.classList.add('is-visible');
    }
}

Promise.resolve()
  .then(loadPageSections)
  .then(initializePortfolio)
  .catch((error) => {
    console.error('Portfolio initialization failed.', error);
    const message = document.createElement('p');
    message.className = 'section-load-error';
    message.setAttribute('role', 'alert');
    message.textContent = 'The portfolio sections could not load. Open this site through a local web server and refresh.';
    document.querySelector('#page-sections')?.replaceChildren(message);
  });
