#!/usr/bin/env python3
"""
TemplateFlow Subcortical Volume Processor
Downloads subcortical segmentations from TemplateFlow and converts them to 3D meshes
for web visualization.
"""

import numpy as np
import json
from pathlib import Path
import nibabel as nib
from skimage import measure
from scipy import ndimage
import argparse

try:
    from templateflow import api as tflow
    TEMPLATEFLOW_AVAILABLE = True
except ImportError:
    TEMPLATEFLOW_AVAILABLE = False
    print("Warning: templateflow not installed. Install with: pip install templateflow")

def list_available_templates():
    """List available templates to help with debugging"""
    if not TEMPLATEFLOW_AVAILABLE:
        return
    
    try:
        print("Checking available templates...")
        
        # List available templates
        templates = tflow.ls()
        print(f"Available templates: {templates[:10]}...")  # Show first 10
        
        # Check what's available for MNI152NLin2009cAsym
        mni_files = tflow.get('MNI152NLin2009cAsym', return_list=True)
        print(f"Available MNI152NLin2009cAsym files: {len(mni_files)}")
        
        # Show some example files
        for i, f in enumerate(mni_files[:5]):
            print(f"  {i+1}: {f}")
        
        # Look for segmentation files specifically
        seg_files = [f for f in mni_files if 'seg' in str(f).lower()]
        print(f"Segmentation files found: {len(seg_files)}")
        for f in seg_files[:3]:
            print(f"  - {f}")
            
    except Exception as e:
        print(f"Error listing templates: {e}")

def download_subcortical_atlas():
    """Download subcortical atlas from TemplateFlow with multiple fallback strategies"""
    if not TEMPLATEFLOW_AVAILABLE:
        raise ImportError("TemplateFlow is required. Install with: pip install templateflow")
    
    # List available files for debugging
    list_available_templates()
    
    print("\nAttempting to download atlas...")
    
    # Strategy 1: Standard FreeSurfer aseg
    strategies = [
        {
            'name': 'FreeSurfer aseg',
            'params': {
                'template': 'MNI152NLin2009cAsym',
                'resolution': 1,
                'desc': 'aseg',
                'suffix': 'dseg',
                'extension': '.nii.gz'
            }
        },
        {
            'name': 'Any dseg file',
            'params': {
                'template': 'MNI152NLin2009cAsym',
                'resolution': 1,
                'suffix': 'dseg'
            }
        },
        {
            'name': 'Lower resolution dseg',
            'params': {
                'template': 'MNI152NLin2009cAsym',
                'resolution': 2,
                'suffix': 'dseg'
            }
        },
        {
            'name': 'Any segmentation',
            'params': {
                'template': 'MNI152NLin2009cAsym',
                'suffix': 'seg'
            }
        },
        {
            'name': 'FSL MNI template',
            'params': {
                'template': 'MNI152NLin6Asym',
                'suffix': 'dseg'
            }
        }
    ]
    
    for strategy in strategies:
        try:
            print(f"Trying {strategy['name']}...")
            atlas_files = tflow.get(**strategy['params'])
            
            # Handle the case where tflow.get returns a list
            if isinstance(atlas_files, list):
                if len(atlas_files) == 0:
                    print(f"  No files found for {strategy['name']}")
                    continue
                atlas_file = atlas_files[0]
                print(f"  Found {len(atlas_files)} files, using: {Path(atlas_file).name}")
            else:
                atlas_file = atlas_files
                
            if atlas_file is None:
                print(f"  No file returned for {strategy['name']}")
                continue
                
            # Verify the file exists
            if Path(atlas_file).exists():
                print(f"Successfully found atlas: {atlas_file}")
                return atlas_file
            else:
                print(f"  File doesn't exist: {atlas_file}")
                
        except Exception as e:
            print(f"  Failed {strategy['name']}: {e}")
            continue
    
    raise ValueError("Could not download any suitable atlas from TemplateFlow")

