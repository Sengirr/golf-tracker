import { Target, Flag, MousePointer2, Box, Layers, Timer } from 'lucide-react';

export const DRILL_CATEGORIES = [
    { id: 'putt', label: 'Putt', color: '#386641' },
    { id: 'chip', label: 'Chip & Pitch', color: '#a7c957' },
    { id: 'range', label: 'Driving Range', color: '#6a994e' },
    { id: 'field', label: 'Campo', color: '#bc4749' },
    { id: 'class', label: 'Clase', color: '#390099' }
];

export const DRILLS = [
    // PUTT
    {
        id: 'putt_54_test',
        categoryId: 'range',
        label: 'Control de Distancia (Wedges)',
        description: '3 distancias con 54º y PW. 10 bolas cada una.',
        inputs: [
            { key: 'calibShort', label: 'Corta (54º ½ Swing)', max: 10 },
            { key: 'calibMid', label: 'Media (54º Full)', max: 10 },
            { key: 'calibLong', label: 'Larga (PW Full)', max: 10 }
        ],
        icon: Target
    },
    {
        id: 'putt_ladder',
        categoryId: 'putt',
        label: 'Putt Escalera',
        description: 'Serie de 27 bolas (Llano, Subida, Bajada).',
        inputs: [{ key: 'stairsSuccess', label: 'Aciertos', max: 27 }],
        icon: Layers
    },
    {
        id: 'putt_circuit',
        categoryId: 'putt',
        label: 'Circuito Agujas del Reloj',
        description: 'Completar vuelta al hoyo desde 1m sin fallar.',
        inputs: [{ key: 'puttCircuit', label: 'Completado', type: 'checkbox' }],
        icon: Timer
    },

    // CHIP
    {
        id: 'chip_landing',
        categoryId: 'chip',
        label: 'Control de Aterrizaje',
        description: 'Bolas que aterrizan en zona (radio 1m).',
        inputs: [{ key: 'chipLanding', label: 'Aciertos / 20', max: 20 }],
        icon: Box
    },
    {
        id: 'chip_up_down',
        categoryId: 'chip',
        label: 'Up & Down (Chip + 1 Putt)',
        description: 'Salvar el par desde fuera de green.',
        inputs: [{ key: 'upDown', label: 'Salvados / 10', max: 10 }],
        icon: Flag
    },
    {
        id: 'approach_2m',
        categoryId: 'chip',
        label: 'Approach Rodado',
        description: 'Dejar bola en radio 2m del hoyo.',
        inputs: [{ key: 'approachSuccess', label: 'Aciertos / 30', max: 30 }],
        icon: MousePointer2
    },

    // RANGE
    {
        id: 'range_tempo',
        categoryId: 'range',
        label: 'Tempo & Ritmo',
        description: 'Series enfocadas solo en el contacto.',
        inputs: [{ key: 'tempoSession', label: 'Valoración (1-10)', max: 10 }],
        icon: Timer
    },
    {
        id: 'range_shapes',
        categoryId: 'range',
        label: 'Efectos (Draw/Fade)',
        description: 'Intentar 10 draws y 10 fades.',
        inputs: [{ key: 'shapeSuccess', label: 'Conseguidos / 20', max: 20 }],
        icon: Layers
    },

    // FIELD
    {
        id: 'field_9holes',
        categoryId: 'field',
        label: '9 Hoyos',
        description: 'Ronda de práctica o torneo.',
        inputs: [{ key: 'fieldScore', label: 'Resultado Stableford', max: 50 }],
        icon: Flag
    },

    // CLASS
    {
        id: 'class_pro',
        categoryId: 'class',
        label: 'Clase con Profesor',
        description: 'Sesión técnica o revisión de swing.',
        inputs: [{ key: 'proClass', label: 'Asistencia', type: 'checkbox' }],
        icon: MousePointer2
    }
];

export const getAllDrills = (customDrills = []) => {
    // Force icon to be Target for all custom drills to prevent serialization crashes
    const safeCustom = (Array.isArray(customDrills) ? customDrills : [])
        .filter(d => d && typeof d === 'object')
        .map(d => ({ ...d, icon: Target }));
    return [...DRILLS, ...safeCustom];
};

export const getDrillById = (id, customDrills = []) => {
    const safeCustom = (Array.isArray(customDrills) ? customDrills : [])
        .filter(d => d && typeof d === 'object')
        .map(d => ({ ...d, icon: Target }));
    return [...DRILLS, ...safeCustom].find(d => d.id === id);
};

export const getDefaultWeeklyRoutine = () => ({
    monday: ['putt_54_test', 'putt_circuit'], // Default Monday
    tuesday: ['class_pro', 'range_tempo'],
    wednesday: [],
    thursday: ['approach_2m', 'putt_ladder'],
    friday: [],
    saturday: ['field_9holes'],
    sunday: []
});
