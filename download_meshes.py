from templateflow.api import get
import nibabel as nib
import numpy as np
from skimage import measure
import trimesh

# 1. Get full probabilistic subcortical atlas
paths = get(template='MNI152NLin2009cAsym', resolution=1, suffix='dseg', atlas="Schaefer2018")
# Find the path that contains the "desc-400Parcels"

for path in paths:
    if 'desc-400Parcels' in str(path):
        break
print(f"Using atlas file: {path}")

# 2. Load the volume
img = nib.load(str(path))
data = img.get_fdata()

# 3. Example: Extract label index 10 (you must confirm this matches Thalamus in atlas LUT)
label_value = 10
binary_mask = (data == label_value)

# 4. Marching cubes to generate surface
verts, faces, _, _ = measure.marching_cubes(binary_mask.astype(np.uint8), level=0.5)
mesh = trimesh.Trimesh(vertices=verts, faces=faces)

# 5. Export to STL
mesh.export('tpl-MNI152NLin2009cAsym_label-L_Thalamus.stl')
