// Matter.js module aliases (using global Matter object from CDN)
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Vector } = Matter;

class PhysicsDemo {
    constructor() {
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.canvas = null;
        this.mouseConstraint = null;
        this.objects = [];
        this.isInitialized = false;
        this.images = {};
        this.imageLoadPromises = [];
        this.spawnInterval = null; // Track the spawn interval
        this.maxObjects = 16; // Fixed maximum
        
        // Don't auto-initialize, wait for explicit call
    }

    async init() {
        console.log('🚀 Initializing Physics Demo...');
        
        // Wait a bit for the DOM to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.canvas = document.getElementById('physics-canvas');
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        console.log('✅ Canvas found:', this.canvas);

        // Set canvas size immediately
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log('✅ Canvas size set:', this.canvas.width, 'x', this.canvas.height);

        // Load images first
        await this.loadImages();

        // Create engine with normal gravity for falling effect
        this.engine = Engine.create();
        this.engine.world.gravity.y = 1.2; // Stronger gravity for falling effect
        this.engine.world.gravity.x = 0;
        console.log('✅ Matter.js engine created');

        // Create renderer
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: false,
                showVelocity: false,
                showDebug: false,
                pixelRatio: window.devicePixelRatio || 1
            }
        });
        console.log('✅ Matter.js renderer created');

        // Create runner
        this.runner = Runner.create();

        // Add mouse control for dragging
        this.addMouseControl();
        console.log('✅ Mouse controls added');

        // Create world boundaries
        this.createBoundaries();
        console.log('✅ World boundaries created');

        // Start the engine and renderer
        Runner.run(this.runner, this.engine);
        Render.run(this.render);
        console.log('✅ Matter.js engine and renderer started');

        // Add event listeners
        this.addEventListeners();

        // Start spawning objects
        this.startObjectSpawning();
        console.log('✅ Object spawning started');

        this.isInitialized = true;
        console.log('🎯 Physics Demo fully initialized!');
    }

    async loadImages() {
        const imageFiles = [
            { name: 'femaleVote', path: '/PNG/female vote png.png' },
            { name: 'maleVote', path: '/PNG/male vote ticket.png' }
        ];

        this.imageLoadPromises = imageFiles.map(imageFile => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[imageFile.name] = img;
                    console.log(`✅ Loaded image: ${imageFile.name}`, img);
                    resolve(img);
                };
                img.onerror = (error) => {
                    console.error(`❌ Failed to load image: ${imageFile.path}`, error);
                    reject(error);
                };
                img.src = imageFile.path;
                console.log(`🔄 Loading image: ${imageFile.path}`);
            });
        });

        try {
            await Promise.all(this.imageLoadPromises);
            console.log('🎯 All images loaded successfully!', this.images);
        } catch (error) {
            console.error('Failed to load some images:', error);
        }
    }

    addMouseControl() {
        console.log('🖱️ Setting up mouse controls...');
        
        const mouse = Mouse.create(this.render.canvas);
        console.log('✅ Mouse created:', mouse);
        
        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.8,
                render: {
                    visible: false
                }
            }
        });
        console.log('✅ Mouse constraint created:', this.mouseConstraint);

        Composite.add(this.engine.world, this.mouseConstraint);
        console.log('✅ Mouse constraint added to world');

        // Keep the mouse in sync with rendering
        this.render.mouse = mouse;
        
        // Add mouse event debugging
        Events.on(this.mouseConstraint, 'startdrag', (event) => {
            console.log('🎯 Started dragging object:', event.body);
        });
        
        Events.on(this.mouseConstraint, 'enddrag', (event) => {
            console.log('🎯 Stopped dragging object:', event.body);
        });
        
        // Make sure mouse events are properly handled
        this.canvas.style.touchAction = 'none';
        console.log('✅ Mouse controls fully configured');
    }

    createBoundaries() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const thickness = 50;

        console.log(`🏗️ Creating simple boundaries - Screen: ${width}x${height}`);
        
        // Simple boundary system - same for all screen sizes
        const boundaries = [
            // Floor at bottom of screen
            Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                },
                label: 'floor'
            }),
            // Left wall
            Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                },
                label: 'leftWall'
            }),
            // Right wall
            Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                },
                label: 'rightWall'
            })
        ];

        Composite.add(this.engine.world, boundaries);
        console.log('✅ Simple boundaries created');
    }

    createImageObject(x, y, imageName, imageObj) {
        if (!imageObj) {
            console.error('❌ No image object provided for:', imageName);
            return null;
        }

        // Simple scaling based on screen size - slightly larger for mobile
        const isMobile = window.innerWidth <= 768;
        const scale = isMobile ? 0.05 : 0.12; // Slightly larger for mobile, larger for desktop
        
        const width = imageObj.width * scale;
        const height = imageObj.height * scale;

        console.log(`🎨 Creating ${imageName} - Mobile: ${isMobile}, Scale: ${scale}, Size: ${width}x${height}`);

        const body = Bodies.rectangle(x, y, width, height, {
            restitution: 0.6,
            friction: 0.3,
            frictionAir: 0.01,
            density: 0.001,
            render: {
                sprite: {
                    texture: imageObj.src,
                    xScale: scale,
                    yScale: scale
                }
            }
        });

        // Add some initial rotation
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

        // Store the image name and scale on the body for tracking
        body.imageName = imageName;
        body.originalScale = scale;
        
        console.log('✅ Created physics body:', body);

        return body;
    }

    startObjectSpawning() {
        // Clear any existing interval first
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        console.log('🚀 Starting simple object spawning...');
        
        // Spawn 16 objects immediately (8 male + 8 female)
        for (let i = 0; i < 16; i++) {
            setTimeout(() => {
                const imageName = i < 8 ? 'maleVote' : 'femaleVote';
                const imageObj = this.images[imageName];
                
                if (imageObj) {
                    const width = window.innerWidth;
                    const x = Math.random() * (width - 100) + 50;
                    const y = -100 - (i * 30); // Spawn from above screen
                    
                    const object = this.createImageObject(x, y, imageName, imageObj);
                    if (object) {
                        this.objects.push(object);
                        Composite.add(this.engine.world, object);
                    }
                }
            }, i * 200); // Stagger spawning
        }

        // Set up simple maintenance - just maintain 16 objects
        this.spawnInterval = setInterval(() => {
            this.maintainObjectCount();
        }, 3000);
    }

    maintainObjectCount() {
        // Clean up objects that have fallen off screen
        const height = window.innerHeight;
        const initialCount = this.objects.length;
        
        this.objects = this.objects.filter(object => {
            if (object.position.y > height + 200) {
                console.log(`🗑️ Removing object at y=${Math.round(object.position.y)}`);
                Composite.remove(this.engine.world, object);
                return false;
            }
            return true;
        });
        
        const removedCount = initialCount - this.objects.length;
        if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} objects. Remaining: ${this.objects.length}`);
        }
        
        // Count objects by type
            const maleCount = this.objects.filter(obj => obj.imageName === 'maleVote').length;
            const femaleCount = this.objects.filter(obj => obj.imageName === 'femaleVote').length;
        const totalCount = this.objects.length;
        
        console.log(`📊 Object count: Male=${maleCount}, Female=${femaleCount}, Total=${totalCount}/16`);
        
        // Only spawn if we have less than 16 total objects
        if (totalCount < 16) {
            // Determine what type to spawn based on balance
            if (maleCount < 8 && totalCount < 16) {
                this.spawnSingleObject('maleVote');
                console.log('🔄 Spawned 1 male vote object');
            } else if (femaleCount < 8 && totalCount < 16) {
                this.spawnSingleObject('femaleVote');
                console.log('🔄 Spawned 1 female vote object');
            }
            }
            
        // Safety check: remove excess objects if somehow we have too many
        if (totalCount > 16) {
            console.log(`⚠️ Too many objects (${totalCount}), removing excess...`);
            const excessCount = totalCount - 16;
            for (let i = 0; i < excessCount; i++) {
                const objectToRemove = this.objects.pop();
                if (objectToRemove) {
                    Composite.remove(this.engine.world, objectToRemove);
                }
            }
        }
    }

    spawnSingleObject(imageName) {
        // Safety check: don't spawn if we already have 16 objects
        if (this.objects.length >= 16) {
            console.log(`🚫 Not spawning ${imageName} - already have ${this.objects.length} objects`);
            return;
        }
        
        const width = window.innerWidth;
        const x = Math.random() * (width - 100) + 50;
        const y = -100; // Always spawn from top
        
        const imageObj = this.images[imageName];
        if (!imageObj) return;

        const object = this.createImageObject(x, y, imageName, imageObj);
        
        if (object) {
            object.imageName = imageName;
            this.objects.push(object);
            Composite.add(this.engine.world, object);
            console.log(`✨ Spawned new ${imageName} object (Total: ${this.objects.length}/16)`);
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const maxScroll = 500;
        const scrollRatio = Math.min(scrollY / maxScroll, 1);
        
        // Simple gravity adjustment based on scroll
        this.engine.world.gravity.y = 1.2 + (scrollRatio * 0.5);
        
        // Add some wind effect when scrolled
        if (scrollRatio > 0.3) {
            this.objects.forEach(object => {
                const windForce = {
                    x: (Math.random() - 0.5) * 0.001 * scrollRatio,
                    y: 0
                };
                Body.applyForce(object, object.position, windForce);
            });
    }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width <= 768;

        console.log(`📱 Resize detected - Mobile: ${isMobile}, Size: ${width}x${height}`);

        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;

        // Update render bounds
        this.render.bounds.max.x = width;
        this.render.bounds.max.y = height;
        this.render.options.width = width;
        this.render.options.height = height;
        this.render.canvas.width = width;
        this.render.canvas.height = height;

        // Remove old boundaries and create new ones
        const allBodies = Composite.allBodies(this.engine.world);
        const boundaries = allBodies.filter(body => 
            body.label === 'floor' || body.label === 'leftWall' || body.label === 'rightWall'
        );
        Composite.remove(this.engine.world, boundaries);

        // Create new boundaries
        this.createBoundaries();

        // Simple rescaling of existing objects
        if (this.objects.length > 0) {
            this.objects.forEach(object => {
                if (object.render && object.render.sprite) {
                    // Update scale based on current screen size - slightly larger for mobile
                    const newScale = isMobile ? 0.05 : 0.12;
                    object.render.sprite.xScale = newScale;
                    object.render.sprite.yScale = newScale;
                    object.originalScale = newScale;
                    
                    // Keep objects within screen bounds
                    if (object.position.x > width - 50) {
                        Body.setPosition(object, { x: width - 75, y: object.position.y });
                    }
                    if (object.position.x < 50) {
                        Body.setPosition(object, { x: 75, y: object.position.y });
                    }
                }
            });
        }

        console.log(`🔄 Resize complete - Current objects: ${this.objects.length}/16`);
    }

    destroy() {
        // Clean up intervals
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
            }
        
        if (this.render) {
            Render.stop(this.render);
        }
        if (this.runner) {
            Runner.stop(this.runner);
        }
        if (this.engine) {
            Engine.clear(this.engine);
        }
    }

    addEventListeners() {
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150); // Debounce resize events
        });

        // Handle orientation change specifically for mobile devices
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                console.log('📱 Orientation changed - refreshing physics demo');
            this.handleResize();
            }, 500); // Wait for orientation change to complete
        });

        // Enhanced visibility change handler to ensure objects persist
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page became visible - checking objects');
                // Only check if we have very few objects
                if (this.objects.length < 8) {
                    setTimeout(() => {
                        this.maintainObjectCount();
                    }, 1000);
                }
            }
        });

        // Add click interaction for creating new objects
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Only allow click spawning if we're under the limit
            if (this.objects.length >= this.maxObjects) return;
            
            // Count current objects by type
            const maleCount = this.objects.filter(obj => obj.imageName === 'maleVote').length;
            const femaleCount = this.objects.filter(obj => obj.imageName === 'femaleVote').length;
            
            // Choose image type based on current balance
            let imageName;
            if (maleCount < 8 && femaleCount < 8) {
                // If both are under limit, choose randomly
                imageName = Math.random() < 0.5 ? 'maleVote' : 'femaleVote';
            } else if (maleCount < 8) {
                imageName = 'maleVote';
            } else if (femaleCount < 8) {
                imageName = 'femaleVote';
            } else {
                return; // Both at limit, don't spawn
            }
            
            // Create a new object at click position
            const imageObj = this.images[imageName];
            if (imageObj) {
                const object = this.createImageObject(x, y, imageName, imageObj);
                
                if (object) {
                    object.imageName = imageName;
                    this.objects.push(object);
                    Composite.add(this.engine.world, object);
                }
            }
        });

        // Add scroll interaction with mobile-specific handling
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Simplified responsive observer - no spawning, just logging
        const setupResponsiveObserver = () => {
            const heroSection = document.querySelector('.hero');
            if (!heroSection) return;

            // Simple intersection observer for monitoring only
            let heroSectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const currentIsMobile = window.innerWidth <= 768;
                    console.log(`👁️ Hero section: ${entry.isIntersecting ? 'VISIBLE' : 'HIDDEN'}, objects: ${this.objects.length}/${this.maxObjects}, mobile: ${currentIsMobile}`);
                    
                    // Only do emergency spawning if we have very few objects
                    if (entry.isIntersecting && this.objects.length < 4) {
                        console.log('🚨 Emergency: Very few objects, triggering spawn...');
                        this.maintainObjectCount();
                    }
                });
            }, { 
                threshold: 0.1,
                rootMargin: '50px'
            });

            heroSectionObserver.observe(heroSection);
            console.log('✅ Simplified hero section observer attached');
        };

        // Setup responsive observer
        setupResponsiveObserver();

        // Add mouse drag events for visual feedback
        Events.on(this.mouseConstraint, 'startdrag', (event) => {
            const body = event.body;
            if (body && body.render && body.render.sprite) {
                // Add visual feedback when dragging
                body.render.sprite.xScale *= 1.1;
                body.render.sprite.yScale *= 1.1;
            }
        });

        Events.on(this.mouseConstraint, 'enddrag', (event) => {
            const body = event.body;
            if (body && body.render && body.render.sprite) {
                // Reset scale when drag ends
                body.render.sprite.xScale /= 1.1;
                body.render.sprite.yScale /= 1.1;
            }
        });
    }
}

// Navigation functionality
class Navigation {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        
        this.init();
    }

    init() {
        this.addScrollEffect();
        this.addSmoothScrolling();
        this.addMobileMenu();
    }

    addScrollEffect() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.navbar.style.background = 'rgba(15, 15, 15, 0.98)';
                this.navbar.style.transform = 'translateX(-50%) scale(0.95)';
                this.navbar.style.borderColor = 'rgba(230, 57, 70, 0.4)';
            } else {
                this.navbar.style.background = 'rgba(20, 20, 20, 0.95)';
                this.navbar.style.transform = 'translateX(-50%) scale(1)';
                this.navbar.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
        });
    }

    addSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                // Auto-close mobile menu when a link is clicked
                if (this.navMenu && this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    this.hamburger.classList.remove('active');
                }
            });
        });
    }

    addMobileMenu() {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.hamburger.classList.toggle('active');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                const isClickInsideNav = this.navMenu.contains(e.target) || this.hamburger.contains(e.target);
                
                if (!isClickInsideNav && this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    this.hamburger.classList.remove('active');
                }
            });
            
            // Close mobile menu when pressing Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    this.hamburger.classList.remove('active');
                }
            });
        }
    }
}

// Form handling
class FormHandler {
    constructor() {
        this.form = document.querySelector('.form');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        this.showSuccessMessage();
        this.form.reset();
    }

    showSuccessMessage() {
        const button = this.form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        button.textContent = 'Message Sent! ✓';
        button.style.background = '#00ff88';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 3000);
    }
}

// Intersection Observer for animations
class AnimationObserver {
    constructor() {
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        this.init();
    }

    init() {
        const animatedElements = document.querySelectorAll(
            '.service-card, .portfolio-item, .about-content, .contact-content'
        );
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            this.observer.observe(el);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'all 0.6s ease-out';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// Back to Top Button functionality
class BackToTopButton {
    constructor() {
        this.button = document.getElementById('back-to-top');
        this.init();
    }

    init() {
        if (this.button) {
            console.log('✅ Back to Top button found and initialized');
            this.addScrollListener();
            this.addClickListener();
        } else {
            console.warn('⚠️ Back to Top button not found');
        }
    }

    addScrollListener() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.toggleVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    toggleVisibility() {
        const scrollPosition = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        if (scrollPosition > windowHeight * 0.3) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    }

    addClickListener() {
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔝 Back to top button clicked');
            this.scrollToTop();
        });
    }

    scrollToTop() {
        // Use the modern smooth scroll API with fallback
        if ('scrollBehavior' in document.documentElement.style) {
            // Modern browsers with smooth scroll support
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        } else {
            // Fallback for older browsers
            const scrollDuration = 600;
            const startPosition = window.pageYOffset;
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / scrollDuration, 1);
                
                // Easing function for smooth animation
                const easeInOutCubic = (t) => {
                    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                };
                
                const scrollPosition = startPosition * (1 - easeInOutCubic(progress));
                window.scrollTo(0, scrollPosition);
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };
            
            requestAnimationFrame(animateScroll);
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM Content Loaded - Initializing website...');
    
    // Initialize physics demo (only if not already initialized)
    if (!window.physicsDemo) {
        console.log('🚀 Creating Physics Demo instance...');
        window.physicsDemo = new PhysicsDemo();
        window.physicsDemo.init();
    }
    
    // Initialize navigation
    const navigation = new Navigation();
    
    // Initialize form handler
    const formHandler = new FormHandler();
    
    // Initialize animation observer
    const animationObserver = new AnimationObserver();
    
    // Initialize back to top button
    const backToTopButton = new BackToTopButton();
    
    // Add some interactive button effects
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add parallax effect to hero stats
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroStats = document.querySelector('.hero-stats');
        
        if (heroStats && scrolled < window.innerHeight) {
            const rate = scrolled * -0.5;
            heroStats.style.transform = `translateY(${rate}px)`;
        }
    });
    
    console.log('🎯 Grassroots Dynamics - Political Marketing Agency Website Loaded!');
    console.log('🚀 Matter.js Physics Demo with PNG Images Active');
    console.log('✨ Interactive falling PNG objects ready');
}); 