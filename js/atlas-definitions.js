// Brain structure definitions for different atlases
const brainAtlases = {
    desikan: {
        cortical: [
            'lh_bankssts', 'rh_bankssts', 'lh_caudalanteriorcingulate', 'rh_caudalanteriorcingulate',
            'lh_caudalmiddlefrontal', 'rh_caudalmiddlefrontal', 'lh_cuneus', 'rh_cuneus',
            'lh_entorhinal', 'rh_entorhinal', 'lh_fusiform', 'rh_fusiform',
            'lh_inferiorparietal', 'rh_inferiorparietal', 'lh_inferiortemporal', 'rh_inferiortemporal',
            'lh_isthmuscingulate', 'rh_isthmuscingulate', 'lh_lateraloccipital', 'rh_lateraloccipital',
            'lh_lateralorbitofrontal', 'rh_lateralorbitofrontal', 'lh_lingual', 'rh_lingual',
            'lh_medialorbitofrontal', 'rh_medialorbitofrontal', 'lh_middletemporal', 'rh_middletemporal',
            'lh_parahippocampal', 'rh_parahippocampal', 'lh_paracentral', 'rh_paracentral',
            'lh_parsopercularis', 'rh_parsopercularis', 'lh_parsorbitalis', 'rh_parsorbitalis',
            'lh_parstriangularis', 'rh_parstriangularis', 'lh_pericalcarine', 'rh_pericalcarine',
            'lh_postcentral', 'rh_postcentral', 'lh_posteriorcingulate', 'rh_posteriorcingulate',
            'lh_precentral', 'rh_precentral', 'lh_precuneus', 'rh_precuneus',
            'lh_rostralanteriorcingulate', 'rh_rostralanteriorcingulate',
            'lh_rostralmiddlefrontal', 'rh_rostralmiddlefrontal', 'lh_superiorfrontal', 'rh_superiorfrontal',
            'lh_superiorparietal', 'rh_superiorparietal', 'lh_superiortemporal', 'rh_superiortemporal',
            'lh_supramarginal', 'rh_supramarginal', 'lh_frontalpole', 'rh_frontalpole',
            'lh_temporalpole', 'rh_temporalpole', 'lh_transversetemporal', 'rh_transversetemporal',
            'lh_insula', 'rh_insula'
        ],
        subcortical: [
            'Left-Lateral-Ventricle', 'Right-Lateral-Ventricle', 'Left-Inf-Lat-Vent', 'Right-Inf-Lat-Vent',
            'Left-Cerebellum-White-Matter', 'Right-Cerebellum-White-Matter', 'Left-Cerebellum-Cortex', 'Right-Cerebellum-Cortex',
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Pallidum', 'Right-Pallidum',
            'Left-Hippocampus', 'Right-Hippocampus', 'Left-Amygdala', 'Right-Amygdala',
            'Left-Accumbens-area', 'Right-Accumbens-area', 'Left-VentralDC', 'Right-VentralDC'
        ],
    },
    destrieux: {
        cortical: [
            'lh_G_and_S_frontomargin', 'rh_G_and_S_frontomargin', 'lh_G_and_S_occipital_inf', 'rh_G_and_S_occipital_inf',
            'lh_G_and_S_paracentral', 'rh_G_and_S_paracentral', 'lh_G_and_S_subcentral', 'rh_G_and_S_subcentral',
            'lh_G_and_S_transv_frontopol', 'rh_G_and_S_transv_frontopol', 'lh_G_and_S_cingul-Ant', 'rh_G_and_S_cingul-Ant',
            'lh_G_and_S_cingul-Mid-Ant', 'rh_G_and_S_cingul-Mid-Ant', 'lh_G_and_S_cingul-Mid-Post', 'rh_G_and_S_cingul-Mid-Post'
        ],
        subcortical: [
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Pallidum', 'Right-Pallidum',
            'Left-Hippocampus', 'Right-Hippocampus', 'Left-Amygdala', 'Right-Amygdala'
        ]
    },
    dkt: {
        cortical: [
            'lh_caudalanteriorcingulate', 'rh_caudalanteriorcingulate', 'lh_caudalmiddlefrontal', 'rh_caudalmiddlefrontal',
            'lh_cuneus', 'rh_cuneus', 'lh_entorhinal', 'rh_entorhinal', 'lh_fusiform', 'rh_fusiform',
            'lh_inferiorparietal', 'rh_inferiorparietal', 'lh_inferiortemporal', 'rh_inferiortemporal',
            'lh_isthmuscingulate', 'rh_isthmuscingulate', 'lh_lateraloccipital', 'rh_lateraloccipital'
        ],
        subcortical: [
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Hippocampus', 'Right-Hippocampus',
            'Left-Amygdala', 'Right-Amygdala'
        ]
    }
};

// Expose to window object for global access
window.brainAtlases = brainAtlases;