// Interactive Landing Page JavaScript
class LandingPage {
    constructor() {
        this.currentSection = 0;
        this.totalSections = 4;
        this.isScrolling = false;
        this.init();
    }

    init() {
        this.setupLoadingScreen();
        this.setupCustomCursor();
        this.setupParticleSystem();
        this.setup3DBackground();
        this.setupNavigation();
        this.setupScrolling();
        this.setupAnimations();
        this.setupInteractiveElements();
    }

    // Loading Screen
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        const messages = [
            'Initializing portfolio...',
            'Loading experiences...',
            'Preparing projects...',
            'Almost ready...',
            'Welcome!'
        ];
        
        let progress = 0;
        let messageIndex = 0;
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    this.startLandingAnimations();
                }, 500);
            }
            
            progressBar.style.width = progress + '%';
            
            if (progress > messageIndex * 20 && messageIndex < messages.length - 1) {
                messageIndex++;
                loadingText.textContent = messages[messageIndex];
            }
        }, 100);
    }

    // Custom Cursor
    setupCustomCursor() {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        const animateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            document.body.style.setProperty('--cursor-x', cursorX + 'px');
            document.body.style.setProperty('--cursor-y', cursorY + 'px');
            
            requestAnimationFrame(animateCursor);
        };
        
        animateCursor();
        
        // Update cursor position via CSS custom properties
        const style = document.createElement('style');
        style.textContent = `
            body::after {
                left: var(--cursor-x, 0px);
                top: var(--cursor-y, 0px);
            }
        `;
        document.head.appendChild(style);
    }

    // Particle System
    setupParticleSystem() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(particlesContainer);
        }
        
        setInterval(() => {
            this.createParticle(particlesContainer);
        }, 2000);
    }
    
    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 1;
        const startX = Math.random() * window.innerWidth;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            left: ${startX}px;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, (duration + delay) * 1000);
    }

    // 3D Background with Three.js
    setup3DBackground() {
        if (typeof THREE === 'undefined') return;
        
        const canvas = document.getElementById('landing-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Create geometric shapes
        const geometries = [
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.SphereGeometry(0.7, 32, 32),
            new THREE.ConeGeometry(0.7, 1.5, 32),
            new THREE.TorusGeometry(0.7, 0.3, 16, 100)
        ];
        
        const materials = [
            new THREE.MeshBasicMaterial({ 
                color: 0x2563eb, 
                transparent: true, 
                opacity: 0.1,
                wireframe: true 
            }),
            new THREE.MeshBasicMaterial({ 
                color: 0x06b6d4, 
                transparent: true, 
                opacity: 0.1,
                wireframe: true 
            }),
            new THREE.MeshBasicMaterial({ 
                color: 0x8b5cf6, 
                transparent: true, 
                opacity: 0.1,
                wireframe: true 
            })
        ];
        
        const meshes = [];
        
        for (let i = 0; i < 30; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = materials[Math.floor(Math.random() * materials.length)];
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.x = (Math.random() - 0.5) * 100;
            mesh.position.y = (Math.random() - 0.5) * 100;
            mesh.position.z = (Math.random() - 0.5) * 100;
            
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            
            scene.add(mesh);
            meshes.push(mesh);
        }
        
        camera.position.z = 30;
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            meshes.forEach((mesh, index) => {
                mesh.rotation.x += 0.005 + index * 0.0001;
                mesh.rotation.y += 0.005 + index * 0.0001;
                mesh.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
            });
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Navigation
    setupNavigation() {
        const dots = document.querySelectorAll('.nav-dots .dot');
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSection(index);
            });
        });
    }

    // Scrolling
    setupScrolling() {
        let touchStartY = 0;
        
        // Mouse wheel
        document.addEventListener('wheel', (e) => {
            if (this.isScrolling) return;
            
            if (e.deltaY > 0) {
                this.nextSection();
            } else {
                this.prevSection();
            }
        });
        
        // Touch events - only for desktop-like behavior
        document.addEventListener('touchstart', (e) => {
            // Skip if touch is within preview grid (allow horizontal scrolling)
            if (e.target.closest('.preview-grid')) return;
            
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.isScrolling) return;
            
            // Skip if touch is within preview grid (allow horizontal scrolling)
            if (e.target.closest('.preview-grid')) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            // Only trigger section navigation on desktop or for large swipes
            if (Math.abs(diff) > 50 && window.innerWidth > 768) {
                if (diff > 0) {
                    this.nextSection();
                } else {
                    this.prevSection();
                }
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isScrolling) return;
            
            switch(e.key) {
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    this.nextSection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.prevSection();
                    break;
            }
        });
    }

    nextSection() {
        if (this.currentSection < this.totalSections - 1) {
            this.goToSection(this.currentSection + 1);
        }
    }

    prevSection() {
        if (this.currentSection > 0) {
            this.goToSection(this.currentSection - 1);
        }
    }

    goToSection(index) {
        if (this.isScrolling || index === this.currentSection) return;
        
        this.isScrolling = true;
        
        // Update dots
        document.querySelectorAll('.nav-dots .dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Update sections
        document.querySelectorAll('.landing-section').forEach((section, i) => {
            section.classList.toggle('active', i === index);
        });
        
        this.currentSection = index;
        
        // Trigger section-specific animations
        this.triggerSectionAnimations(index);
        
        setTimeout(() => {
            this.isScrolling = false;
        }, 800);
    }

    // Animations
    startLandingAnimations() {
        // Animate first section
        this.triggerSectionAnimations(0);
    }

    triggerSectionAnimations(sectionIndex) {
        switch(sectionIndex) {
            case 0:
                this.animateWelcomeSection();
                break;
            case 1:
                this.animatePreviewSection();
                break;
            case 2:
                this.animateTechSection();
                break;
            case 3:
                this.animateEnterSection();
                break;
        }
    }

    animateWelcomeSection() {
        const title = document.querySelector('.glitch-text');
        const words = document.querySelectorAll('.word');
        
        if (title) {
            title.style.animation = 'none';
            setTimeout(() => {
                title.style.animation = 'glitch 3s infinite';
            }, 100);
        }
        
        words.forEach((word, index) => {
            word.style.animation = 'none';
            setTimeout(() => {
                word.style.animation = `wordReveal 0.6s ease forwards`;
                word.style.animationDelay = `${index * 0.1}s`;
            }, 200);
        });
    }

    animatePreviewSection() {
        const cards = document.querySelectorAll('.preview-card');
        
        cards.forEach((card, index) => {
            card.style.transform = 'translateY(50px)';
            card.style.opacity = '0';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.transform = 'translateY(0)';
                card.style.opacity = '1';
            }, index * 200);
        });
    }

    animateTechSection() {
        const nodes = document.querySelectorAll('.tech-node');
        
        nodes.forEach((node, index) => {
            node.style.transform = 'scale(0)';
            
            setTimeout(() => {
                node.style.transition = 'transform 0.5s ease';
                node.style.transform = 'scale(1)';
            }, index * 100);
        });
    }

    animateEnterSection() {
        const enterBtn = document.querySelector('.enter-btn');
        const quickLinks = document.querySelectorAll('.quick-link');
        const socialLinks = document.querySelectorAll('.social-link');
        
        if (enterBtn) {
            enterBtn.style.transform = 'translateY(30px)';
            enterBtn.style.opacity = '0';
            
            setTimeout(() => {
                enterBtn.style.transition = 'all 0.6s ease';
                enterBtn.style.transform = 'translateY(0)';
                enterBtn.style.opacity = '1';
            }, 200);
        }
        
        quickLinks.forEach((link, index) => {
            link.style.transform = 'translateY(20px)';
            link.style.opacity = '0';
            
            setTimeout(() => {
                link.style.transition = 'all 0.4s ease';
                link.style.transform = 'translateY(0)';
                link.style.opacity = '1';
            }, 400 + index * 100);
        });
        
        socialLinks.forEach((link, index) => {
            link.style.transform = 'scale(0)';
            
            setTimeout(() => {
                link.style.transition = 'transform 0.3s ease';
                link.style.transform = 'scale(1)';
            }, 800 + index * 100);
        });
    }

    // Interactive Elements
    setupInteractiveElements() {
        // Preview cards hover effects
        const previewCards = document.querySelectorAll('.preview-card');
        previewCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.createHoverParticles(card);
            });
        });
        
        // Tech nodes interaction
        const techNodes = document.querySelectorAll('.tech-node');
        techNodes.forEach(node => {
            node.addEventListener('click', () => {
                this.techNodeClick(node);
            });
        });
        
        // Enter button particles
        const enterBtn = document.querySelector('.enter-btn');
        if (enterBtn) {
            enterBtn.addEventListener('mouseenter', () => {
                this.createButtonParticles(enterBtn);
            });
        }
    }

    createHoverParticles(element) {
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: #06b6d4;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                animation: particleFloat 1s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
        
        // Add particle animation if not exists
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes particleFloat {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-50px) scale(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    techNodeClick(node) {
        const tech = node.dataset.tech;
        
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(37, 99, 235, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        node.style.position = 'relative';
        node.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
        
        // Add ripple animation if not exists
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    100% {
                        width: 120px;
                        height: 120px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createButtonParticles(button) {
        const particlesContainer = button.querySelector('.btn-particles');
        if (!particlesContainer) return;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: white;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: btnParticle 2s ease-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            
            particlesContainer.appendChild(particle);
        }
        
        // Add button particle animation if not exists
        if (!document.getElementById('btn-particle-styles')) {
            const style = document.createElement('style');
            style.id = 'btn-particle-styles';
            style.textContent = `
                @keyframes btnParticle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Clean up particles after animation
        setTimeout(() => {
            particlesContainer.innerHTML = '';
        }, 4000);
    }
}

// Initialize the landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
});

// Prevent default scroll behavior only on desktop
document.addEventListener('wheel', (e) => {
    // Only prevent on desktop, allow on mobile
    if (window.innerWidth > 768) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    // Allow scrolling within preview grids on mobile
    const isInPreviewGrid = e.target.closest('.preview-grid');
    
    if (window.innerWidth <= 768) {
        // On mobile, only prevent if NOT in a preview grid
        if (!isInPreviewGrid) {
            e.preventDefault();
        }
    } else {
        // On desktop, always prevent
        e.preventDefault();
    }
}, { passive: false });
