const navBtns = document.querySelectorAll<HTMLButtonElement>(".nav-btn");
const toggledPopup: Record<string, boolean> = {};

const isMobile = () => window.innerWidth <= 768;

navBtns.forEach((btn) => {
  const popupId = btn.dataset.popup!;

  btn.addEventListener("click", () => {
    if (isMobile()) {
      // On mobile, redirect to the full page
      window.location.href = `/${popupId}`;
    } else {
      // On desktop, show pop-up
      const popup = document.getElementById(`${popupId}-popup`)!;
      const indicator =
        btn.parentElement!.querySelector<HTMLImageElement>(".nav-indicator")!;

      // Close other pop-ups
      Object.keys(toggledPopup).forEach((otherId) => {
        if (otherId !== popupId) {
          toggledPopup[otherId] = false;
          const otherPopup = document.getElementById(`${otherId}-popup`)!;
          const otherBtn = document.querySelector<HTMLButtonElement>(
            `[data-popup="${otherId}"]`,
          )!;
          const otherIndicator =
            otherBtn.parentElement!.querySelector<HTMLImageElement>(
              ".nav-indicator",
            )!;
          otherPopup.classList.remove("active");
          otherIndicator.classList.remove("active");
        }
      });

      // Toggle this popup
      if (toggledPopup[popupId]) {
        toggledPopup[popupId] = false;
        popup.classList.remove("active");
        indicator.classList.remove("active");
      } else {
        toggledPopup[popupId] = true;
        popup.classList.add("active");
        indicator.classList.add("active");
      }
    }
  });

  btn.addEventListener("mouseenter", () => {
    if (!isMobile()) {
      // Only show hover preview on desktop if no popup is currently toggled
      const isAnyToggled = Object.values(toggledPopup).some((val) => val);
      if (!isAnyToggled) {
        const popup = document.getElementById(`${popupId}-popup`)!;
        popup.classList.add("active");
      }
    }
  });

  btn.addEventListener("mouseleave", () => {
    if (!isMobile()) {
      const navItemWrapper = btn.parentElement!;
      const popup = document.getElementById(`${popupId}-popup`)!;
      // Hide popup when mouse leaves the nav item
      if (!toggledPopup[popupId]) {
        popup.classList.remove("active");
      }
    }
  });

  // Handle resize to update behavior
  window.addEventListener("resize", () => {
    const popup = document.getElementById(`${popupId}-popup`)!;
    const indicator =
      btn.parentElement!.querySelector<HTMLImageElement>(".nav-indicator")!;
    if (isMobile() && toggledPopup[popupId]) {
      toggledPopup[popupId] = false;
      popup.classList.remove("active");
      indicator.classList.remove("active");
    }
  });
});
