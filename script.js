/*
    Landed by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

document.addEventListener('DOMContentLoaded', function () {


    // Scrolly links
    const scrollyLinks = document.querySelectorAll('.scrolly');
    scrollyLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Parallax Effect
    const banner = document.getElementById('banner');
    window.addEventListener('scroll', function () {
        if (window.innerWidth > 980) {
            const scrollValues = window.scrollY;
            if (banner) {
                banner.style.backgroundPosition = `center ${scrollValues * 0.5}px`;
            }
        } else {
            if (banner) banner.style.backgroundPosition = 'center center';
        }
    });

    // MOBILE MENU LOGIC
    const header = document.getElementById('header');
    const nav = document.getElementById('nav');
    // Select ALL triggers to handle potential duplicates safely
    const triggers = document.querySelectorAll('.navPanelToggle');


    if (triggers.length > 0 && nav) {
        triggers.forEach(toggle => {
            // Remove any existing listeners by cloning (optional, but ensures clean slate if re-run)
            // const newToggle = toggle.cloneNode(true);
            // toggle.parentNode.replaceChild(newToggle, toggle);

            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Toggle the class on the nav
                if (nav.classList.contains('navPanel-visible')) {
                    nav.classList.remove('navPanel-visible');
                } else {
                    nav.classList.add('navPanel-visible');
                }

                // Update Icons
                triggers.forEach(t => {
                    const icon = t.querySelector('i');
                    if (icon) {
                        if (nav.classList.contains('navPanel-visible')) {
                            icon.classList.remove('fa-bars');
                            icon.classList.add('fa-times');
                        } else {
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                    }
                });
            });
            // Ensure pointer cursor
            toggle.style.cursor = 'pointer';
        });

        // Close when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('navPanel-visible');
                // Reset icons
                triggers.forEach(t => {
                    const icon = t.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
            });
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (nav.classList.contains('navPanel-visible')) {
                let clickedInsideNav = nav.contains(e.target);
                let clickedInsideTrigger = false;
                triggers.forEach(t => {
                    if (t.contains(e.target)) clickedInsideTrigger = true;
                });

                if (!clickedInsideNav && !clickedInsideTrigger) {
                    nav.classList.remove('navPanel-visible');
                    triggers.forEach(t => {
                        const icon = t.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                    });
                }
            }
        });
    } else {
        console.error('Mobile menu init failed: Missing elements');
    }

    // Header Scroll State
    window.addEventListener('scroll', function () {
        if (header) {
            if (window.scrollY > 0) {
                header.classList.add('alt');
            } else {
                header.classList.remove('alt');
            }
        }
    });

    // Form handling
    const form = document.querySelector('form.cta');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = form.querySelector('input[type="submit"]');
            const originalVal = btn.value;
            btn.value = 'Thanks for subscribing!';
            btn.style.backgroundColor = '#4caf50';

            setTimeout(() => {
                btn.value = originalVal;
                btn.style.backgroundColor = '';
                form.reset();
            }, 3000);
        });
    }

});

window.addEventListener('load', function () {
    document.body.classList.remove('is-preload');
});
