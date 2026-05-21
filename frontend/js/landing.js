const statNodes = document.querySelectorAll("[data-stat-target]");
const revealNodes = document.querySelectorAll("[data-reveal]");
const headerNode = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navOverlay = document.querySelector("[data-nav-overlay]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const testimonialText = document.querySelector("[data-testimonial-text]");
const testimonialName = document.querySelector("[data-testimonial-name]");
const testimonialRole = document.querySelector("[data-testimonial-role]");
const testimonialDots = document.querySelectorAll("[data-testimonial-dot]");

const testimonials = [
  {
    quote:
      "VRR turned our engagement celebration into something cinematic and deeply personal. Every transition felt calm, polished, and completely under control.",
    name: "Naina & Raghav",
    role: "Engagement Clients",
  },
  {
    quote:
      "Their coordination rhythm was remarkable. Vendors were aligned, the run sheet was crystal clear, and our family actually got to enjoy the evening.",
    name: "Mehul Shah",
    role: "Wedding Host",
  },
  {
    quote:
      "We came in with a broad idea and a tight deadline. VRR built a launch event that felt premium, intentional, and operationally effortless.",
    name: "Aditi Rao",
    role: "Brand Marketing Lead",
  },
];

let activeTestimonialIndex = 0;
let testimonialTimerId = null;

const animateCounter = (node) => {
  const target = Number(node.dataset.statTarget || "0");
  const suffix = node.dataset.statSuffix || "";
  const duration = 1400;
  const startTime = performance.now();

  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(target * eased);
    node.textContent = `${currentValue}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

const openMenu = () => {
  headerNode.classList.add("is-open");
  document.body.classList.add("menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
  navOverlay.hidden = false;
};

const closeMenu = () => {
  headerNode.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  navOverlay.hidden = true;
};

const renderTestimonial = (index) => {
  const testimonial = testimonials[index];
  testimonialText.textContent = testimonial.quote;
  testimonialName.textContent = testimonial.name;
  testimonialRole.textContent = testimonial.role;

  testimonialDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
    dot.setAttribute("aria-pressed", String(dotIndex === index));
  });
};

const setActiveTestimonial = (index) => {
  activeTestimonialIndex = index;
  renderTestimonial(activeTestimonialIndex);
};

const startTestimonialRotation = () => {
  testimonialTimerId = window.setInterval(() => {
    const nextIndex = (activeTestimonialIndex + 1) % testimonials.length;
    setActiveTestimonial(nextIndex);
  }, 5200);
};

if (menuToggle && navOverlay) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      closeMenu();
      return;
    }
    openMenu();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

if (testimonialText && testimonialName && testimonialRole && testimonialDots.length) {
  renderTestimonial(activeTestimonialIndex);
  startTestimonialRotation();

  testimonialDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const nextIndex = Number(dot.dataset.testimonialDot || "0");
      window.clearInterval(testimonialTimerId);
      setActiveTestimonial(nextIndex);
      startTestimonialRotation();
    });
  });
}

if (window.IntersectionObserver) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");

        if (entry.target.hasAttribute("data-stat-target")) {
          animateCounter(entry.target);
        }

        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
    }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
  statNodes.forEach((node) => {
    if (!revealNodes.length || !node.hasAttribute("data-reveal")) {
      revealObserver.observe(node);
    }
  });
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
  statNodes.forEach((node) => animateCounter(node));
}
