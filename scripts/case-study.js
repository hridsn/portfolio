(function() {
    function initStackedHighlights() {
        const sections = document.querySelectorAll(".stacked-highlight");
        if (sections.length === 0) return;

        sections.forEach(section => {
            const textContainers = section.querySelectorAll(".text-container");
            const texts = textContainers.length > 0 ? textContainers : section.querySelectorAll(".text");
            const videos = Array.from(section.querySelectorAll("video"));
            const imgs = Array.from(section.querySelectorAll("img"));

            if (texts.length === 0) return;

            const isVideoType = videos.length > 0;
            const isImageType = imgs.length > 0 && !isVideoType;

            if (!isVideoType && !isImageType) return;

            let activeIndex = -1;

            // Video-specific overlay & control setup
            let videoOverlay = null;
            let videoReplayBtn = null;
            let videoNextBtn = null;

            if (isVideoType) {
                videoOverlay = document.getElementById('video-btn-wrapper') || section.querySelector('.video-btn-wrapper');
                if (videoOverlay) {
                    videoReplayBtn = videoOverlay.querySelector('.replay-btn');
                    videoNextBtn = videoOverlay.querySelector('.next-btn');
                }

                videos.forEach((video, i) => {
                    video.addEventListener('ended', () => {
                        const currentActive = activeIndex < 0 ? 0 : activeIndex;
                        if (i === currentActive && videoOverlay) {
                            videoOverlay.style.display = 'flex';
                            setTimeout(() => videoOverlay.style.opacity = '1', 10);
                            
                            if (videoNextBtn) {
                                updateNextButtonText(videoNextBtn, i, texts.length);
                            }
                        }
                    });
                });

                if (videoReplayBtn) {
                    videoReplayBtn.addEventListener('click', () => {
                        hideOverlay(videoOverlay);
                        const currentActive = activeIndex < 0 ? 0 : activeIndex;
                        if (videos[currentActive]) {
                            videos[currentActive].currentTime = 0;
                            videos[currentActive].play();
                        }
                    });
                }

                if (videoNextBtn) {
                    videoNextBtn.addEventListener('click', () => {
                        hideOverlay(videoOverlay);
                        scrollToNext(section, texts, activeIndex);
                    });
                }
            }

            // Image-specific setup & timers
            let imageNextBtn = null;
            let imagePrevBtn = null;
            let delayTimer = null;
            let finalTimer = null;

            if (isImageType) {
                imageNextBtn = section.querySelector('.image-next-btn');

                if (imageNextBtn) {
                    imageNextBtn.addEventListener('click', () => {
                        scrollToNext(section, texts, activeIndex);
                    });
                }
            }

            function clearImageTimers() {
                clearTimeout(delayTimer);
                clearTimeout(finalTimer);
            }

            function fadeImg(img, val) {
                if (img) img.style.opacity = val;
            }

            // Handler triggered when section active index changes
            function onActiveIndexChange(newIndex, prevIndex) {
                if (isVideoType) {
                    if (prevIndex !== newIndex && videoOverlay) {
                        hideOverlay(videoOverlay);
                    }

                    if (newIndex === -1) {
                        videos.forEach((video, i) => {
                            video.style.opacity = '1';
                            if (i === 0) {
                                video.play().catch(e => console.warn("Autoplay prevented:", e));
                            } else {
                                video.pause();
                            }
                        });
                    } else {
                        videos.forEach((video, i) => {
                            if (i < newIndex) {
                                video.style.opacity = '0';
                                video.pause();
                            } else if (i === newIndex) {
                                video.style.opacity = '1';
                                video.play().catch(e => console.warn("Autoplay prevented:", e));
                            } else {
                                video.style.opacity = '1';
                                video.pause();
                            }
                        });
                    }
                } else if (isImageType) {
                    clearImageTimers();

                    if (newIndex === -1) {
                        imgs.forEach(img => fadeImg(img, '1'));
                    } else if (newIndex === 0) {
                        imgs.forEach(img => fadeImg(img, '1'));
                        delayTimer = setTimeout(() => {
                            fadeImg(imgs[0], '0');
                            if (imgs[1] && imgs[1].src && imgs[1].src.includes('.gif')) {
                                restartGif(imgs[1]);
                            }
                        }, 300);
                        for (let i = 1; i < imgs.length; i++) fadeImg(imgs[i], '1');
                    } else {
                        for (let i = 0; i <= newIndex; i++) fadeImg(imgs[i], '0');
                        for (let i = newIndex + 1; i < imgs.length; i++) fadeImg(imgs[i], '1');

                        const revealedImg = imgs[newIndex + 1];
                        if (revealedImg && revealedImg.src && revealedImg.src.includes('.gif')) {
                            restartGif(revealedImg);
                        }

                        if (newIndex === texts.length - 1 && imgs.length > texts.length + 1) {
                            const secondLastImgIndex = imgs.length - 2;
                            finalTimer = setTimeout(() => {
                                fadeImg(imgs[secondLastImgIndex], '0');
                                const lastImg = imgs[imgs.length - 1];
                                if (lastImg && lastImg.src && lastImg.src.includes('.gif')) {
                                    restartGif(lastImg);
                                }
                            }, 2500);
                        }
                    }
                }
            }

            // Shared scroll tracking loop for this section
            function updateScroll() {
                const viewportCenter = window.innerHeight / 2;
                let newActiveIndex = -1;

                const firstTextRect = texts[0].getBoundingClientRect();
                if (firstTextRect.top > viewportCenter) {
                    newActiveIndex = -1;
                } else {
                    newActiveIndex = getNearestTextIndex(texts, viewportCenter);
                }

                if (isImageType && imageNextBtn) {
                    updateNextButtonText(imageNextBtn, newActiveIndex, texts.length);
                }

                if (activeIndex !== newActiveIndex) {
                    const prev = activeIndex;
                    activeIndex = newActiveIndex;
                    onActiveIndexChange(activeIndex, prev);
                }
            }

            window.addEventListener('scroll', updateScroll, { passive: true });
            window.addEventListener('resize', updateScroll, { passive: true });
            updateScroll();
        });
    }

    // Helper functions
    function getNearestTextIndex(texts, viewportCenter) {
        let minDistance = Infinity;
        let index = -1;
        texts.forEach((text, i) => {
            const rect = text.getBoundingClientRect();
            const textCenter = rect.top + rect.height / 2;
            const distance = Math.abs(textCenter - viewportCenter);
            if (distance < minDistance) {
                minDistance = distance;
                index = i;
            }
        });
        return index;
    }

    function scrollToNext(section, texts, activeIndex) {
        const targetIndex = activeIndex < 0 ? 0 : activeIndex + 1;
        if (targetIndex < texts.length) {
            const nextText = texts[targetIndex];
            const top = nextText.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + (nextText.offsetHeight / 2);
            window.scrollTo({ top, behavior: 'smooth' });
        } else {
            const top = section.getBoundingClientRect().bottom + window.scrollY;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    function updateNextButtonText(btn, activeIndex, totalCount) {
        if (!btn) return;
        if (activeIndex === totalCount - 1) {
            btn.innerHTML = 'Continue <i class="fa-solid fa-arrow-down"></i>';
        } else {
            btn.innerHTML = 'Next <i class="fa-solid fa-arrow-down"></i>';
        }
    }

    function hideOverlay(overlay) {
        if (!overlay) return;
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.style.opacity === '0') overlay.style.display = 'none';
        }, 300);
    }

    function restartGif(img) {
        if (!img) return;
        const currentSrc = img.getAttribute('data-original-src') || img.src;
        if (!currentSrc || !currentSrc.includes('.gif')) return;

        if (!img.getAttribute('data-original-src')) {
            img.setAttribute('data-original-src', currentSrc.split('?')[0]);
        }

        const cleanSrc = img.getAttribute('data-original-src');
        img.src = cleanSrc + '?t=' + Date.now();
    }

    function restartRevealedGifs(container) {
        if (!container.classList.contains('section-container')) return;
        if (container.closest('.stacked-highlight')) return;

        const gifs = Array.from(container.querySelectorAll('img')).filter(img =>
            img.src && img.src.includes('.gif')
        );
        gifs.forEach(gif => {
            const delay = parseInt(gif.style.getPropertyValue('--delay')) || 0;
            setTimeout(() => {
                restartGif(gif);
            }, delay);
        });
    }

    function autoplayRevealedVideos(container) {
        if (!container.classList.contains('section-container')) return;
        if (container.closest('.stacked-highlight')) return;

        const videos = container.querySelectorAll('video');
        if (videos.length === 0) return;

        // Find the max --delay across all content in this container
        let maxDelay = 0;
        container.querySelectorAll('[style*="--delay"]').forEach(el => {
            const delay = parseInt(el.style.getPropertyValue('--delay')) || 0;
            if (delay > maxDelay) maxDelay = delay;
        });

        // Play after the last element's fade-in animation finishes
        const playDelay = maxDelay + 500;

        videos.forEach(video => {
            setTimeout(() => {
                video.play().catch(e => console.warn('Video autoplay prevented:', e));
            }, playDelay);
        });
    }

    function initScrollReveal() {
        const sections = document.querySelectorAll(
            '.case-study .section, .stacked-highlight .text'
        );

        if (sections.length === 0) return;

        const revealTargets = [];

        sections.forEach(section => {
            let sectionContainers = Array.from(section.querySelectorAll('.section-container'));
            
            // Section itself gets observed for section reveal (bg reveal)
            revealTargets.push(section);

            if (sectionContainers.length > 0) {
                sectionContainers.forEach(secContainer => {
                    revealTargets.push(secContainer);
                });
            } else {
                sectionContainers = [section];
            }

            sectionContainers.forEach(secContainer => {
                let innerDivs = Array.from(secContainer.children).filter(child => child.tagName === 'DIV');
                if (innerDivs.length === 0) {
                    innerDivs = [secContainer];
                }

                innerDivs.forEach(div => {
                    let currentDelay = 0;
                    let medFound = false;

                    const contentElements = div.querySelectorAll('h1, h2, h3, h4, h5, p, ul, ol, img, video, .action-btn');
                    contentElements.forEach((el,index) => {
                        currentDelay += 200; // Base jump

                        if(index > 0) {
                            if (el.matches('p.medium') || el.classList.contains('medium')) {
                                currentDelay += 500;
                                medFound = true;
                            } else if (el.matches('p.large') || el.classList.contains('large')) {
                                if (!medFound) currentDelay += 500;
                                if (!!medFound) currentDelay += 800;
                            }
                        }

                        el.style.setProperty('--delay', `${currentDelay}ms`);
                    });
                });
            });
        });

        if (!('IntersectionObserver' in window)) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -150px 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    autoplayRevealedVideos(entry.target);
                    restartRevealedGifs(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            // If already inside the visible viewport area, reveal immediately
            if (rect.top < window.innerHeight - 20 && rect.bottom > 0) {
                target.classList.add('revealed');
                autoplayRevealedVideos(target);
                restartRevealedGifs(target);
            } else {
                observer.observe(target);
            }
        });
    }

    function initPage() {
        initStackedHighlights();
        initScrollReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    function attachSwupListener() {
        if (window.swup && window.swup.hooks && typeof window.swup.hooks.on === 'function') {
            window.swup.hooks.on('page:view', () => {
                requestAnimationFrame(() => {
                    initPage();
                });
            });
            return true;
        }
        return false;
    }

    if (!attachSwupListener()) {
        window.addEventListener('DOMContentLoaded', attachSwupListener);
        // Polling check for the moment window.swup is created
        const swupCheckInterval = setInterval(() => {
            if (attachSwupListener()) {
                clearInterval(swupCheckInterval);
            }
        }, 50);
        setTimeout(() => clearInterval(swupCheckInterval), 5000);
    }
})();

