# Brain Cohen's d Visualizer

A web-based 3D brain visualization tool for displaying Cohen's d effect sizes across cortical and subcortical brain structures. Built with Three.js and designed to work with Brain for Blender mesh templates.

## 🚀 Live Demo

Visit the live demo at: `https://yourusername.github.io/brain-cohens-d-visualizer`

## ✨ Features

- **3D Brain Visualization**: Interactive 3D rendering of cortical and subcortical brain structures
- **Cohen's d Mapping**: Color-coded visualization based on effect sizes from CSV data
- **Flexible Data Input**: Upload CSV files with Structure and Cohen_d columns
- **Multiple Views**: Switch between cortical, subcortical, or combined views
- **Atlas Support**: Ready for Desikan-Killiany, Destrieux, and DKT atlases
- **Interactive Colorbar**: Adjustable min/max ranges for color mapping
- **Statistics Panel**: Real-time display of valid vs NaN value counts
- **GitHub Pages Ready**: Single HTML file deployment

## 📊 Data Format

Your CSV file should contain the following columns:

```csv
Structure,Cohen_d
lh_bankssts,1.5
rh_bankssts,-0.8
Left-Hippocampus,-1.8
Right-Hippocampus,-1.5
lh_superiorfrontal,2.1
Left-Amygdala,NaN
```

### Structure Naming Conventions

- **Cortical structures**: Use `lh_` or `rh_` prefixes for left/right hemisphere
- **Subcortical structures**: Use `Left-` or `Right-` prefixes
- **Supported structures**: Any structure name from FreeSurfer atlases

## 🛠️ Setup Instructions

### Method 1: Quick Start (GitHub Pages)

1. **Fork this repository** or create a new one
2. **Upload the files**:
   - `index.html` (main application)
   - `sample_data.csv` (example data)
   - `README.md` (this file)
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Select "/ (root)" folder
4. **Access your site** at `https://yourusername.github.io/repository-name`

### Method 2: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/brain-cohens-d-visualizer.git
   cd brain-cohens-d-visualizer
   ```

2. **Serve locally** (Python example):
   ```bash
   python -m http.server 8000
   ```

3. **Open browser** and navigate to `http://localhost:8000`

## 🧠 Adding Real Brain Meshes

The application supports both demo mode and real Brain for Blender meshes.

### Step 1: Download Brain Meshes

1. Visit [Brain for Blender](https://brainder.org/research/brain-for-blender/)
2. Download your preferred format:
   - [All OBJ files](https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/all_obj.tar.bz2) (recommended)
   - [All PLY files](https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/all_ply.tar.bz2)
3. Choose your atlas (Desikan-Killiany, Destrieux, or DKT)

### Step 2: Organize Mesh Files

Create this folder structure in your repository:

```
your-repository/
├── index.html
├── README.md
├── sample_data.csv
└── meshes/
    ├── cortical/
    │   ├── desikan/
    │   │   ├── lh_bankssts.obj
    │   │   ├── rh_bankssts.obj
    │   │   ├── lh_superiorfrontal.obj
    │   │   └── ...
    │   ├── destrieux/
    │   │   ├── lh_G_and_S_frontomargin.obj
    │   │   └── ...
    │   └── dkt/
    │       ├── lh_caudalanteriorcingulate.obj
    │       └── ...
    └── subcortical/
        ├── Left-Hippocampus.obj
        ├── Right-Hippocampus.obj
        ├── Left-Amygdala.obj
        ├── Right-Amygdala.obj
        └── ...
```

### Step 3: Enable Real Meshes

1. Upload the mesh files to your repository
2. In the application, check **"Use Real Brain Meshes"**
3. The application will automatically detect and load available mesh files
4. If files are missing, it will fall back to demo mode

### Automatic File Detection

The application tries multiple file paths and formats:
- `meshes/cortical/{atlas}/{structure}.obj`
- `meshes/cortical/{structure}.obj`  
- `meshes/subcortical/{structure}.obj`
- `meshes/{structure}.obj`
- Same paths with `.ply` extension

### Supported Atlases and Structures

**Desikan-Killiany Atlas** (68 cortical regions):
- Cortical: `lh_bankssts`, `rh_bankssts`, `lh_superiorfrontal`, etc.
- Subcortical: `Left-Hippocampus`, `Right-Hippocampus`, `Left-Amygdala`, etc.

**Destrieux Atlas** (148 cortical regions):
- Cortical: `lh_G_and_S_frontomargin`, `rh_G_and_S_frontomargin`, etc.

**DKT Atlas** (62 cortical regions):
- Cortical: `lh_caudalanteriorcingulate`, `rh_caudalanteriorcingulate`, etc.

## 🎮 Usage Guide

### Loading Data

1. **Upload CSV**: Click "Choose File" and select your CSV file
2. **View Statistics**: Check the statistics panel for data quality
3. **Adjust Range**: Use auto-range or manually set min/max values

### Navigation

- **Rotate**: Click and drag to orbit around the brain
- **Zoom**: Scroll wheel to zoom in/out
- **Select**: Click on structures to see details
- **Reset**: Use "Reset View" button to return to default position

### Visualization Options

- **View Types**: Switch between Cortical, Subcortical, or Both
- **Atlas Selection**: Choose from different brain atlases
- **Color Mapping**: Adjust the Cohen's d range for optimal contrast
- **Wireframe**: Toggle wireframe mode for structure outlines

## 🎨 Color Mapping

The visualization uses a blue-white-red color scheme:

- **Blue**: Negative Cohen's d values
- **White**: Values near zero
- **Red**: Positive Cohen's d values
- **Gray**: NaN (missing) values

## 📝 Sample Data

The project includes `sample_data.csv` with example Cohen's d values for testing:

- Cortical structures from both hemispheres
- Subcortical structures (hippocampus, amygdala, thalamus)
- Mix of positive, negative, and NaN values

## 🔧 Technical Details

### Dependencies

- **Three.js r128**: 3D rendering and mesh handling
- **OBJLoader & PLYLoader**: Real brain mesh loading from Brain for Blender
- **Papa Parse 5.3.0**: CSV file parsing
- **Modern Browser**: WebGL support required

### File Format Support

- **OBJ files**: Preferred format, good compatibility
- **PLY files**: Alternative format, smaller file sizes
- **CSV data**: Structure names must match mesh filenames (without extension)

### Loading System

- **Automatic Detection**: Tries multiple file paths and formats
- **Progressive Loading**: Shows loading progress for large datasets  
- **Fallback Mode**: Automatically switches to demo if meshes not found
- **Error Handling**: Graceful handling of missing or corrupted files

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance Notes

- Large mesh files may take time to load
- Consider using compressed formats for faster loading
- Level-of-detail (LOD) recommended for complex visualizations

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

The Brain for Blender meshes are licensed under Creative Commons Attribution-ShareAlike 3.0 Unported License by Anderson Winkler.

## 🙏 Acknowledgments

- **Brain for Blender**: Anderson Winkler for providing high-quality brain meshes
- **FreeSurfer**: For the brain atlas and segmentation tools
- **Three.js**: For the excellent 3D graphics library
- **Papa Parse**: For robust CSV parsing capabilities

## 📧 Support

If you encounter issues or have questions:

1. Check the [Issues](https://github.com/yourusername/brain-cohens-d-visualizer/issues) page
2. Create a new issue with detailed description
3. Include your browser version and error messages

## 🔄 Updates

Check the [Releases](https://github.com/yourusername/brain-cohens-d-visualizer/releases) page for version updates and new features.

---

**Made with ❤️ for neuroscience research**