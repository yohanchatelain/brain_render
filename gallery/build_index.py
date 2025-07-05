import os
import json
import re
from pathlib import Path

GALLERY_DIR = os.path.join(os.path.dirname(__file__), '.')
INDEX_FILE = os.path.join(GALLERY_DIR, 'index.json')

def assert_is_metric(metric):
    valid_metrics = ['thickness', 'volume', 'area', 'subcortical_volume']
    if metric not in valid_metrics:
        raise ValueError(f"Invalid metric: {metric}. Valid metrics are: {valid_metrics}")
    return metric

def scan_gallery(directory):
  pattern = re.compile(
    r'^(?P<disease>[^_]+)_(?P<metric>thickness|area|volume|subcortical_volume)_(?P<subgroup>.+)_thresholded\.csv$'
  )
  index = []
  for root, dirs, files in os.walk(directory):
    for file in files:
      if file.endswith('.csv'):
        match = pattern.match(file)
        if match:
          rel_dir = os.path.relpath(root, GALLERY_DIR)
          rel_file = os.path.join(rel_dir, file) if rel_dir != '.' else file
          desc_file = rel_file.replace('.csv', '.json').replace('_thresholded', '')
          entry = {
            "paper": rel_file.split(os.sep)[0],
            "file": Path(rel_file).as_posix(),
            "description": Path(desc_file).as_posix(),
            "disease": match.group("disease"),
            "metric": assert_is_metric(match.group("metric")),
            "subgroup": match.group("subgroup")
          }
          index.append(entry)
  return sorted(index, key=lambda x: x["file"])

if __name__ == "__main__":
  images = scan_gallery(GALLERY_DIR)
  with open(INDEX_FILE, 'w') as f:
    json.dump(images, f, indent=2)
  print(f"Indexed {len(images)} images to {INDEX_FILE}")