def download_subcortical_atlas():
    """Download subcortical atlas from TemplateFlow"""
    if not TEMPLATEFLOW_AVAILABLE:
        raise ImportError("TemplateFlow is required. Install with: pip install templateflow")
    
    # Download MNI152NLin2009cAsym template with subcortical segmentation
    try:
        # First try to get the standard aseg segmentation
        atlas_files = tflow.get(
            'MNI152NLin2009cAsym',
            resolution=1,
            desc='aseg',
            suffix='dseg',
            extension='.nii.gz'
        )
        
        # Handle case where multiple files are returned
        if isinstance(atlas_files, list):
            if len(atlas_files) == 0:
                raise ValueError("No atlas files found")
            atlas_file = atlas_files[0]  # Use the first file
            print(f"Found {len(atlas_files)} atlas files, using: {atlas_file}")
        else:
            atlas_file = atlas_files
            
        if atlas_file is None:
            raise ValueError("No atlas file returned")
            
    except Exception as e:
        print(f"Failed to download aseg atlas: {e}")
        print("Trying alternative atlas...")
        
        # Try alternative: get any available segmentation
        try:
            atlas_files = tflow.get(
                'MNI152NLin2009cAsym',
                resolution=1,
                suffix='dseg',
                extension='.nii.gz'
            )
            
            if isinstance(atlas_files, list):
                if len(atlas_files) == 0:
                    raise ValueError("No alternative atlas files found")
                atlas_file = atlas_files[0]
                print(f"Using alternative atlas: {atlas_file}")
            else:
                atlas_file = atlas_files
                
        except Exception as e2:
            print(f"Failed to download alternative atlas: {e2}")
            print("Trying to get any MNI template...")
            
            # Last resort: get any MNI template
            try:
                atlas_files = tflow.get(
                    'MNI152NLin2009cAsym',
                    resolution=2,  # Lower resolution might be more available
                    suffix='dseg'
                )
                
                if isinstance(atlas_files, list):
                    if len(atlas_files) == 0:
                        raise ValueError("No template files found")
                    atlas_file = atlas_files[0]
                    print(f"Using lower resolution template: {atlas_file}")
                else:
                    atlas_file = atlas_files
                    
            except Exception as e3:
                raise ValueError(f"Could not download any suitable atlas: {e3}")
    
    print(f"Successfully obtained atlas file: {atlas_file}")
    return atlas_file

def get_subcortical_labels():
    """Define subcortical structure labels based on FreeSurfer atlas"""
    return {
        10: 'Left-Thalamus',
        11: 'Left-Caudate', 
        12: 'Left-Putamen',
        13: 'Left-Pallidum',
        17: 'Left-Hippocampus',
        18: 'Left-Amygdala',
        26: 'Left-Accumbens',
        49: 'Right-Thalamus',
        50: 'Right-Caudate',
        51: 'Right-Putamen', 
        52: 'Right-Pallidum',
        53: 'Right-Hippocampus',
        54: 'Right-Amygdala',
        58: 'Right-Accumbens'
    }

def create_mesh_from_volume(volume_data, label_value, smoothing_iterations=2):
    """Convert volume data to 3D mesh using marching cubes"""
    # Extract binary mask for the specific label
    mask = (volume_data == label_value).astype(np.uint8)
    
    if mask.sum() == 0:
        return None
    
    # Apply smoothing to reduce noise
    if smoothing_iterations > 0:
        mask = ndimage.binary_opening(mask, iterations=smoothing_iterations)
        mask = ndimage.binary_closing(mask, iterations=smoothing_iterations)
    
    # Generate mesh using marching cubes
    try:
        vertices, faces, normals, values = measure.marching_cubes(
            mask, 
            level=0.5,
            spacing=(1.0, 1.0, 1.0)
        )
        
        # Convert to RAS coordinates (from voxel coordinates)
        # Standard MNI space transformation
        vertices = vertices - np.array([91, 109, 91])  # Center at origin
        vertices = vertices * np.array([-1, -1, 1])    # Convert to RAS
        
        return {
            'vertices': vertices.tolist(),
            'faces': faces.tolist(),
            'normals': normals.tolist()
        }
    except ValueError as e:
        print(f"Warning: Could not generate mesh for label {label_value}: {e}")
        return None

