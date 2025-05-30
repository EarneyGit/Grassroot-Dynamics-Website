import * as Matter from 'matter-js';

// Matter.js module aliases
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

        const boundaries = [
            // Ground
            Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                }
            }),
            // Left wall
            Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                }
            }),
            // Right wall
            Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
                isStatic: true,
                render: { 
                    fillStyle: 'transparent',
                    strokeStyle: 'transparent'
                }
            })
        ];

        Composite.add(this.engine.world, boundaries);
    }

    createImageObject(x, y, imageName, imageObj) {
        if (!imageObj) {
            console.error('❌ No image object provided for:', imageName);
            return null;
        }

        // Check if it's mobile view (768px or less)
        const isMobile = window.innerWidth <= 768;
        
        // Calculate size based on image dimensions (scale down for physics)
        const baseScale = 0.15; // Base scale for desktop
        const mobileScale = baseScale * 0.35; // 35% of base scale for mobile
        const scale = isMobile ? mobileScale : baseScale;
        
        const width = imageObj.width * scale;
        const height = imageObj.height * scale;

        console.log(`🎨 Creating ${imageName} object at (${x}, ${y}) with size ${width}x${height}`);

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

        // Store the image name on the body for tracking
        body.imageName = imageName;
        
        console.log('✅ Created physics body:', body);

        return body;
    }

    startObjectSpawning() {
        const isMobile = window.innerWidth <= 768;
        const initialCount = isMobile ? 4 : 8; // Fewer objects on mobile for better performance
        
        // Spawn initial objects
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => {
                // Alternate between male and female images for initial spawn
                const imageName = i % 2 === 0 ? 'maleVote' : 'femaleVote';
                const imageObj = this.images[imageName];
                
                if (imageObj) {
                    const width = window.innerWidth;
                    const x = Math.random() * (width - 200) + 100;
                    const y = -100 - (i * 50); // Stagger the initial spawn heights
                    
                    const object = this.createImageObject(x, y, imageName, imageObj);
                    if (object) {
                        this.objects.push(object);
                        Composite.add(this.engine.world, object);
                    }
                }
            }, i * 800); // Slower initial spawn
        }

        // Continue spawning objects periodically with mobile-specific logic
        setInterval(() => {
            const currentIsMobile = window.innerWidth <= 768;
            const maxObjects = currentIsMobile ? 4 : 16; // Maintain fewer objects on mobile
            const minMale = currentIsMobile ? 2 : 8;
            const minFemale = currentIsMobile ? 2 : 8;
            
            // Count current objects by type
            const maleCount = this.objects.filter(obj => obj.imageName === 'maleVote').length;
            const femaleCount = this.objects.filter(obj => obj.imageName === 'femaleVote').length;
            
            console.log(`📱 Mobile: ${currentIsMobile}, Objects: Male=${maleCount}, Female=${femaleCount}, Total=${this.objects.length}`);
            
            // Spawn based on what's needed to maintain balance
            if (maleCount < minMale) {
                this.spawnSpecificObject('maleVote');
                console.log('🔄 Spawning male vote object');
            }
            if (femaleCount < minFemale) {
                this.spawnSpecificObject('femaleVote');
                console.log('🔄 Spawning female vote object');
            }
            
            // Clean up objects that have fallen off screen
            this.cleanupObjects();
        }, currentIsMobile ? 3000 : 2500); // Slightly slower spawning on mobile
    }

    spawnSpecificObject(imageName) {
        const width = window.innerWidth;
        const x = Math.random() * (width - 200) + 100;
        const y = -100; // Start above the screen
        
        const imageObj = this.images[imageName];
        if (!imageObj) return;

        const object = this.createImageObject(x, y, imageName, imageObj);
        
        if (object) {
            // Store the image name for tracking
            object.imageName = imageName;
            this.objects.push(object);
            Composite.add(this.engine.world, object);
        }
    }

    spawnRandomObject() {
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
            return; // Both types at limit
        }

        const width = window.innerWidth;
        const x = Math.random() * (width - 200) + 100;
        const y = -100; // Start above the screen

        const imageObj = this.images[imageName];
        const object = this.createImageObject(x, y, imageName, imageObj);
        
        if (object) {
            // Store the image name for tracking
            object.imageName = imageName;
            this.objects.push(object);
            Composite.add(this.engine.world, object);
        }
    }

    cleanupObjects() {
        const height = window.innerHeight;
        const isMobile = window.innerWidth <= 768;
        
        // Store initial count for debugging
        const initialCount = this.objects.length;
        
        this.objects = this.objects.filter(object => {
            // On mobile, be much more lenient with cleanup to prevent objects from disappearing
            const cleanupThreshold = isMobile ? height + 800 : height + 300;
            
            if (object.position.y > cleanupThreshold) {
                console.log(`🗑️ Removing object at y=${Math.round(object.position.y)}, threshold=${cleanupThreshold}`);
                Composite.remove(this.engine.world, object);
                return false;
            }
            return true;
        });
        
        const removedCount = initialCount - this.objects.length;
        if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} objects. Remaining: ${this.objects.length}`);
        }
        
        // On mobile, ensure we always have minimum objects and respawn immediately if needed
        if (isMobile) {
            this.ensureMobileObjects();
        }
    }

    ensureMobileObjects() {
        const currentMaleCount = this.objects.filter(obj => obj.imageName === 'maleVote').length;
        const currentFemaleCount = this.objects.filter(obj => obj.imageName === 'femaleVote').length;
        const totalCount = this.objects.length;
        
        console.log(`📱 Mobile check: Male=${currentMaleCount}, Female=${currentFemaleCount}, Total=${totalCount}`);
        
        // Ensure we always have at least 2 of each type and minimum 4 total on mobile
        if (totalCount < 4 || currentMaleCount < 1 || currentFemaleCount < 1) {
            console.log('🚨 Mobile objects below minimum, respawning...');
            
            // Spawn missing male objects
            while (this.objects.filter(obj => obj.imageName === 'maleVote').length < 2) {
                this.spawnSpecificObject('maleVote');
            }
            
            // Spawn missing female objects  
            while (this.objects.filter(obj => obj.imageName === 'femaleVote').length < 2) {
                this.spawnSpecificObject('femaleVote');
            }
        }
    }

    spawnMobileObjects() {
        console.log('🔄 Mobile respawn triggered');
        this.ensureMobileObjects();
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const maxScroll = 500;
        const scrollRatio = Math.min(scrollY / maxScroll, 1);
        const isMobile = window.innerWidth <= 768;
        
        // On mobile, reduce the gravity changes and wind effects to keep objects more stable
        if (isMobile) {
            // Keep gravity more stable on mobile
            this.engine.world.gravity.y = 1.2 + (scrollRatio * 0.3);
            
            // Reduce wind effect on mobile
            if (scrollRatio > 0.4) {
                this.objects.forEach(object => {
                    const windForce = {
                        x: (Math.random() - 0.5) * 0.001 * scrollRatio,
                        y: 0
                    };
                    Body.applyForce(object, object.position, windForce);
                });
            }
            
            // On mobile, when user scrolls back to top, ensure objects are visible
            if (scrollY < 100 && this.objects.length < 4) {
                this.spawnMobileObjects();
            }
        } else {
            // Desktop behavior (original)
            this.engine.world.gravity.y = 1.2 + (scrollRatio * 0.8);
            
            if (scrollRatio > 0.2) {
                this.objects.forEach(object => {
                    const windForce = {
                        x: (Math.random() - 0.5) * 0.002 * scrollRatio,
                        y: 0
                    };
                    Body.applyForce(object, object.position, windForce);
                });
            }
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

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

        // Remove old boundaries
        const allBodies = Composite.allBodies(this.engine.world);
        const boundaries = allBodies.filter(body => body.isStatic);
        Composite.remove(this.engine.world, boundaries);

        // Create new boundaries
        this.createBoundaries();

        // Check if we need to resize existing objects (mobile vs desktop)
        const isMobile = width <= 768;
        const baseScale = 0.15;
        const mobileScale = baseScale * 0.35;
        const newScale = isMobile ? mobileScale : baseScale;

        // Update existing objects with new scale if needed
        this.objects.forEach(object => {
            if (object.render && object.render.sprite) {
                const currentScale = object.render.sprite.xScale;
                const expectedScale = newScale;
                
                // Only update if scale is significantly different (to avoid constant updates)
                if (Math.abs(currentScale - expectedScale) > 0.01) {
                    object.render.sprite.xScale = expectedScale;
                    object.render.sprite.yScale = expectedScale;
                    
                    // Update physics body size
                    const imageObj = this.images[object.imageName];
                    if (imageObj) {
                        const newWidth = imageObj.width * expectedScale;
                        const newHeight = imageObj.height * expectedScale;
                        Body.scale(object, newWidth / (object.bounds.max.x - object.bounds.min.x), newHeight / (object.bounds.max.y - object.bounds.min.y));
                    }
                }
            }
        });
    }

    destroy() {
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
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Add click interaction for creating new objects
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
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
                // If both at limit, replace oldest object
                const oldestObject = this.objects[0];
                if (oldestObject) {
                    Composite.remove(this.engine.world, oldestObject);
                    this.objects.shift();
                    imageName = Math.random() < 0.5 ? 'maleVote' : 'femaleVote';
                } else {
                    return;
                }
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

        // Add mobile-specific visibility check when scrolling back to hero
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            console.log('📱 Setting up mobile-specific observers...');
            
            // Enhanced intersection observer for hero section
            let heroSectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    console.log(`👁️ Hero section intersection: ${entry.isIntersecting ? 'VISIBLE' : 'HIDDEN'}, objects: ${this.objects.length}`);
                    
                    if (entry.isIntersecting) {
                        // Hero section is visible again, ensure we have objects
                        console.log('🎯 Hero section is visible, checking objects...');
                        
                        // Immediate check
                        this.ensureMobileObjects();
                        
                        // Delayed check to handle any timing issues
                        setTimeout(() => {
                            this.ensureMobileObjects();
                        }, 1000);
                    }
                });
            }, { 
                threshold: 0.1, // Trigger earlier
                rootMargin: '50px' // Add some buffer
            });

            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSectionObserver.observe(heroSection);
                console.log('✅ Hero section observer attached');
            }
            
            // Additional scroll-based check for mobile
            let mobileScrollCheck = null;
            window.addEventListener('scroll', () => {
                if (mobileScrollCheck) clearTimeout(mobileScrollCheck);
                
                mobileScrollCheck = setTimeout(() => {
                    const scrollY = window.scrollY;
                    const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
                    
                    // If we're in the hero section area (top 1.5 screens)
                    if (scrollY < heroHeight * 1.5) {
                        console.log(`📍 Mobile scroll check at y=${scrollY}, ensuring objects...`);
                        this.ensureMobileObjects();
                    }
                }, 500); // Check 500ms after scroll stops
            });
        }

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
                this.navbar.style.borderColor = 'rgba(255, 107, 53, 0.4)';
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
    
    console.log('🎯 Grassroot Dynamics - Political Marketing Agency Website Loaded!');
    console.log('🚀 Matter.js Physics Demo with PNG Images Active');
    console.log('✨ Interactive falling PNG objects ready');
}); 