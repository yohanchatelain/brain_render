#!/bin/bash

if [ ! -d "meshes" ]; then
    mkdir -p meshes/cortical/desikan
    mkdir -p meshes/cortical/destrieux
    mkdir -p meshes/cortical/dkt
    mkdir -p meshes/subcortical
fi

# Downloading meshes for Brain4Blender if not already present
if [ ! -f "pial_DK_obj.tar.bz2" ]; then
  wget https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_DK_obj.tar.bz2
fi
if [ ! -f "pial_Destrieux_obj.tar.bz2" ]; then
  wget https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_Destrieux_obj.tar.bz2
fi
if [ ! -f "pial_DKT_obj.tar.bz2" ]; then
  wget https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_DKT_obj.tar.bz2
fi
if [ ! -f "subcortical_obj.tar.bz2" ]; then
  wget https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/subcortical_obj.tar.bz2
fi

tar  -C meshes/cortical/desikan/ -xf pial_DK_obj.tar.bz2
tar  -C meshes/cortical/destrieux/ -xf pial_Destrieux_obj.tar.bz2
tar  -C meshes/cortical/dkt/ -xf pial_DKT_obj.tar.bz2
tar  -C meshes/subcortical/ -xf subcortical_obj.tar.bz2
