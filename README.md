# Brain Cohen's d Visualizer

A sophisticated web-based 3D brain visualization tool for displaying Cohen's d effect sizes across cortical and subcortical brain structures. Features gallery browsing, NAVR thresholding, data export, and advanced visualization controls.

## 🚀 Live Demo

Visit the live demo at: `https://yohanchatelain.github.io/brain_render`

## ✨ Core Features

### 🧠 3D Brain Visualization
- **Interactive 3D Rendering**: Real-time THREE.js-powered brain visualization
- **Dual View Support**: Switch between cortical and subcortical structures
- **Multiple Atlas Support**: Desikan-Killiany, Destrieux, and DKT atlases
- **Advanced Camera Controls**: Orbit, trackball, fly, and map control modes
- **Theme System**: Dark/light mode with optimized lighting for each theme

### 📊 Data Management
- **Gallery Browser**: Curated collection of neuroimaging datasets from research papers
- **Random Dataset Loading**: Quick exploration with random example selection
- **CSV Upload Support**: Flexible data import with multiple Cohen's d column formats
- **Structure Name Normalization**: Automatic mapping between naming conventions (ENIGMA, FreeSurfer)
- **NAVR Thresholding**: Statistical reliability filtering with corrected thresholds
- **Data Export**: Export processed data in CSV or JSON formats with metadata

### 🎨 Advanced Visualization
- **Color Mapping**: Blue-white-red scheme with adjustable ranges
- **Thresholded Region Visualization**: Toggle visibility and customize colors
- **Real-time Statistics**: Live calculation of valid, thresholded, and total structures
- **Interactive Info Panels**: Click structures for detailed information
- **Diffused Lighting**: Optimized lighting system to reduce harsh contrasts

### 🔧 Technical Excellence
- **Modular Architecture**: Clean, documented, maintainable codebase
- **Comprehensive Error Handling**: Robust validation and user feedback
- **Performance Optimized**: Efficient mesh loading and rendering
- **Browser Compatible**: Modern WebGL-enabled browsers

## 📊 Data Formats

### CSV Input Format

Your CSV file should contain structure names, Cohen's d values and population size:

```csv
Structure,Cohen_d,population_size
lh_bankssts,1.5,100
rh_bankssts,-0.8,100
Left-Hippocampus,-1.8,100
Right-Hippocampus,-1.5,100
L_superiorfrontal,2.1,100
Laccumb,-0.3,100
```

### Supported Column Names
- `Cohen_d`, `d_icv`, `Cohen_d_thresholded`, `d_icv_thresholded`

### Structure Naming Conventions

The application automatically normalizes structure names from various conventions:

**ENIGMA Format → FreeSurfer Format:**
- `L_bankssts` → `lh_bankssts`
- `R_bankssts` → `rh_bankssts`
- `Laccumb` → `Left-Accumbens-area`
- `Rhippo` → `Right-Hippocampus`

**Supported Prefixes:**
- **Cortical**: `lh_`, `rh_`, `L_`, `R_`
- **Subcortical**: `Left-`, `Right-`, `L`, `R`

## 🎨 Gallery System

### Browse Curated Datasets
- **Research Papers**: Datasets from published neuroimaging studies
- **Disease Categories**: ADHD, ASD, Depression, Schizophrenia, and more
- **Multiple Metrics**: Cortical thickness, surface area, subcortical volume
- **Paper Information**: Detailed metadata and publication links

### Quick Access Features
- **🎲 Random Example**: Load a random dataset for quick exploration
- **Hierarchical Selection**: Paper → Disease → Metric → Subgroup
- **Auto-configuration**: Automatic view and metric setup based on dataset

## 🔬 NAVR Thresholding

### Statistical Reliability Filtering
- **NAVR Correction**: Apply neuroanatomical variance and reliability thresholds
- **Atlas-Specific**: Threshold data for Desikan, Destrieux, and DKT atlases
- **Metric-Aware**: Different thresholds for thickness, area, and volume
- **Visualization**: Toggle thresholded regions visibility with custom colors

### Threshold Application
1. Load your CSV data
2. Select the appropriate metric (thickness/area/volume)
3. Load NAVR data automatically
4. Apply/remove thresholds with one click
5. Export thresholded data for further analysis