def process_templateflow_data(output_dir='subcortical_meshes'):
    """Main processing function"""
    print("Downloading TemplateFlow subcortical atlas...")
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    try:
        # Download atlas
        atlas_file = download_subcortical_atlas()
        print(f"Downloaded atlas: {atlas_file}")
        
        # Verify the file exists and is readable
        if not Path(atlas_file).exists():
            raise FileNotFoundError(f"Atlas file does not exist: {atlas_file}")
        
        # Load volume data
        print("Loading atlas data...")
        atlas_img = nib.load(atlas_file)
        atlas_data = atlas_img.get_fdata().astype(int)
        
        print(f"Atlas shape: {atlas_data.shape}")
        unique_labels = np.unique(atlas_data)
        print(f"Unique labels found: {len(unique_labels)} labels")
        print(f"Label range: {unique_labels.min()} to {unique_labels.max()}")
        
        # Show some of the labels
        if len(unique_labels) > 10:
            print(f"Sample labels: {unique_labels[:10]}...")
        else:
            print(f"All labels: {unique_labels}")
        
        # Get subcortical structure definitions
        subcortical_labels = get_subcortical_labels()
        
        # Check which labels are actually present
        available_labels = {}
        for label_id, structure_name in subcortical_labels.items():
            if label_id in unique_labels:
                available_labels[label_id] = structure_name
            else:
                print(f"Warning: Label {label_id} ({structure_name}) not found in atlas")
        
        print(f"Found {len(available_labels)} subcortical structures in atlas")
        
        if len(available_labels) == 0:
            print("No expected subcortical labels found. This might not be a FreeSurfer-style segmentation.")
            print("Available labels:", unique_labels[unique_labels > 0][:20])  # Show first 20 non-zero labels
            
            # Try to use any available labels as a fallback
            print("Attempting to use available labels...")
            fallback_structures = {
                'Structure_' + str(label): f'Unknown_Structure_{label}' 
                for label in unique_labels[1:min(11, len(unique_labels))]  # Skip 0, take up to 10 structures
            }
            available_labels = {int(k.split('_')[1]): v for k, v in fallback_structures.items()}
        
        # Process each structure
        all_meshes = {}
        
        for label_id, structure_name in available_labels.items():
            print(f"Processing {structure_name} (label {label_id})...")
            
            # Check how many voxels this structure has
            voxel_count = np.sum(atlas_data == label_id)
            print(f"  Found {voxel_count} voxels")
            
            if voxel_count < 10:
                print(f"  Skipping {structure_name} - too few voxels")
                continue
            
            # Create mesh for this structure
            mesh_data = create_mesh_from_volume(atlas_data, label_id)
            
            if mesh_data is not None:
                all_meshes[structure_name] = mesh_data
                print(f"  Generated mesh with {len(mesh_data['vertices'])} vertices")
            else:
                print(f"  Warning: No mesh generated for {structure_name}")
        
        if len(all_meshes) == 0:
            raise ValueError("No meshes could be generated from the atlas data")
        
        # Save all meshes to JSON file
        output_file = output_path / 'subcortical_meshes.json'
        with open(output_file, 'w') as f:
            json.dump(all_meshes, f, indent=2)
        
        print(f"\nSaved {len(all_meshes)} meshes to {output_file}")
        
        # Create a simplified version for faster loading
        simplified_meshes = {}
        for name, mesh in all_meshes.items():
            # Downsample vertices for web display
            vertices = np.array(mesh['vertices'])
            faces = np.array(mesh['faces'])
            
            # Simple decimation - keep every nth vertex
            if len(vertices) > 1000:
                step = max(1, len(vertices) // 500)  # Target ~500 vertices
                keep_indices = np.arange(0, len(vertices), step)
                vertices = vertices[keep_indices]
                
                # Update faces (simplified approach)
                face_mapping = {old_idx: new_idx for new_idx, old_idx in enumerate(keep_indices)}
                new_faces = []
                for face in faces:
                    if all(v in face_mapping for v in face):
                        new_faces.append([face_mapping[v] for v in face])
                
                if len(new_faces) > 0:
                    simplified_meshes[name] = {
                        'vertices': vertices.tolist(),
                        'faces': new_faces,
                        'normals': mesh['normals'][:len(vertices)] if len(mesh['normals']) >= len(vertices) else []
                    }
                else:
                    # If face mapping failed, just use original
                    simplified_meshes[name] = mesh
            else:
                simplified_meshes[name] = mesh
        
        # Save simplified version
        simplified_file = output_path / 'subcortical_meshes_simplified.json'
        with open(simplified_file, 'w') as f:
            json.dump(simplified_meshes, f, indent=2)
        
        print(f"Saved simplified meshes to {simplified_file}")
        
        return output_file, simplified_file
        
    except Exception as e:
        print(f"Error processing TemplateFlow data: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def create_sample_data():
    """Create sample mesh data if TemplateFlow is not available"""
    print("Creating sample subcortical mesh data...")
    
    # Simple geometric approximations for demonstration
    sample_meshes = {
        'Left-Hippocampus': generate_curved_mesh([-25, -15, -10], scale=0.8),
        'Right-Hippocampus': generate_curved_mesh([25, -15, -10], scale=0.8),
        'Left-Amygdala': generate_almond_mesh([-20, -5, -25], scale=0.6),
        'Right-Amygdala': generate_almond_mesh([20, -5, -25], scale=0.6),
        'Left-Thalamus': generate_ellipsoid_mesh([-8, -3, -2], scale=0.7),
        'Right-Thalamus': generate_ellipsoid_mesh([8, -3, -2], scale=0.7),
    }
    
    # Save sample data
    output_path = Path('subcortical_meshes')
    output_path.mkdir(exist_ok=True)
    
    output_file = output_path / 'subcortical_meshes_sample.json'
    with open(output_file, 'w') as f:
        json.dump(sample_meshes, f, indent=2)
    
    print(f"Saved sample meshes to {output_file}")
    return output_file

def generate_ellipsoid_mesh(center, scale=1.0):
    """Generate a simple ellipsoid mesh"""
    # Create sphere vertices
    phi = np.linspace(0, 2*np.pi, 20)
    theta = np.linspace(0, np.pi, 15)
    phi_grid, theta_grid = np.meshgrid(phi, theta)
    
    x = scale * np.sin(theta_grid) * np.cos(phi_grid) + center[0]
    y = scale * np.sin(theta_grid) * np.sin(phi_grid) + center[1] 
    z = scale * np.cos(theta_grid) + center[2]
    
    vertices = np.column_stack((x.flatten(), y.flatten(), z.flatten()))
    
    # Create triangular faces
    faces = []
    for i in range(len(theta) - 1):
        for j in range(len(phi) - 1):
            # Two triangles per quad
            v1 = i * len(phi) + j
            v2 = i * len(phi) + (j + 1)
            v3 = (i + 1) * len(phi) + j
            v4 = (i + 1) * len(phi) + (j + 1)
            
            faces.append([v1, v2, v3])
            faces.append([v2, v4, v3])
    
    return {
        'vertices': vertices.tolist(),
        'faces': faces,
        'normals': []  # Will be computed in JavaScript
    }

def generate_curved_mesh(center, scale=1.0):
    """Generate a curved hippocampus-like mesh"""
    # Create a curved tube
    t = np.linspace(0, 2*np.pi, 30)
    s = np.linspace(0, 1, 10)
    
    vertices = []
    for i, t_val in enumerate(t):
        for j, s_val in enumerate(s):
            # Curved path
            x = scale * (2 * s_val - 1) * np.cos(t_val * 0.5) + center[0]
            y = scale * 0.3 * np.sin(t_val) + center[1]
            z = scale * s_val * 2 + center[2]
            vertices.append([x, y, z])
    
    # Create faces
    faces = []
    for i in range(len(t) - 1):
        for j in range(len(s) - 1):
            v1 = i * len(s) + j
            v2 = i * len(s) + (j + 1)
            v3 = (i + 1) * len(s) + j
            v4 = (i + 1) * len(s) + (j + 1)
            
            faces.append([v1, v2, v3])
            faces.append([v2, v4, v3])
    
    return {
        'vertices': vertices,
        'faces': faces,
        'normals': []
    }

def generate_almond_mesh(center, scale=1.0):
    """Generate an almond-shaped amygdala mesh"""
    return generate_ellipsoid_mesh(center, scale)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process TemplateFlow subcortical data')
    parser.add_argument('--output-dir', default='subcortical_meshes', 
                       help='Output directory for mesh files')
    parser.add_argument('--sample-only', action='store_true',
                       help='Generate sample data only (no TemplateFlow download)')
    parser.add_argument('--list-templates', action='store_true',
                       help='List available TemplateFlow templates and exit')
    
    args = parser.parse_args()
    
    if args.list_templates:
        if TEMPLATEFLOW_AVAILABLE:
            list_available_templates()
        else:
            print("TemplateFlow not available. Install with: pip install templateflow")
        exit(0)
    
    if args.sample_only or not TEMPLATEFLOW_AVAILABLE:
        if not TEMPLATEFLOW_AVAILABLE:
            print("TemplateFlow not available, generating sample data...")
        else:
            print("Generating sample data as requested...")
        create_sample_data()
    else:
        print("Attempting to download and process TemplateFlow data...")
        result = process_templateflow_data(args.output_dir)
        
        if result == (None, None):
            print("\nTemplateFlow processing failed. Generating sample data as fallback...")
            create_sample_data()
    
    print("\nSetup complete! Next steps:")
    print("1. Copy the generated JSON files to your web server/GitHub Pages repository")
    print("2. Open the HTML viewer in a web browser")
    print("3. The viewer will automatically load the mesh data")
    print("\nFor better results, ensure you have:")
    print("- templateflow installed: pip install templateflow")
    print("- nibabel: pip install nibabel") 
    print("- scikit-image: pip install scikit-image")
    print("- scipy: pip install scipy")
    print("\nIf TemplateFlow download fails, the sample data will still provide")
    print("a good approximation of subcortical brain structures.")