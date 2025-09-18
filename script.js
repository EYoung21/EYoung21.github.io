// Modern Portfolio JavaScript
// Eli Young - Interactive Features

class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupScrollAnimations();
        this.setupMobileMenu();
        this.setupCounterAnimations();
        this.setupSkillsVisualization();
        this.setup3DBackground();
        this.setupTypingAnimation();
        this.setupSmoothScrolling();
    }

    // Theme Toggle Functionality
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add transition effect
            document.body.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
    }

    // Scroll-triggered animations using GSAP
    setupScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Animate elements on scroll
        gsap.utils.toArray('.animate-on-scroll').forEach((element, i) => {
            const delay = element.dataset.delay || 0;
            
            gsap.fromTo(element, 
                {
                    opacity: 0,
                    y: 50,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    delay: delay,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: element,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Parallax effect for hero section
        gsap.to('.floating-card', {
            y: -100,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });

        // Basketball court animation
        gsap.to('.basketball-hoop', {
            rotation: 360,
            duration: 20,
            repeat: -1,
            ease: "none"
        });
    }

    // Mobile menu functionality
    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }
    }


    // Counter animations for stats
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            // Skip animation for text-based stats
            if (counter.classList.contains('stat-text')) {
                return;
            }
            
            const target = parseInt(counter.dataset.target);
            
            // Skip if no valid target
            if (isNaN(target)) {
                return;
            }
            
            const increment = target / 100;
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            // Start animation when element comes into view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(counter);
        });
    }

    // Skills visualization with Canvas
    setupSkillsVisualization() {
        const canvas = document.getElementById('skills-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let animationId;
        
        // Set canvas size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Skill data
        const skills = [
            { name: 'Python', level: 0.95, x: 0, y: 0, vx: 0, vy: 0 },
            { name: 'JavaScript', level: 0.85, x: 0, y: 0, vx: 0, vy: 0 },
            { name: 'React', level: 0.90, x: 0, y: 0, vx: 0, vy: 0 },
            { name: 'Unity', level: 0.88, x: 0, y: 0, vx: 0, vy: 0 },
            { name: 'Machine Learning', level: 0.82, x: 0, y: 0, vx: 0, vy: 0 },
            { name: 'C++', level: 0.80, x: 0, y: 0, vx: 0, vy: 0 }
        ];
        
        // Initialize positions
        skills.forEach((skill, i) => {
            const angle = (i / skills.length) * Math.PI * 2;
            const radius = 100;
            skill.x = canvas.width / (2 * window.devicePixelRatio) + Math.cos(angle) * radius;
            skill.y = canvas.height / (2 * window.devicePixelRatio) + Math.sin(angle) * radius;
            skill.vx = (Math.random() - 0.5) * 2;
            skill.vy = (Math.random() - 0.5) * 2;
        });
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / (2 * window.devicePixelRatio);
            const centerY = canvas.height / (2 * window.devicePixelRatio);
            
            skills.forEach((skill, i) => {
                // Update position
                skill.x += skill.vx;
                skill.y += skill.vy;
                
                // Bounce off edges
                if (skill.x < 50 || skill.x > canvas.width / window.devicePixelRatio - 50) skill.vx *= -1;
                if (skill.y < 50 || skill.y > canvas.height / window.devicePixelRatio - 50) skill.vy *= -1;
                
                // Draw skill bubble
                const radius = 20 + skill.level * 30;
                const gradient = ctx.createRadialGradient(skill.x, skill.y, 0, skill.x, skill.y, radius);
                gradient.addColorStop(0, `hsla(${i * 60}, 70%, 60%, 0.8)`);
                gradient.addColorStop(1, `hsla(${i * 60}, 70%, 60%, 0.2)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(skill.x, skill.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw skill name
                ctx.fillStyle = '#333';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(skill.name, skill.x, skill.y + 4);
                
                // Draw connections to center
                ctx.strokeStyle = `hsla(${i * 60}, 70%, 60%, 0.3)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(skill.x, skill.y);
                ctx.stroke();
            });
            
            // Draw center node
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('ELI', centerX, centerY + 3);
            
            animationId = requestAnimationFrame(animate);
        }
        
        // Start animation when canvas is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                } else {
                    cancelAnimationFrame(animationId);
                }
            });
        });
        
        observer.observe(canvas);
    }

    // 3D Background with Three.js
    setup3DBackground() {
        if (typeof THREE === 'undefined') return;
        
        const canvas = document.getElementById('bg-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Create floating geometric shapes
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const materials = [
            new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.1 }),
            new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.1 }),
            new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.1 })
        ];
        
        const cubes = [];
        for (let i = 0; i < 50; i++) {
            const cube = new THREE.Mesh(geometry, materials[i % materials.length]);
            cube.position.x = (Math.random() - 0.5) * 100;
            cube.position.y = (Math.random() - 0.5) * 100;
            cube.position.z = (Math.random() - 0.5) * 100;
            cube.rotation.x = Math.random() * Math.PI;
            cube.rotation.y = Math.random() * Math.PI;
            scene.add(cube);
            cubes.push(cube);
        }
        
        camera.position.z = 30;
        
        function animate() {
            requestAnimationFrame(animate);
            
            cubes.forEach(cube => {
                cube.rotation.x += 0.005;
                cube.rotation.y += 0.005;
                cube.position.y += Math.sin(Date.now() * 0.001 + cube.position.x) * 0.01;
            });
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Typing animation for hero text
    setupTypingAnimation() {
        const typingElement = document.querySelector('.typing-text');
        if (!typingElement) return;
        
        const texts = [
            "Hello, I'm Eli Young",
            "Computer Science Student",
            "Game Developer",
            "ML Researcher",
            "Problem Solver"
        ];
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        function type() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typingElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && charIndex === currentText.length) {
                typeSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typeSpeed = 500; // Pause before next text
            }
            
            setTimeout(type, typeSpeed);
        }
        
        type();
    }

    // Smooth scrolling for navigation links
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});

// Add some fun easter eggs
document.addEventListener('keydown', (e) => {
    // Konami Code: ↑↑↓↓←→←→BA
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    window.konamiSequence = window.konamiSequence || [];
    window.konamiSequence.push(e.keyCode);
    
    if (window.konamiSequence.length > konamiCode.length) {
        window.konamiSequence.shift();
    }
    
    if (window.konamiSequence.join(',') === konamiCode.join(',')) {
        // Easter egg: Basketball rain
        createBasketballRain();
        window.konamiSequence = [];
    }
});

function createBasketballRain() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const basketball = document.createElement('div');
            basketball.innerHTML = '🏀';
            basketball.style.position = 'fixed';
            basketball.style.top = '-50px';
            basketball.style.left = Math.random() * window.innerWidth + 'px';
            basketball.style.fontSize = '2rem';
            basketball.style.zIndex = '9999';
            basketball.style.pointerEvents = 'none';
            basketball.style.animation = 'fall 3s linear forwards';
            
            document.body.appendChild(basketball);
            
            setTimeout(() => {
                basketball.remove();
            }, 3000);
        }, i * 200);
    }
}

// Add CSS for basketball rain animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
        }
    }
`;
document.head.appendChild(style);