## 🛠️ Setup Instructions

### Method 1: Quick Start (GitHub Pages)

1. **Fork this repository** or create a new one
2. **Upload the complete project**:
   ```
   brain_render/
   ├── index.html
   ├── style.css
   ├── js/
   │   ├── main-app.js
   │   ├── scene-renderer.js
   │   ├── data-processing.js
   │   ├── gallery-manager.js
   │   ├── mesh-loader.js
   │   ├── camera-controls.js
   │   ├── atlas-definitions.js
   │   └── loaders.js
   ├── data/
   │   └── [atlas directories with NAVR files]
   ├── gallery/
   │   ├── index.json
   │   └── [dataset files]
   └── meshes/
       └── [brain mesh files]
   ```
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch, "/ (root)" folder
4. **Access your site** at `https://yourusername.github.io/brain_render`

### Method 2: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/brain-cohens-d-visualizer.git
   cd brain-cohens-d-visualizer
   ```

2. **Serve locally** (required for file loading):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```

3. **Open browser** and navigate to `http://localhost:8000`

## 🧠 Adding Brain Meshes

### Download Brain for Blender Meshes

1. Visit [Brain for Blender](https://brainder.org/research/brain-for-blender/)
2. Download mesh files:
   - [All OBJ files](https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/all_obj.tar.bz2) (recommended)
   - [All PLY files](https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/all_ply.tar.bz2)

### Organize Mesh Structure

```
meshes/
├── cortical/
│   ├── desikan/
│   │   ├── lh_bankssts.obj
│   │   ├── rh_bankssts.obj
│   │   ├── lh_superiorfrontal.obj
│   │   └── [68 cortical regions]
│   ├── destrieux/
│   │   ├── lh_G_and_S_frontomargin.obj
│   │   └── [148 cortical regions]
│   └── dkt/
│       ├── lh_caudalanteriorcingulate.obj
│       └── [62 cortical regions]
└── subcortical/
    ├── Left-Hippocampus.obj
    ├── Right-Hippocampus.obj
    ├── Left-Amygdala.obj
    ├── Right-Amygdala.obj
    ├── Left-Caudate.obj
    ├── Right-Caudate.obj
    └── [16 subcortical structures]
```

## 📈 Gallery Data Structure

### Adding Custom Datasets

Create or update `gallery/index.json`:

```json
[
  {
    "paper": "Your Study 2024",
    "disease": "Depression",
    "metric": "thickness",
    "subgroup": "adults",
    "file": "your_study/depression_thickness_adults.csv",
    "description": "your_study/desc/depression_thickness_adults.json"
  }
]
```

Add description file `gallery/your_study/desc/depression_thickness_adults.json`:

```json
{
  "title": "Cortical Thickness in Major Depression",
  "authors": "Smith et al.",
  "year": "2024",
  "journal": "NeuroImage",
  "sample_size": "150 patients, 120 controls",
  "url": "https://doi.org/10.1016/j.neuroimage.2024.xxxxx"
}
```

## 🎮 Usage Guide

### Basic Workflow

1. **Browse Gallery**: Click "Browse Gallery" → Select paper → disease → metric → subgroup
2. **Or Upload Data**: Select metric → upload CSV file
3. **Load NAVR Data**: Automatic loading for statistical thresholding
4. **Apply Thresholds**: Toggle NAVR thresholding on/off
5. **Customize Visualization**: Adjust colors, ranges, and display options
6. **Export Results**: Download processed data in CSV or JSON format

### Advanced Features

#### Camera Controls
- **Orbit Mode**: Standard rotation around center point
- **Trackball Mode**: Free rotation in any direction
- **Fly Mode**: First-person navigation
- **Map Mode**: 2D-style pan and zoom

#### Theme System
- **Dark Mode**: Optimized for low-light environments
- **Light Mode**: Clean, bright interface
- **Custom Colors**: Scene background and thresholded region colors

#### Export Options
- **CSV Format**: Clean tabular data with original and thresholded values
- **JSON Format**: Structured data with comprehensive metadata
- **Metadata Included**: Export date, threshold status, atlas info, statistics

## 🔧 Technical Architecture

### Core Modules

#### `gallery-manager.js`
- Gallery browsing and dataset selection
- Hierarchical filtering (paper → disease → metric → subgroup)
- Random dataset loading
- Paper information display

#### `data-processing.js`
- CSV parsing and validation
- Structure name normalization
- NAVR data loading and processing
- Thresholding algorithms
- Data export functionality

#### `scene-renderer.js`
- THREE.js scene management
- Lighting system with theme support
- Brain mesh rendering and coloring
- User interaction handling
- Camera controls integration

#### `mesh-loader.js`
- Brain mesh file loading (OBJ/PLY)
- Automatic file path detection
- Error handling and fallbacks
- Loading progress tracking

### Dependencies

- **THREE.js r128**: 3D rendering engine
- **Papa Parse 5.3.0**: CSV parsing library
- **OrbitControls, TrackballControls**: Camera control systems
- **BufferGeometryUtils**: Mesh optimization

### Browser Requirements

- **WebGL Support**: Required for 3D rendering
- **Modern JavaScript**: ES6+ features used
- **File API**: For local file uploads
- **Fetch API**: For data loading

**Compatibility:**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📊 Performance Optimization

### Efficient Rendering
- **Diffused Lighting**: Reduced harsh shadows and contrasts
- **Optimized Materials**: Efficient shader usage
- **LOD Support**: Level-of-detail for complex scenes

### Data Processing
- **Incremental Loading**: Progressive data loading
- **Memory Management**: Efficient data structures
- **Error Recovery**: Graceful handling of missing data

### Network Optimization
- **Compressed Assets**: Optimized file sizes
- **Parallel Loading**: Concurrent resource fetching
- **Caching Strategy**: Browser cache utilization

## 🤝 Contributing

### Development Setup

1. **Fork and clone** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code standards**: JSDoc comments, error handling, logging
4. **Test thoroughly**: Cross-browser compatibility
5. **Submit pull request**: Detailed description and examples

### Code Standards

- **Documentation**: JSDoc comments for all functions
- **Error Handling**: Try-catch blocks and user feedback
- **Logging**: Consistent debug messaging with module prefixes
- **Validation**: Input checking and defensive programming

### Testing Guidelines

- **Browser Testing**: Multiple browsers and versions
- **Data Validation**: Various CSV formats and edge cases
- **Performance**: Large datasets and complex visualizations
- **Accessibility**: Keyboard navigation and screen readers

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

**Third-party Assets:**
- Brain for Blender meshes: Creative Commons Attribution-ShareAlike 3.0 Unported License by Anderson Winkler
- THREE.js: MIT License
- Papa Parse: MIT License

## 🙏 Acknowledgments

- **Anderson Winkler**: Brain for Blender mesh library
- **FreeSurfer Team**: Brain atlas and segmentation tools
- **THREE.js Contributors**: Excellent 3D graphics framework
- **Papa Parse Team**: Robust CSV parsing library
- **ENIGMA Consortium**: Neuroimaging data standards
- **Neuroscience Community**: Research datasets and feedback

## 📧 Support

### Getting Help

1. **Check Documentation**: Review this README and inline comments
2. **Search Issues**: [GitHub Issues](https://github.com/yourusername/brain-cohens-d-visualizer/issues)
3. **Create New Issue**: Detailed bug reports or feature requests
4. **Community Discussions**: [GitHub Discussions](https://github.com/yourusername/brain-cohens-d-visualizer/discussions)

### Bug Reports

Include the following information:
- Browser version and operating system
- Error messages and console logs
- Steps to reproduce the issue
- Sample data files (if applicable)
- Screenshots or recordings

## 🔄 Version History

### Latest Features
- ✅ Gallery system with curated datasets
- ✅ Random dataset loading
- ✅ NAVR statistical thresholding
- ✅ Data export (CSV/JSON)
- ✅ Theme system (dark/light mode)
- ✅ Diffused lighting system
- ✅ Structure name normalization
- ✅ Comprehensive error handling
- ✅ Modular, documented codebase

### Roadmap
- 🔄 Additional atlas support
- 🔄 Advanced statistical visualizations
- 🔄 Multi-dataset comparisons
- 🔄 REST API integration
- 🔄 Collaborative features

---

**Made with ❤️ for neuroscience research**

*Empowering researchers to visualize and understand brain structure differences through interactive 3D visualization.*