// CDN Script Loading Utilities
function loadScript(src, callback, fallback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = fallback || function () {
        console.warn('Failed to load script:', src);
    };
    document.head.appendChild(script);
}

// Load OBJLoader with fallback
loadScript(
    'https://unpkg.com/three@0.128.0/examples/js/loaders/OBJLoader.js',
    function () { console.log('OBJLoader loaded successfully'); },
    function () {
        loadScript(
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
            function () { console.log('OBJLoader loaded from fallback CDN'); },
            function () { console.warn('Could not load OBJLoader from any CDN'); }
        );
    }
);

// Load PLYLoader with fallback (optional)
loadScript(
    'https://unpkg.com/three@0.128.0/examples/js/loaders/PLYLoader.js',
    function () { console.log('PLYLoader loaded successfully'); },
    function () {
        loadScript(
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/PLYLoader.js',
            function () { console.log('PLYLoader loaded from fallback CDN'); },
            function () { console.warn('PLYLoader not available - will use OBJ files only'); }
        );
    }
);